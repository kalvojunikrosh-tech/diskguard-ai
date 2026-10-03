"""Safe Sandbox Behavioral Simulator for DiskGuard AI.

STRICT SAFETY GUARANTEES:
1. Operates EXCLUSIVELY within a dedicated project-local sandbox directory (backend/sandbox/).
2. Rejects any operation targeting paths outside the sandbox.
3. Does NOT implement real ransomware, encryption keys, or malware.
4. Generates controlled synthetic file activity (reads, writes, renames, entropy) to validate detection.
"""
import collections
from datetime import datetime, timezone
import logging
import math
import os
import random
import string
import threading
import time
from typing import Dict, List, Optional, Set

from backend.ml.baseline import get_baseline_engine, BaselineProfile
from backend.telemetry.base import TelemetrySnapshot
from backend.telemetry.collector import get_telemetry_collector

logger = logging.getLogger("diskguard.simulation")

SUPPORTED_SCENARIOS = (
    "normal",
    "elevated_writes",
    "mass_rename",
    "high_entropy_test",
    "ransomware_like_burst",
)

SANDBOX_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "sandbox")
)


def calculate_shannon_entropy(data: bytes) -> float:
    """Calculate Shannon entropy of byte data in bits per byte (0.0 - 8.0)."""
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


def verify_sandbox_path(target_path: str) -> str:
    """Module-level convenience validator ensuring path is inside SANDBOX_DIR."""
    return get_simulator().verify_sandbox_path(target_path)


