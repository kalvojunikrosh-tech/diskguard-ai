"""macOS telemetry provider collecting read-only hardware I/O and filesystem activity."""
import collections
from datetime import datetime, timezone
import logging
import math
import os
import threading
import time
from typing import Optional

import psutil
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from backend.telemetry.base import BaseTelemetryProvider, TelemetrySnapshot

logger = logging.getLogger("diskguard.telemetry.macos")


def calculate_shannon_entropy(data: bytes) -> float:
    """Calculate Shannon entropy of byte data in bits per byte (0.0 - 8.0).

    Plaintext typically yields ~3.5-4.8 bits/byte.
    High-entropy encrypted or compressed data yields ~7.4-8.0 bits/byte.
    Entropy is one behavioral indicator and is not sufficient alone to identify ransomware.
    """
    if not data:
        return 0.0
    length = len(data)
    freq = collections.Counter(data)
    entropy = 0.0
    for count in freq.values():
        p = count / length
        if p > 0:
            entropy -= p * math.log2(p)
    return round(entropy, 4)


class FSEventTelemetryHandler(FileSystemEventHandler):
    """Safe, read-only event listener for local file creations, modifications, and renames."""

    def __init__(self):
        super().__init__()
        self._lock = threading.Lock()
        self.modifications_count = 0
        self.rename_count = 0
        self.latest_sample_entropy: Optional[float] = None

    def on_modified(self, event):
        if event.is_directory:
            return
        with self._lock:
            self.modifications_count += 1
            self._sample_entropy_safe(event.src_path)

    def on_created(self, event):
        if event.is_directory:
            return
        with self._lock:
            self.modifications_count += 1
            self._sample_entropy_safe(event.src_path)

    def on_moved(self, event):
        if event.is_directory:
            return
        with self._lock:
            self.rename_count += 1
            # Sample destination file if created by move/rename
            dest = getattr(event, "dest_path", None)
            if dest:
                self._sample_entropy_safe(dest)

    def _sample_entropy_safe(self, file_path: str):
        """Read a small sample (max 4KB) from file header to estimate Shannon entropy.

        Strictly read-only. File content and path are immediately discarded.
        """
        try:
            # Check size to avoid zero-length or virtual proc files
            if os.path.isfile(file_path):
                size = os.path.getsize(file_path)
                if 0 < size <= 100 * 1024 * 1024:  # Up to 100MB regular files
                    with open(file_path, "rb") as f:
                        header = f.read(4096)
                    if header:
                        self.latest_sample_entropy = calculate_shannon_entropy(header)
        except Exception:
            # Read failures on locked/temp files are expected and ignored safely
            pass

    def drain_counts(self):
        """Atomically read and reset event counts for the sampling window."""
        with self._lock:
            mods = self.modifications_count
            renames = self.rename_count
            entropy = self.latest_sample_entropy
            self.modifications_count = 0
            self.rename_count = 0
            # Keep latest_sample_entropy as the most recent known sample value
            return mods, renames, entropy


