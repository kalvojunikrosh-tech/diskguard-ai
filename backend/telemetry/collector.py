"""Thread-safe telemetry collector managing rolling 60-second observation windows."""
import collections
import logging
import threading
import time
from typing import Dict, List, Optional

from backend.providers.base import StorageDevice
from backend.telemetry.base import BaseTelemetryProvider, TelemetrySnapshot
from backend.telemetry.macos import MacOSTelemetryProvider

logger = logging.getLogger("diskguard.telemetry.collector")


class TelemetryCollector:
    """Manages periodic sampling and rolling in-memory telemetry buffers for active storage devices."""

    def __init__(self, window_size: int = 60, sample_interval: float = 1.0):
        self.window_size = window_size
        self.sample_interval = sample_interval
        self._lock = threading.Lock()
        self._providers: Dict[str, BaseTelemetryProvider] = {}
        self._windows: Dict[str, collections.deque] = {}
        self._worker_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def is_monitoring(self, device_id: str) -> bool:
        """Return whether real-time observation is currently active for device_id."""
        with self._lock:
            if device_id in self._providers and self._providers[device_id].is_running:
                return True
        try:
            from backend.simulation.simulator import get_simulator
            sim = get_simulator()
            return sim.is_running and sim.is_simulating(device_id)
        except Exception:
            return False

    def start_monitoring(self, device: StorageDevice) -> bool:
        """Start monitoring a detected storage device."""
        with self._lock:
            if device.id in self._providers and self._providers[device.id].is_running:
                logger.info("Device %s is already being monitored.", device.id)
                return True

            logger.info("Initializing telemetry provider for device %s at %s", device.id, device.mount_point)
            provider = MacOSTelemetryProvider(device_id=device.id, mount_point=device.mount_point)
            provider.start()

            self._providers[device.id] = provider
            if device.id not in self._windows:
                self._windows[device.id] = collections.deque(maxlen=self.window_size)

            # Ensure background collection loop is active
            if not self._worker_thread or not self._worker_thread.is_alive():
                self._stop_event.clear()
                self._worker_thread = threading.Thread(
                    target=self._collection_loop,
                    name="TelemetryCollectionWorker",
                    daemon=True
                )
                self._worker_thread.start()

            return True

    def stop_monitoring(self, device_id: str) -> bool:
        """Stop monitoring a storage device."""
        with self._lock:
            if device_id not in self._providers:
                return False

            provider = self._providers.pop(device_id)
            try:
                provider.stop()
            except Exception as e:
                logger.warning("Error stopping telemetry provider for %s: %s", device_id, e)

            # If no providers remain, stop worker loop
            if not self._providers:
                self._stop_event.set()

            return True

    def clear_window(self, device_id: str) -> None:
        """Clear the telemetry snapshot window and reset event counters for a device."""
        with self._lock:
            if device_id in self._windows:
                self._windows[device_id].clear()
            provider = self._providers.get(device_id)
            if provider and hasattr(provider, "reset_stats"):
                provider.reset_stats()

    def set_simulation_window(self, device_id: str, snapshots: List[TelemetrySnapshot]) -> None:
        """Populate the telemetry window for a device with initial simulation snapshots."""
        with self._lock:
            if device_id not in self._windows:
                self._windows[device_id] = collections.deque(maxlen=self.window_size)
            self._windows[device_id].clear()
            self._windows[device_id].extend(snapshots)

    def append_simulation_snapshot(self, device_id: str, snapshot: TelemetrySnapshot) -> None:
        """Append a real-time simulation snapshot to the rolling window."""
        with self._lock:
            if device_id not in self._windows:
                self._windows[device_id] = collections.deque(maxlen=self.window_size)
            self._windows[device_id].append(snapshot)

    def get_telemetry_window(self, device_id: str, limit: int = 30) -> List[TelemetrySnapshot]:
        """Return the most recent snapshots for a device."""
        with self._lock:
            window = self._windows.get(device_id)
            if not window:
                return []
            items = list(window)
            return items[-limit:] if limit > 0 else items

    def get_latest_snapshot(self, device_id: str) -> Optional[TelemetrySnapshot]:
        """Return the single most recent telemetry snapshot."""
        with self._lock:
            window = self._windows.get(device_id)
            if window and len(window) > 0:
                return window[-1]
            return None

    def _collection_loop(self):
        """Periodic background sampling loop running at 1Hz."""
        logger.info("Telemetry collection loop started.")
        while not self._stop_event.is_set():
            start_time = time.time()

            with self._lock:
                active_pairs = list(self._providers.items())

            for dev_id, provider in active_pairs:
                try:
                    # Check if device is actively simulated
                    is_sim = False
                    try:
                        from backend.simulation.simulator import get_simulator
                        sim = get_simulator()
                        is_sim = sim.is_running and sim.is_simulating(dev_id)
                    except Exception:
                        pass

                    if is_sim:
                        # Poll provider to drain OS events safely, but let simulation drive window
                        _ = provider.collect_sample()
                        continue

                    snapshot = provider.collect_sample()
                    with self._lock:
                        if dev_id in self._windows:
                            self._windows[dev_id].append(snapshot)
                except Exception as e:
                    logger.error("Error collecting sample for %s: %s", dev_id, e)

            # Sleep remaining interval time
            elapsed = time.time() - start_time
            sleep_time = max(0.1, self.sample_interval - elapsed)
            time.sleep(sleep_time)

        logger.info("Telemetry collection loop stopped.")


# Global singleton
_collector_instance: Optional[TelemetryCollector] = None
_collector_lock = threading.Lock()


def get_telemetry_collector() -> TelemetryCollector:
    """Retrieve or initialize the global TelemetryCollector singleton."""
    global _collector_instance
    if _collector_instance is None:
        with _collector_lock:
            if _collector_instance is None:
                _collector_instance = TelemetryCollector(window_size=60, sample_interval=1.0)
    return _collector_instance
