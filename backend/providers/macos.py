"""macOS storage device discovery provider using read-only diskutil and filesystem APIs."""
import os
import plistlib
import shutil
import subprocess
from typing import Dict, List, Optional, Set

from backend.providers.base import BaseDeviceProvider, StorageDevice


class MacOSDeviceProvider(BaseDeviceProvider):
    """Read-only storage device provider for macOS on Apple Silicon and Intel."""

    # Internal system APFS container volume prefixes to exclude from user disk inspection
    EXCLUDED_MOUNT_PREFIXES = (
        "/System/Volumes/Preboot",
        "/System/Volumes/VM",
        "/System/Volumes/Update",
        "/System/Volumes/xarts",
        "/System/Volumes/iSCPreboot",
        "/System/Volumes/Hardware",
        "/System/Volumes/Data",  # APFS firmlinked user container of root /
    )

    def _get_disk_info(self, target: str) -> Optional[Dict]:
        """Execute read-only `diskutil info -plist` for a device identifier or mount path."""
        try:
            res = subprocess.run(
                ["diskutil", "info", "-plist", target],
                capture_output=True,
                text=False,
                timeout=5,
                check=False
            )
            if res.returncode == 0 and res.stdout:
                return plistlib.loads(res.stdout)
        except Exception:
            pass
        return None

    def _build_storage_device(self, info: Dict, mount_point: str) -> Optional[StorageDevice]:
        """Transform raw diskutil plist dictionary and mount point into StorageDevice model."""
        try:
            device_id = info.get("DeviceIdentifier") or os.path.basename(mount_point)
            name = info.get("VolumeName") or os.path.basename(mount_point) or "System Disk"
            device_node = info.get("DeviceNode") or f"/dev/{device_id}"
            raw_fs = info.get("FilesystemType") or info.get("FilesystemName") or "apfs"
            filesystem = str(raw_fs).strip().lower()

            is_ssd = bool(info.get("SolidState", True))
            device_type = "ssd" if is_ssd else "hdd"

            is_removable = bool(info.get("RemovableMedia", False) or not info.get("Internal", True))

            # Live capacity and free space from safe statvfs/disk_usage
            try:
                usage = shutil.disk_usage(mount_point)
                total_bytes = usage.total
                available_bytes = usage.free
                used_bytes = usage.used
            except Exception:
                total_bytes = int(info.get("TotalSize") or 0)
                available_bytes = int(info.get("FreeSpace") or 0)
                used_bytes = max(0, total_bytes - available_bytes)

            return StorageDevice(
                id=device_id,
                name=name,
                mount_point=mount_point,
                device_path=device_node,
                filesystem=filesystem,
                total_bytes=total_bytes,
                available_bytes=available_bytes,
                used_bytes=used_bytes,
                device_type=device_type,
                removable=is_removable,
                platform="macos"
            )
        except Exception:
            return None

    def get_devices(self) -> List[StorageDevice]:
        """Discover mounted storage devices on macOS without modifying any disks or files."""
        devices: List[StorageDevice] = []
        seen_mounts: Set[str] = set()
        seen_ids: Set[str] = set()

        # 1. Inspect root system mount (/)
        root_info = self._get_disk_info("/")
        if root_info:
            root_device = self._build_storage_device(root_info, "/")
            if root_device:
                devices.append(root_device)
                seen_mounts.add("/")
                seen_ids.add(root_device.id)

        # 2. Inspect active volumes discovered by diskutil list
        try:
            list_res = subprocess.run(
                ["diskutil", "list", "-plist"],
                capture_output=True,
                text=False,
                timeout=5,
                check=False
            )
            if list_res.returncode == 0 and list_res.stdout:
                parsed_list = plistlib.loads(list_res.stdout)
                for disk_id in parsed_list.get("AllDisks", []):
                    if disk_id in seen_ids:
                        continue
                    info = self._get_disk_info(disk_id)
                    if not info:
                        continue
                    mount = info.get("MountPoint")
                    if not mount:
                        continue
                    if mount in seen_mounts:
                        continue
                    if any(mount.startswith(prefix) for prefix in self.EXCLUDED_MOUNT_PREFIXES):
                        continue

                    device = self._build_storage_device(info, mount)
                    if device and device.id not in seen_ids:
                        devices.append(device)
                        seen_mounts.add(mount)
                        seen_ids.add(device.id)
        except Exception:
            pass

        # 3. Inspect /Volumes for external, USB, or secondary volumes
        if os.path.exists("/Volumes"):
            try:
                for item in os.listdir("/Volumes"):
                    vol_path = os.path.join("/Volumes", item)
                    try:
                        resolved_path = os.path.realpath(vol_path)
                    except Exception:
                        resolved_path = vol_path

                    if resolved_path in seen_mounts or vol_path in seen_mounts:
                        continue
                    if any(vol_path.startswith(p) for p in self.EXCLUDED_MOUNT_PREFIXES):
                        continue

                    info = self._get_disk_info(vol_path)
                    if not info:
                        continue
                    mount = info.get("MountPoint") or vol_path
                    if mount in seen_mounts:
                        continue

                    device = self._build_storage_device(info, mount)
                    if device and device.id not in seen_ids:
                        devices.append(device)
                        seen_mounts.add(mount)
                        seen_ids.add(device.id)
            except Exception:
                pass

        return devices

    def get_device_by_id(self, device_id: str) -> Optional[StorageDevice]:
        """Fetch a specific device by its identifier or node path."""
        for device in self.get_devices():
            if device.id == device_id or device.device_path == device_id or device.mount_point == device_id:
                return device
        return None
