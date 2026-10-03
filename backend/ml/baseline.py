"""Adaptive behavioral baseline service tracking representative storage metrics."""
import collections
import json
import logging
import math
import os
import threading
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from backend.ml.features import BehavioralFeatures

logger = logging.getLogger("diskguard.ml.baseline")

# Clearly defined configuration value for minimum observation windows required to establish baseline
DEFAULT_BASELINE_WINDOWS = int(os.environ.get("DISKGUARD_BASELINE_WINDOWS", "5"))


class BaselineProfile(BaseModel):
    """Representative statistical baseline for a specific storage device."""
    device_id: str
    status: str = Field("learning", description="'learning' or 'established'")
    sample_count: int = Field(0, description="Number of feature windows observed")
    required_samples: int = Field(DEFAULT_BASELINE_WINDOWS, description="Observation windows required to establish baseline")
    learning_progress: Dict[str, int] = Field(
        default_factory=lambda: {"windows_collected": 0, "windows_required": DEFAULT_BASELINE_WINDOWS}
    )
    mean_read_frequency: float = 0.0
    std_read_frequency: float = 1.0
    mean_write_frequency: float = 0.0
    std_write_frequency: float = 1.0
    mean_modification_rate: float = 0.0
    std_modification_rate: float = 1.0
    mean_rename_rate: float = 0.0
    std_rename_rate: float = 1.0
    mean_burstiness: float = 1.0
    std_burstiness: float = 0.5
    mean_read_write_ratio: float = 1.0
    mean_entropy: Optional[float] = None


