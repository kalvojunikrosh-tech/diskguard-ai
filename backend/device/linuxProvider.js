// Linux storage device provider (stub/extensible interface)
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LinuxProvider {
  static async getDiscoveredDevices() {
    if (process.platform !== 'linux') {
      return [];
    }

    try {
      const { stdout } = await execAsync('lsblk -J -o NAME,MOUNTPOINT,FSTYPE,SIZE,RO,RM,MODEL');
      const data = JSON.parse(stdout || '{}');
      const blockdevices = data.blockdevices || [];

      const devices = [];

      function parseBlock(dev) {
        if (dev.mountpoint) {
          devices.push({
            id: `linux_${dev.name}`,
            name: dev.model ? `${dev.model} (${dev.name})` : `Volume (${dev.name})`,
            model: dev.model || null,
            vendor: null,
            device: `/dev/${dev.name}`,
            mountPoint: dev.mountpoint,
            filesystem: dev.fstype || 'ext4',
            capacityBytes: 0,
            usedBytes: 0,
            freeBytes: 0,
            capacity: dev.size || 'Unavailable',
            used: 'Unavailable',
            free: 'Unavailable',
            percentUsed: 0,
            removable: Boolean(dev.rm),
            readOnly: Boolean(dev.ro),
            smartStatus: 'Unavailable',
            temp: null
          });
        }
        if (dev.children) {
          dev.children.forEach(parseBlock);
        }
      }

      blockdevices.forEach(parseBlock);
      return devices;
    } catch (err) {
      console.error('[LinuxProvider] Error discovering devices:', err);
      return [];
    }
  }
}
