"""Base telemetry provider interface and normalized data structures."""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
import time
from typing import Optional
from pydantic import BaseModel, Field


class TelemetrySnapshot(BaseModel):
    """Normalized snapshot of hardware and filesystem storage activity."""
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp string"
    )
    posix_timestamp: float = Field(default_factory=time.time, description="POSIX timestamp in seconds")
    device_id: str = Field(..., description="Target storage device identifier")
    read_bytes: int = Field(0, description="Bytes read during this sampling interval")
    write_bytes: int = Field(0, description="Bytes written during this sampling interval")
    read_operations: int = Field(0, description="Read I/O operations count during this interval")
    write_operations: int = Field(0, description="Write I/O operations count during this interval")
    file_modifications: int = Field(0, description="Filesystem modify/create events observed")
    rename_events: int = Field(0, description="Filesystem rename/move events observed")
    sample_entropy: Optional[float] = Field(None, description="Shannon entropy (0.0-8.0) of safely sampled file header")
    delta_seconds: float = Field(1.0, description="Duration of the measurement interval in seconds")


class BaseTelemetryProvider(ABC):
    """Abstract base class for OS-specific read-only telemetry providers."""

    def __init__(self, device_id: str, mount_point: str = "/"):
        self.device_id = device_id
        self.mount_point = mount_point
        self._is_running = False

    @property
    def is_running(self) -> bool:
        return self._is_running

    @abstractmethod
    def start(self) -> None:
        """Start hardware I/O sampling and filesystem event observation."""
        pass

    @abstractmethod
    def stop(self) -> None:
        """Stop sampling and release all observer resources."""
        pass

    @abstractmethod
    def collect_sample(self) -> TelemetrySnapshot:
        """Collect a delta snapshot since the last call."""
        pass