class BaselineEngine:
    """Tracks running behavioral history and computes adaptive deviations."""

    def __init__(self, min_samples: int = DEFAULT_BASELINE_WINDOWS, max_history: int = 120):
        self.min_samples = min_samples
        self.max_history = max_history
        self._lock = threading.Lock()
        self._history: Dict[str, collections.deque] = {}
        self._profiles: Dict[str, BaselineProfile] = {}
        self._cache_file = os.path.join(os.path.dirname(__file__), ".baseline_store.json")

    def _save_cache(self):
        try:
            data = {k: v.model_dump() for k, v in self._profiles.items()}
            with open(self._cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f)
        except Exception as e:
            logger.debug("Baseline cache save failed: %s", e)

    def _load_cache(self):
        try:
            if os.path.exists(self._cache_file):
                with open(self._cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for k, v in data.items():
                    if k not in self._profiles or (v.get("status") == "established" and self._profiles[k].status != "established"):
                        self._profiles[k] = BaselineProfile.model_validate(v)
        except Exception as e:
            logger.debug("Baseline cache load failed: %s", e)

    def get_status(self, device_id: str) -> str:
        """Return 'learning' or 'established' for a device."""
        return self.get_profile(device_id).status

    def get_profile(self, device_id: str) -> BaselineProfile:
        """Return the current baseline profile for a device."""
        with self._lock:
            if device_id not in self._profiles or self._profiles[device_id].status != "established":
                self._load_cache()
            if device_id not in self._profiles:
                self._profiles[device_id] = BaselineProfile(
                    device_id=device_id,
                    status="learning",
                    sample_count=0,
                    required_samples=self.min_samples,
                    learning_progress={
                        "windows_collected": 0,
                        "windows_required": self.min_samples
                    }
                )
            return self._profiles[device_id]

    def record_observation(self, device_id: str, features: BehavioralFeatures) -> BaselineProfile:
        """Record a feature window and adaptively update representative baseline statistics."""
        with self._lock:
            if device_id not in self._history:
                self._history[device_id] = collections.deque(maxlen=self.max_history)

            existing_profile = self._profiles.get(device_id)
            if not existing_profile or existing_profile.status != "established":
                self._load_cache()
                existing_profile = self._profiles.get(device_id)

            # Once established, baseline persists across repeated analysis requests
            if existing_profile and existing_profile.status == "established":
                return existing_profile

            # Only record if the window actually had data
            if features.sample_count > 0:
                self._history[device_id].append(features)

            history = list(self._history[device_id])
            count = len(history)

            is_established = count >= self.min_samples
            status = "established" if is_established else "learning"

            progress = {
                "windows_collected": min(count, self.min_samples),
                "windows_required": self.min_samples
            }

            if count == 0:
                profile = BaselineProfile(
                    device_id=device_id,
                    status="learning",
                    sample_count=0,
                    required_samples=self.min_samples,
                    learning_progress=progress
                )
                self._profiles[device_id] = profile
                self._save_cache()
                return profile

            # Compute representative statistics with sensible standard deviation floor
            def calc_mean_std(values: List[float], min_std: float = 1.0, rel_std: float = 0.15):
                if not values:
                    return 0.0, min_std
                m = sum(values) / len(values)
                v = sum((x - m) ** 2 for x in values) / len(values)
                s = math.sqrt(v)
                effective_std = max(min_std, round(s, 2), round(abs(m) * rel_std, 2))
                return round(m, 2), round(effective_std, 2)

            read_vals = [f.read_frequency for f in history if f.read_frequency is not None]
            write_vals = [f.write_frequency for f in history if f.write_frequency is not None]
            mod_vals = [f.file_modification_rate for f in history if f.file_modification_rate is not None]
            rename_vals = [f.rename_rate for f in history if f.rename_rate is not None]
            burst_vals = [f.io_burstiness for f in history if f.io_burstiness is not None]
            rw_vals = [f.read_write_ratio for f in history if f.read_write_ratio is not None]
            entropy_vals = [f.mean_sample_entropy for f in history if f.mean_sample_entropy is not None]

            m_read, s_read = calc_mean_std(read_vals, min_std=25.0, rel_std=0.15)
            m_write, s_write = calc_mean_std(write_vals, min_std=25.0, rel_std=0.15)
            m_mod, s_mod = calc_mean_std(mod_vals, min_std=10.0, rel_std=0.15)
            m_rename, s_rename = calc_mean_std(rename_vals, min_std=2.0, rel_std=0.20)
            m_burst, s_burst = calc_mean_std(burst_vals, min_std=0.5, rel_std=0.20)
            m_rw, _ = calc_mean_std(rw_vals, min_std=0.5, rel_std=0.15)
            m_entropy = round(sum(entropy_vals) / len(entropy_vals), 4) if entropy_vals else None

            profile = BaselineProfile(
                device_id=device_id,
                status=status,
                sample_count=count,
                required_samples=self.min_samples,
                learning_progress=progress,
                mean_read_frequency=m_read,
                std_read_frequency=s_read,
                mean_write_frequency=m_write,
                std_write_frequency=s_write,
                mean_modification_rate=m_mod,
                std_modification_rate=s_mod,
                mean_rename_rate=m_rename,
                std_rename_rate=s_rename,
                mean_burstiness=m_burst,
                std_burstiness=s_burst,
                mean_read_write_ratio=m_rw,
                mean_entropy=m_entropy,
            )
            self._profiles[device_id] = profile
            self._save_cache()
            return profile

    def compute_deviations(self, device_id: str, features: BehavioralFeatures) -> Dict[str, float]:
        """Compute statistical deviation (Z-scores) from established baseline.

        Returns 0.0 for all metrics while baseline is still 'learning'.
        """
        profile = self.get_profile(device_id)

        if profile.status == "learning":
            return {
                "write_deviation": 0.0,
                "mod_deviation": 0.0,
                "rename_deviation": 0.0,
                "burst_deviation": 0.0,
                "entropy_deviation": 0.0,
            }

        # Baseline is established: use learned profile parameters
        mean_write = profile.mean_write_frequency
        std_write = profile.std_write_frequency
        mean_mod = profile.mean_modification_rate
        std_mod = profile.std_modification_rate
        mean_rename = profile.mean_rename_rate
        std_rename = profile.std_rename_rate
        mean_burst = profile.mean_burstiness
        std_burst = profile.std_burstiness
        mean_entropy = profile.mean_entropy if profile.mean_entropy is not None else 4.0

        write_dev = 0.0
        if features.write_frequency is not None:
            write_dev = max(0.0, (features.write_frequency - mean_write) / max(1.0, std_write))

        mod_dev = 0.0
        if features.file_modification_rate is not None:
            mod_dev = max(0.0, (features.file_modification_rate - mean_mod) / max(1.0, std_mod))

        rename_dev = 0.0
        if features.rename_rate is not None:
            rename_dev = max(0.0, (features.rename_rate - mean_rename) / max(1.0, std_rename))

        burst_dev = 0.0
        if features.io_burstiness is not None:
            burst_dev = max(0.0, (features.io_burstiness - mean_burst) / max(0.2, std_burst))

        entropy_dev = 0.0
        if features.mean_sample_entropy is not None:
            entropy_dev = max(0.0, (features.mean_sample_entropy - mean_entropy) / 0.8)

        return {
            "write_deviation": round(write_dev, 2),
            "mod_deviation": round(mod_dev, 2),
            "rename_deviation": round(rename_dev, 2),
            "burst_deviation": round(burst_dev, 2),
            "entropy_deviation": round(entropy_dev, 2),
        }

    def reset(self, device_id: str):
        """Reset baseline history and profile for a device."""
        with self._lock:
            self._history.pop(device_id, None)
            self._profiles.pop(device_id, None)
            self._save_cache()


# Global singleton
_baseline_instance: Optional[BaselineEngine] = None
_baseline_lock = threading.Lock()


def get_baseline_engine() -> BaselineEngine:
    """Retrieve or initialize the global BaselineEngine singleton."""
    global _baseline_instance
    if _baseline_instance is None:
        with _baseline_lock:
            if _baseline_instance is None:
                _baseline_instance = BaselineEngine(min_samples=DEFAULT_BASELINE_WINDOWS)
    return _baseline_instance
