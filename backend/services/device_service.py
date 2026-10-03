"""Device service to orchestrate OS-specific storage discovery providers."""
import sys
from typing import List, Optional

from backend.providers.base import BaseDeviceProvider, StorageDevice
from backend.providers.macos import MacOSDeviceProvider


class DeviceService:
    """Service to discover and query storage devices across supported operating systems."""

    def __init__(self, provider: Optional[BaseDeviceProvider] = None):
        if provider:
            self._provider = provider
        elif sys.platform == "darwin":
            self._provider = MacOSDeviceProvider()
        else:
            raise NotImplementedError(
                f"Platform '{sys.platform}' is not currently supported for real device detection."
            )

    def list_devices(self) -> List[StorageDevice]:
        """Return all detected real storage devices."""
        return self._provider.get_devices()

    def get_device(self, device_id: str) -> Optional[StorageDevice]:
        """Return a specific device by ID or None if not found."""
        return self._provider.get_device_by_id(device_id)


_device_service_instance: Optional[DeviceService] = None


def get_device_service() -> DeviceService:
    """Singleton getter for DeviceService."""
    global _device_service_instance
    if _device_service_instance is None:
        _device_service_instance = DeviceService()
    return _device_service_instance