class MacOSTelemetryProvider(BaseTelemetryProvider):
    """Read-only macOS telemetry provider monitoring storage I/O and filesystem activity."""

    def __init__(self, device_id: str, mount_point: str = "/"):
        super().__init__(device_id=device_id, mount_point=mount_point)
        self._observer: Optional[Observer] = None
        self._fs_handler = FSEventTelemetryHandler()
        self._watch_path: str = self._resolve_safe_watch_path(mount_point)
        self._last_sample_time: float = time.time()
        self._last_io = self._query_io_counters()

    def _resolve_safe_watch_path(self, mount_point: str) -> str:
        """Resolve a safe, non-privileged path to observe user activity on the volume.

        Observing root / directly triggers macOS System Integrity Protection (SIP)
        errors on system directories. Instead, we observe user space on the system volume.
        For external / secondary volumes, watch the mount point directly.
        """
        if mount_point == "/":
            home = os.path.expanduser("~")
            if os.path.exists(home):
                return home
            return os.getcwd()

        # For external / secondary volumes, watch the target mount point
        return mount_point

    def _query_io_counters(self):
        """Query raw cumulative disk I/O counters from psutil."""
        try:
            per_disk = psutil.disk_io_counters(perdisk=True)
            if per_disk:
                # Direct match
                if self.device_id in per_disk:
                    return per_disk[self.device_id]
                # Strip partition suffix (e.g. disk0s2 -> disk0, disk3s1s1 -> disk0)
                clean_disk = self.device_id.split("s")[0]
                if clean_disk in per_disk:
                    return per_disk[clean_disk]
                if "disk0" in per_disk:
                    return per_disk["disk0"]

            # Fallback to total system counters
            return psutil.disk_io_counters(perdisk=False)
        except Exception as e:
            logger.warning("Failed to query psutil disk counters: %s", e)
            return None

    def start(self) -> None:
        """Start read-only filesystem observer."""
        if self._is_running:
            return

        try:
            self._observer = Observer()
            # Recursive watch on safe user directory
            self._observer.schedule(self._fs_handler, self._watch_path, recursive=True)

            # Also ensure dedicated sandbox directory is scheduled IF NOT already covered by _watch_path
            sandbox_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "sandbox"))
            watch_real = os.path.realpath(self._watch_path)
            if os.path.exists(sandbox_dir) and not sandbox_dir.startswith(watch_real + os.sep) and sandbox_dir != watch_real:
                try:
                    self._observer.schedule(self._fs_handler, sandbox_dir, recursive=True)
                except Exception:
                    pass

            self._observer.start()
            logger.info("Started macOS telemetry watcher on %s (device: %s)", self._watch_path, self.device_id)
        except Exception as e:
            logger.warning("Could not start recursive watchdog on %s: %s. Falling back to non-recursive.", self._watch_path, e)
            try:
                self._observer = Observer()
                self._observer.schedule(self._fs_handler, self._watch_path, recursive=False)
                self._observer.start()
            except Exception as e2:
                logger.error("Watchdog initialization failed: %s", e2)
                self._observer = None

        self._last_sample_time = time.time()
        self._last_io = self._query_io_counters()
        self._is_running = True

    def stop(self) -> None:
        """Gracefully terminate filesystem observer."""
        if not self._is_running:
            return

        if self._observer:
            try:
                self._observer.stop()
                self._observer.join(timeout=2.0)
            except Exception as e:
                logger.warning("Error stopping observer: %s", e)
            finally:
                self._observer = None

        self._is_running = False
        logger.info("Stopped macOS telemetry watcher on device %s", self.device_id)

    def is_accessible(self) -> bool:
        """Check if the monitored mount point remains accessible."""
        if self.mount_point and self.mount_point != "/" and not os.path.exists(self.mount_point):
            return False
        if self._watch_path and not os.path.exists(self._watch_path):
            return False
        return True

    def reset_stats(self) -> None:
        """Reset internal event buffers and snapshot markers."""
        if self._fs_handler:
            self._fs_handler.drain_counts()
        self._last_sample_time = time.time()
        self._last_io = self._query_io_counters()

    def collect_sample(self) -> TelemetrySnapshot:
        """Calculate real delta storage activity since the previous sample with defensive disconnection handling."""
        now = time.time()
        delta_time = max(0.001, now - self._last_sample_time)
        self._last_sample_time = now

        # Defensive disconnection check
        if not self.is_accessible():
            logger.warning("Device '%s' mount path '%s' is not currently accessible.", self.device_id, self._watch_path)
            return TelemetrySnapshot(
                device_id=self.device_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                posix_timestamp=now,
                read_bytes=0,
                write_bytes=0,
                read_operations=0,
                write_operations=0,
                file_modifications=0,
                rename_events=0,
                sample_entropy=None,
                delta_seconds=round(delta_time, 3)
            )

        try:
            current_io = self._query_io_counters()
        except Exception as e:
            logger.warning("Error querying I/O counters for %s: %s", self.device_id, e)
            current_io = None

        read_bytes = 0
        write_bytes = 0
        read_ops = 0
        write_ops = 0

        if current_io and self._last_io:
            read_bytes = max(0, current_io.read_bytes - self._last_io.read_bytes)
            write_bytes = max(0, current_io.write_bytes - self._last_io.write_bytes)
            read_ops = max(0, current_io.read_count - self._last_io.read_count)
            write_ops = max(0, current_io.write_count - self._last_io.write_count)

        if current_io:
            self._last_io = current_io

        # Drain filesystem events from safe watchdog handler
        try:
            mods, renames, sample_entropy = self._fs_handler.drain_counts()
        except Exception as e:
            logger.warning("Error draining fs events for %s: %s", self.device_id, e)
            mods, renames, sample_entropy = 0, 0, None

        iso_now = datetime.now(timezone.utc).isoformat()

        return TelemetrySnapshot(
            device_id=self.device_id,
            timestamp=iso_now,
            posix_timestamp=now,
            read_bytes=read_bytes,
            write_bytes=write_bytes,
            read_operations=read_ops,
            write_operations=write_ops,
            file_modifications=mods,
            rename_events=renames,
            sample_entropy=sample_entropy,
            delta_seconds=round(delta_time, 3)
        )
