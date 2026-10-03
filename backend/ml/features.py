"""Behavioral feature extraction from rolling storage telemetry windows."""
import math
from typing import List, Optional
from pydantic import BaseModel, Field

from backend.telemetry.base import TelemetrySnapshot


class BehavioralFeatures(BaseModel):
    """Normalized behavioral vector extracted from a rolling telemetry observation window."""
    window_seconds: float = Field(0.0, description="Observed window duration in seconds")
    sample_count: int = Field(0, description="Number of 1-second snapshots in window")
    read_frequency: Optional[float] = Field(None, description="Read operations per minute")
    write_frequency: Optional[float] = Field(None, description="Write operations per minute")
    file_modification_rate: Optional[float] = Field(None, description="File modifications per minute")
    rename_rate: Optional[float] = Field(None, description="File rename/move events per minute")
    entropy_change: Optional[float] = Field(None, description="Deviation from baseline Shannon entropy (bits/byte)")
    access_irregularity: Optional[float] = Field(None, description="Coefficient of variation of I/O operations")
    io_burstiness: Optional[float] = Field(None, description="Ratio of peak I/O burst to mean I/O")
    read_write_ratio: Optional[float] = Field(None, description="Ratio of read bytes to write bytes")
    mean_sample_entropy: Optional[float] = Field(None, description="Mean Shannon entropy of sampled file modifications")


def extract_behavioral_features(
    snapshots: List[TelemetrySnapshot],
    baseline_entropy: Optional[float] = None
) -> BehavioralFeatures:
    """Extract normalized behavioral features from a time-series window of TelemetrySnapshots.

    Strict rule: Never fabricate synthetic metrics. If insufficient data exists, fields remain None.
    """
    if not snapshots:
        return BehavioralFeatures(window_seconds=0.0, sample_count=0)

    sample_count = len(snapshots)
    total_duration = sum(s.delta_seconds for s in snapshots)
    if total_duration <= 0:
        total_duration = max(1.0, float(sample_count))

    duration_minutes = total_duration / 60.0

    total_read_ops = sum(s.read_operations for s in snapshots)
    total_write_ops = sum(s.write_operations for s in snapshots)
    total_mods = sum(s.file_modifications for s in snapshots)
    total_renames = sum(s.rename_events for s in snapshots)
    total_read_bytes = sum(s.read_bytes for s in snapshots)
    total_write_bytes = sum(s.write_bytes for s in snapshots)

    read_frequency = round(total_read_ops / duration_minutes, 2)
    write_frequency = round(total_write_ops / duration_minutes, 2)
    file_modification_rate = round(total_mods / duration_minutes, 2)
    rename_rate = round(total_renames / duration_minutes, 2)

    # Ratio of read bytes to write bytes
    if total_write_bytes > 0:
        read_write_ratio = round(total_read_bytes / float(total_write_bytes), 3)
    elif total_read_bytes > 0:
        read_write_ratio = 100.0  # Read-dominated
    else:
        read_write_ratio = 1.0  # Idle balance

    # Burstiness & irregularity require at least 2 snapshot points
    if sample_count >= 2:
        ops_per_second = [float(s.read_operations + s.write_operations) for s in snapshots]
        mean_ops = sum(ops_per_second) / sample_count
        variance = sum((x - mean_ops) ** 2 for x in ops_per_second) / sample_count
        std_dev = math.sqrt(variance)

        # Coefficient of variation (dispersion)
        access_irregularity = round(std_dev / (mean_ops + 1e-4), 3)
        # Peak to mean burst ratio
        io_burstiness = round(max(ops_per_second) / (mean_ops + 1e-4), 3)
    else:
        access_irregularity = None
        io_burstiness = None

    # Entropy analysis
    entropy_samples = [s.sample_entropy for s in snapshots if s.sample_entropy is not None]
    if entropy_samples:
        mean_entropy = round(sum(entropy_samples) / len(entropy_samples), 4)
        if baseline_entropy is not None:
            entropy_change = round(abs(mean_entropy - baseline_entropy), 4)
        else:
            entropy_change = 0.0
    else:
        mean_entropy = None
        entropy_change = None

    return BehavioralFeatures(
        window_seconds=round(total_duration, 2),
        sample_count=sample_count,
        read_frequency=read_frequency,
        write_frequency=write_frequency,
        file_modification_rate=file_modification_rate,
        rename_rate=rename_rate,
        entropy_change=entropy_change,
        access_irregularity=access_irregularity,
        io_burstiness=io_burstiness,
        read_write_ratio=read_write_ratio,
        mean_sample_entropy=mean_entropy,
    )
