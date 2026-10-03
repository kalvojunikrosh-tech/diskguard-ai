import { EventEmitter } from 'events';
import { MacOSProvider } from './macosProvider.js';
import { WindowsProvider } from './windowsProvider.js';
import { LinuxProvider } from './linuxProvider.js';

export class DeviceDetector extends EventEmitter {
  constructor() {
    super();
    this.discoveredDevices = [];
    this.selectedDeviceId = null;
    this.monitoredDeviceId = null;
    this.pollInterval = null;
    this.isPolling = false;
  }

  async getDevices() {
    let devices = [];
    const platform = process.platform;

    if (platform === 'darwin') {
      devices = await MacOSProvider.getDiscoveredDevices();
    } else if (platform === 'win32') {
      devices = await WindowsProvider.getDiscoveredDevices();
    } else if (platform === 'linux') {
      devices = await LinuxProvider.getDiscoveredDevices();
    } else {
      devices = await MacOSProvider.getDiscoveredDevices();
    }

    return devices;
  }

  startHotPlugDetection(intervalMs = 3000) {
    if (this.isPolling) return;
    this.isPolling = true;

    // Initial query
    this.checkDeviceChanges();

    this.pollInterval = setInterval(() => {
      this.checkDeviceChanges();
    }, intervalMs);
  }

  stopHotPlugDetection() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  async checkDeviceChanges() {
    try {
      const currentDevices = await this.getDevices();
      const currentIds = new Set(currentDevices.map(d => d.id));
      const previousIds = new Set(this.discoveredDevices.map(d => d.id));

      // Check for newly connected devices
      for (const dev of currentDevices) {
        if (!previousIds.has(dev.id)) {
          console.log(`[DeviceDetector] STORAGE DEVICE CONNECTED: ${dev.name} (${dev.mountPoint})`);
          this.emit('device_connected', dev);
        }
      }

      // Check for disconnected devices
      for (const oldDev of this.discoveredDevices) {
        if (!currentIds.has(oldDev.id)) {
          console.log(`[DeviceDetector] STORAGE DEVICE DISCONNECTED: ${oldDev.name} (${oldDev.mountPoint})`);
          this.emit('device_disconnected', oldDev);

          // If the currently monitored device was removed, emit safe shutdown event
          if (this.monitoredDeviceId === oldDev.id) {
            console.warn(`[DeviceDetector] Monitored device ${oldDev.id} disconnected safely!`);
            this.emit('monitored_device_removed', oldDev);
            this.monitoredDeviceId = null;
          }

          if (this.selectedDeviceId === oldDev.id) {
            this.selectedDeviceId = null;
          }
        }
      }

      this.discoveredDevices = currentDevices;
      this.emit('devices_updated', this.discoveredDevices);
    } catch (err) {
      console.error('[DeviceDetector] Error checking device hot-plug:', err);
    }
  }

  getDeviceById(id) {
    return this.discoveredDevices.find(d => d.id === id) || null;
  }
}
