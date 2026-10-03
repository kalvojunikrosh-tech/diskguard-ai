import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { EventNormalizer } from '../filesystem/eventNormalizer.js';

export class TelemetryWatcher extends EventEmitter {
  constructor() {
    super();
    this.watcher = null;
    this.activeDevice = null;
    this.status = 'STOPPED'; // 'STOPPED' | 'CONNECTING' | 'CONNECTED' | 'MONITORING' | 'PERMISSION_REQUIRED' | 'ERROR'
    this.eventBuffer = [];
    this.maxBufferSize = 200;
  }

  startMonitoring(device) {
    if (this.watcher) {
      this.stopMonitoring();
    }

    this.activeDevice = device;
    this.status = 'CONNECTING';
    this.emit('status_change', this.status);

    const watchPath = device.mountPoint;

    // Check directory accessibility first
    try {
      fs.accessSync(watchPath, fs.constants.R_OK);
    } catch (err) {
      console.warn(`[TelemetryWatcher] Permission denied accessing mount point ${watchPath}:`, err.message);
      this.status = 'PERMISSION_REQUIRED';
      this.emit('status_change', this.status);
      this.emit('permission_error', {
        deviceId: device.id,
        mountPoint: watchPath,
        message: 'Permission required to monitor this storage location.'
      });
      return false;
    }

    try {
      // Use chokidar in strictly READ-ONLY observation mode
      this.watcher = chokidar.watch(watchPath, {
        ignored: /(^|[\/\\])\..|node_modules|\.git|\$RECYCLE\.BIN|System Volume Information/, // ignore hidden files & system dirs
        persistent: true,
        ignoreInitial: true,
        depth: 3, // Safe recursion depth limit
        awaitWriteFinish: false,
        usePolling: false
      });

      this.watcher
        .on('add', (filePath, stats) => this.handleFsEvent('add', filePath, stats))
        .on('change', (filePath, stats) => this.handleFsEvent('change', filePath, stats))
        .on('unlink', (filePath) => this.handleFsEvent('unlink', filePath))
        .on('unlinkDir', (dirPath) => this.handleFsEvent('unlinkDir', dirPath))
        .on('error', (error) => {
          console.error('[TelemetryWatcher] Watcher error:', error);
          if (error.code === 'EACCES' || error.code === 'EPERM') {
            this.status = 'PERMISSION_REQUIRED';
            this.emit('status_change', this.status);
          } else {
            this.status = 'ERROR';
            this.emit('status_change', this.status);
          }
        })
        .on('ready', () => {
          console.log(`[TelemetryWatcher] Read-Only monitoring active on ${device.name} (${watchPath})`);
          this.status = 'MONITORING';
          this.emit('status_change', this.status);
        });

      return true;
    } catch (err) {
      console.error('[TelemetryWatcher] Failed to start watcher:', err);
      this.status = 'ERROR';
      this.emit('status_change', this.status);
      return false;
    }
  }

  handleFsEvent(eventType, filePath, stats) {
    if (!this.activeDevice) return;

    const normalized = EventNormalizer.normalize({
      deviceId: this.activeDevice.id,
      eventType: eventType,
      filePath: filePath,
      stats: stats
    });

    this.eventBuffer.unshift(normalized);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.pop();
    }

    this.emit('telemetry_event', normalized);
  }

  stopMonitoring() {
    if (this.watcher) {
      try {
        this.watcher.close();
      } catch (err) {
        console.error('[TelemetryWatcher] Error closing watcher:', err);
      }
      this.watcher = null;
    }
    this.activeDevice = null;
    this.status = 'STOPPED';
    this.emit('status_change', this.status);
  }

  getRecentEvents(limit = 50) {
    return this.eventBuffer.slice(0, limit);
  }
}