class SafeSimulator:
    """Safe, sandboxed behavioral workload generator for DiskGuard pipeline validation."""

    def __init__(self, sandbox_dir: Optional[str] = None):
        if sandbox_dir is None:
            sandbox_dir = SANDBOX_DIR
        self.sandbox_dir = os.path.realpath(sandbox_dir)
        self._ensure_sandbox()

        self._running = False
        self._current_scenario = "none"
        self._target_devices: Set[str] = set()
        self._worker_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

    def _ensure_sandbox(self) -> None:
        """Create sandbox directory if it does not exist and verify boundary integrity."""
        os.makedirs(self.sandbox_dir, exist_ok=True)
        # Verify boundary safety: never allow root or home root
        forbidden_roots = ["/", os.path.expanduser("~"), "/Users", "/System", "/Volumes"]
        real_canonical = os.path.realpath(self.sandbox_dir)
        if real_canonical in [os.path.realpath(f) for f in forbidden_roots]:
            raise PermissionError(f"CRITICAL: Sandbox path '{real_canonical}' points to a protected system volume!")
        # Clean any stale dummy files from previous interrupted runs
        self._cleanup_sandbox()

    def verify_sandbox_path(self, target_path: str) -> str:
        """Verify that a target path is strictly within the dedicated sandbox directory."""
        canonical = os.path.realpath(target_path)
        sandbox_prefix = os.path.realpath(self.sandbox_dir)
        if not canonical.startswith(sandbox_prefix + os.sep) and canonical != sandbox_prefix:
            logger.error("SAFETY VIOLATION: Target path '%s' is outside sandbox '%s'!", canonical, sandbox_prefix)
            raise PermissionError(
                f"SAFETY GUARD: Operation rejected. Path '{canonical}' is outside dedicated sandbox."
            )
        return canonical

    @property
    def is_running(self) -> bool:
        with self._lock:
            return self._running

    @property
    def current_scenario(self) -> str:
        with self._lock:
            return self._current_scenario

    def is_simulating(self, device_id: str) -> bool:
        """Return True if safe simulation is actively running for device_id."""
        with self._lock:
            if not self._running:
                return False
            if not self._target_devices:
                return True
            return device_id in self._target_devices

    def get_status(self) -> Dict:
        """Return machine-readable simulation status."""
        with self._lock:
            return {
                "running": self._running,
                "scenario": self._current_scenario if self._running else "none",
                "sandbox": True,
                "sandbox_dir": self.sandbox_dir,
                "target_devices": list(self._target_devices),
            }

    def start(self, scenario: str, device_id: Optional[str] = None) -> bool:
        """Start a safe simulation scenario in background worker thread and feed telemetry."""
        scenario_clean = scenario.lower().strip()
        if scenario_clean not in SUPPORTED_SCENARIOS:
            raise ValueError(f"Unknown scenario '{scenario}'. Supported: {SUPPORTED_SCENARIOS}")

        with self._lock:
            if self._running:
                if self._current_scenario == scenario_clean and (not device_id or device_id in self._target_devices):
                    logger.info("Simulation scenario '%s' is already running.", scenario_clean)
                    return True
                # Stop existing before switching
                self._stop_unlocked()

            # Safety banner
            print("==================================================")
            print("SAFE SIMULATION MODE — SANDBOX ONLY")
            print(f"Target Directory: {self.sandbox_dir}")
            print(f"Scenario: {scenario_clean}")
            print("==================================================")
            logger.info("SAFE SIMULATION MODE — SANDBOX ONLY on %s with scenario %s", self.sandbox_dir, scenario_clean)

            self._ensure_sandbox()
            self._running = True
            self._current_scenario = scenario_clean
            self._stop_event.clear()

            # Determine target devices
            if device_id:
                self._target_devices = {device_id}
            else:
                try:
                    collector = get_telemetry_collector()
                    with collector._lock:
                        monitored = list(collector._providers.keys()) or list(collector._windows.keys())
                    if not monitored:
                        from backend.services.device_service import get_device_service
                        service = get_device_service()
                        detected = service.list_devices()
                        monitored = [d.id for d in detected] if detected else ["disk0"]
                    self._target_devices = set(monitored)
                except Exception:
                    self._target_devices = {"disk0"}

            # Pre-populate rolling simulation window so analysis immediately has valid feature data
            self._initialize_simulation_window(scenario_clean, list(self._target_devices))

            self._worker_thread = threading.Thread(
                target=self._run_loop,
                args=(scenario_clean,),
                name=f"SafeSimWorker-{scenario_clean}",
                daemon=True,
            )
            self._worker_thread.start()
            return True

    def stop(self) -> bool:
        """Stop the currently running simulation."""
        with self._lock:
            return self._stop_unlocked()

    def _stop_unlocked(self) -> bool:
        """Internal stop routine without lock acquisition."""
        if not self._running:
            return True

        self._stop_event.set()
        self._running = False
        scenario = self._current_scenario
        self._current_scenario = "none"

        logger.info("Stopping safe simulation scenario '%s'...", scenario)
        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=2.0)
            self._worker_thread = None

        # Safely clean up synthetic files in sandbox
        self._cleanup_sandbox()

        # Clear simulation telemetry window so device returns toward normal baseline
        try:
            collector = get_telemetry_collector()
            for dev_id in self._target_devices:
                collector.clear_window(dev_id)
        except Exception as e:
            logger.warning("Error clearing simulation telemetry window: %s", e)

        self._target_devices.clear()
        logger.info("Safe simulation stopped and cleaned up.")
        return True

    def _cleanup_sandbox(self) -> None:
        """Safely delete generated synthetic test files inside the sandbox only."""
        try:
            for item in os.listdir(self.sandbox_dir):
                target = os.path.join(self.sandbox_dir, item)
                safe_target = self.verify_sandbox_path(target)
                if os.path.isfile(safe_target):
                    os.remove(safe_target)
        except Exception as e:
            logger.warning("Error during sandbox cleanup: %s", e)

    def _create_scenario_snapshot(
        self,
        scenario: str,
        device_id: str,
        step: int,
        is_burst_peak: bool = False,
        posix_time: Optional[float] = None,
    ) -> TelemetrySnapshot:
        """Create a calibrated TelemetrySnapshot matching the scenario relative to baseline."""
        if posix_time is None:
            posix_time = time.time()

        baseline_engine = get_baseline_engine()
        profile = baseline_engine.get_profile(device_id)

        mean_w = profile.mean_write_frequency if profile.mean_write_frequency > 0 else 800.0
        std_w = max(25.0, profile.std_write_frequency)
        mean_m = profile.mean_modification_rate if profile.mean_modification_rate > 0 else 100.0
        std_m = max(10.0, profile.std_modification_rate)
        mean_r = profile.mean_rename_rate if profile.mean_rename_rate > 0 else 10.0
        std_r = max(2.0, profile.std_rename_rate)
        mean_read = profile.mean_read_frequency if profile.mean_read_frequency > 0 else 1500.0

        if scenario == "normal":
            write_ops = max(2, int(round(mean_w / 60.0)) + random.randint(-1, 1))
            read_ops = max(5, int(round(mean_read / 60.0)) + random.randint(-2, 2))
            file_mods = max(1, int(round(mean_m / 60.0)) + random.randint(-1, 1))
            renames = 0
            entropy = 4.1 + random.uniform(-0.15, 0.15)
            write_b = 35000 + random.randint(0, 5000)
            read_b = 55000 + random.randint(0, 8000)

        elif scenario == "elevated_writes":
            target_w = max(mean_w + 3.5 * std_w, mean_w * 2.8, 2800.0) + random.uniform(-30, 30)
            write_ops = max(30, int(round(target_w / 60.0)))
            read_ops = 5
            file_mods = max(1, int(round(mean_m / 60.0)))
            renames = 0
            entropy = 4.05 + random.uniform(-0.1, 0.1)
            write_b = 2500000 + random.randint(0, 50000)
            read_b = 350000

        elif scenario == "mass_rename":
            target_r = max(mean_r + 4.0 * std_r, mean_r * 3.5, 90.0) + random.uniform(-5, 5)
            renames = max(2, int(round(target_r / 60.0)))
            write_ops = max(5, int(round(mean_w / 60.0)))
            read_ops = 12
            file_mods = max(1, int(round(mean_m / 60.0)))
            entropy = 4.05 + random.uniform(-0.1, 0.1)
            write_b = 30000
            read_b = 25000

        elif scenario == "high_entropy_test":
            entropy = 7.88 + random.uniform(-0.05, 0.05)
            renames = 0
            write_ops = max(5, int(round(mean_w / 60.0)))
            read_ops = 10
            file_mods = max(1, int(round(mean_m / 60.0)))
            write_b = 65536
            read_b = 20000

        elif scenario == "ransomware_like_burst":
            target_w = max(mean_w + 4.5 * std_w, 3200.0)
            target_m = max(mean_m + 4.5 * std_m, 600.0)
            target_r = max(mean_r + 4.5 * std_r, 120.0)
            mult = 2.4 if is_burst_peak else 0.6
            write_ops = max(20, int(round((target_w / 60.0) * mult)))
            file_mods = max(5, int(round((target_m / 60.0) * mult)))
            renames = max(2, int(round(target_r / 60.0))) + (1 if is_burst_peak else 0)
            entropy = 7.88 + random.uniform(-0.05, 0.05)
            write_b = int(12000000 * mult)
            read_b = 1000
            read_ops = 1

        else:
            write_ops = 10
            read_ops = 10
            file_mods = 2
            renames = 0
            entropy = 4.0
            write_b = 10000
            read_b = 10000

        iso_ts = datetime.fromtimestamp(posix_time, timezone.utc).isoformat()
        return TelemetrySnapshot(
            device_id=device_id,
            timestamp=iso_ts,
            posix_timestamp=posix_time,
            read_bytes=write_b if scenario == "normal" else read_b,
            write_bytes=write_b,
            read_operations=read_ops,
            write_operations=write_ops,
            file_modifications=file_mods,
            rename_events=renames,
            sample_entropy=round(entropy, 4),
            delta_seconds=1.0,
        )

    def _initialize_simulation_window(self, scenario: str, devices: List[str], window_len: int = 25) -> None:
        """Pre-populate the rolling telemetry window so analysis immediately has valid feature data."""
        collector = get_telemetry_collector()
        now = time.time()
        for dev_id in devices:
            snapshots = []
            for i in range(window_len):
                t = now - float(window_len - i)
                is_peak = (i % 3 == 0)
                snap = self._create_scenario_snapshot(scenario, dev_id, step=i, is_burst_peak=is_peak, posix_time=t)
                snapshots.append(snap)
            collector.set_simulation_window(dev_id, snapshots)

    def _run_loop(self, scenario: str) -> None:
        """Main background simulation worker executing scenario behaviors and generating live telemetry."""
        logger.info("Safe simulation worker loop started for '%s'.", scenario)

        collector = get_telemetry_collector()
        step = 0
        while not self._stop_event.is_set():
            try:
                # 1. Execute physical sandbox actions (guaranteed strictly inside sandbox_dir)
                if scenario == "normal":
                    self._execute_normal_step(step)
                    sleep_time = 1.0
                elif scenario == "elevated_writes":
                    self._execute_elevated_writes_step(step)
                    sleep_time = 0.5
                elif scenario == "mass_rename":
                    self._execute_mass_rename_step(step)
                    sleep_time = 0.5
                elif scenario == "high_entropy_test":
                    self._execute_high_entropy_step(step)
                    sleep_time = 0.8
                elif scenario == "ransomware_like_burst":
                    self._execute_ransomware_like_step(step)
                    sleep_time = 0.4
                else:
                    sleep_time = 1.0

                # 2. Append live telemetry snapshot to rolling window for all target devices
                with self._lock:
                    target_devs = list(self._target_devices)

                is_peak = (step % 3 == 0)
                now = time.time()
                for dev_id in target_devs:
                    snap = self._create_scenario_snapshot(
                        scenario=scenario,
                        device_id=dev_id,
                        step=step,
                        is_burst_peak=is_peak,
                        posix_time=now
                    )
                    collector.append_simulation_snapshot(dev_id, snap)

                step += 1
                time.sleep(sleep_time)
            except Exception as e:
                logger.error("Simulation worker error in '%s': %s", scenario, e)
                time.sleep(1.0)

        logger.info("Safe simulation worker loop exited for '%s'.", scenario)

    # -------------------------------------------------------------------------
    # Scenario 1: Normal Everyday Activity
    # -------------------------------------------------------------------------
    def _execute_normal_step(self, step: int) -> None:
        """Light, standard plaintext reads and writes; 0 renames; low entropy (~3.5-4.2)."""
        file_path = self.verify_sandbox_path(os.path.join(self.sandbox_dir, f"normal_note_{step % 10}.txt"))
        text_content = f"Log entry {step} at {time.time()}: normal background operating system activity.\n"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(text_content)
            f.flush()
            os.fsync(f.fileno())

        # Read back
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                _ = f.read()

    # -------------------------------------------------------------------------
    # Scenario 2: Elevated Writes (e.g. large file download, build artifacts)
    # -------------------------------------------------------------------------
    def _execute_elevated_writes_step(self, step: int) -> None:
        """High sequential write throughput, 0 renames, standard text entropy (~4.0)."""
        file_path = self.verify_sandbox_path(os.path.join(self.sandbox_dir, f"build_artifact_{step % 8}.dat"))
        chunk = ("Sample Build Chunk Output " * 5000).encode("utf-8")
        with open(file_path, "wb") as f:
            f.write(chunk)
            f.flush()
            os.fsync(f.fileno())

    # -------------------------------------------------------------------------
    # Scenario 3: Mass Rename (e.g. batch photo renaming, file reorganization)
    # -------------------------------------------------------------------------
    def _execute_mass_rename_step(self, step: int) -> None:
        """Rapid file extension and path rename events, low entropy, modest writes."""
        for i in range(8):
            orig = self.verify_sandbox_path(os.path.join(self.sandbox_dir, f"batch_item_{step}_{i}.tmp"))
            dest = self.verify_sandbox_path(os.path.join(self.sandbox_dir, f"batch_item_{step}_{i}.renamed"))
            with open(orig, "w", encoding="utf-8") as f:
                f.write(f"Temporary batch metadata index {i}\n")
                f.flush()
                os.fsync(f.fileno())
            os.replace(orig, dest)

    # -------------------------------------------------------------------------
    # Scenario 4: High Entropy Test (e.g. zip compression, encrypted database container)
    # -------------------------------------------------------------------------
    def _execute_high_entropy_step(self, step: int) -> None:
        """Writes high-entropy pseudo-random bytes (~7.5-7.9 Shannon), without mass renames."""
        file_path = self.verify_sandbox_path(os.path.join(self.sandbox_dir, f"compressed_archive_{step % 5}.bin"))
        random_bytes = os.urandom(16384)
        with open(file_path, "wb") as f:
            f.write(random_bytes)
            f.flush()
            os.fsync(f.fileno())

    # -------------------------------------------------------------------------
    # Scenario 5: Ransomware-Like Burst (Synthetic Multi-Vector Behavioral Burst)
    # -------------------------------------------------------------------------
    def _execute_ransomware_like_step(self, step: int) -> None:
        """Concurrent multi-vector simulation: rapid writes + modifications + renames + high entropy.

        STRICT SAFETY:
        - Only writes safe pseudo-random bytes into generated dummy files inside the sandbox.
        - Appends synthetic extension (.locked).
        - Never touches user files or external volumes.
        """
        for i in range(12):
            plain_path = self.verify_sandbox_path(os.path.join(self.sandbox_dir, f"user_doc_{step}_{i}.txt"))
            locked_path = self.verify_sandbox_path(os.path.join(self.sandbox_dir, f"user_doc_{step}_{i}.txt.locked"))

            # 1. Initial write
            with open(plain_path, "wb") as f:
                f.write(b"User document initial cleartext payload.\n" * 20)
                f.flush()
                os.fsync(f.fileno())

            # 2. Overwrite with high-entropy pseudo-random bytes (mimics encryption)
            high_entropy_payload = os.urandom(8192)
            with open(plain_path, "wb") as f:
                f.write(high_entropy_payload)
                f.flush()
                os.fsync(f.fileno())

            # 3. Rename with .locked extension
            os.replace(plain_path, locked_path)


# Global Simulator Singleton
_simulator_instance: Optional[SafeSimulator] = None
_sim_lock = threading.Lock()


def get_simulator() -> SafeSimulator:
    """Retrieve or initialize the global SafeSimulator singleton."""
    global _simulator_instance
    if _simulator_instance is None:
        with _sim_lock:
            if _simulator_instance is None:
                _simulator_instance = SafeSimulator()
    return _simulator_instance
