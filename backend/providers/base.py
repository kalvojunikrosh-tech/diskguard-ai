"""Base device provider interface and common device models."""
from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel, Field


class StorageDevice(BaseModel):
    """Normalized representation of a physical or mounted storage device."""
    id: str = Field(..., description="Unique persistent or OS identifier for the device")
    name: str = Field(..., description="Human-readable volume or disk label")
    mount_point: str = Field(..., description="Filesystem mount path")
    device_path: str = Field(..., description="Raw device node path (e.g. /dev/disk3s1)")
    filesystem: str = Field(..., description="Filesystem type (e.g. apfs, hfs+, exfat)")
    total_bytes: int = Field(0, description="Total storage capacity in bytes")
    available_bytes: int = Field(0, description="Available free storage in bytes")
    used_bytes: int = Field(0, description="Used storage in bytes")
    device_type: str = Field("ssd", description="Drive media type ('ssd' or 'hdd')")
    removable: bool = Field(False, description="Whether the media is removable/external")
    platform: str = Field("macos", description="Host OS platform")


class BaseDeviceProvider(ABC):
    """Abstract interface for OS-specific read-only storage device providers."""

    @abstractmethod
    def get_devices(self) -> List[StorageDevice]:
        """Discover and return all currently mounted real storage devices."""
        pass

    @abstractmethod
    def get_device_by_id(self, device_id: str) -> Optional[StorageDevice]:
        """Fetch a specific storage device by its identifier."""
        pass
