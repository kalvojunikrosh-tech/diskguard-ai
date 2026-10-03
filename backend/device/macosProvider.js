import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class MacOSProvider {
  static async getDiscoveredDevices() {
    try {
      // Execute df -k to get mounted filesystems with exact space metrics
      const { stdout: dfOut } = await execAsync('df -k');
      const dfLines = dfOut.trim().split('\n').slice(1);

      const drives = [];

      for (const line of dfLines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 9) continue;

        const devPath = parts[0];
        const blocks1k = parseInt(parts[1], 10) || 0;
        const used1k = parseInt(parts[2], 10) || 0;
        const avail1k = parseInt(parts[3], 10) || 0;
        const mountPoint = parts.slice(8).join(' ');

        // Skip internal system-virtual mounts that are not user storage volumes
        if (
          devPath.includes('devfs') ||
          mountPoint.startsWith('/System/Volumes/VM') ||
          mountPoint.startsWith('/System/Volumes/Preboot') ||
          mountPoint.startsWith('/System/Volumes/Update') ||
          mountPoint.startsWith('/System/Volumes/xarts') ||
          mountPoint.startsWith('/System/Volumes/iSCPreboot') ||
          mountPoint.startsWith('/System/Volumes/Hardware')
        ) {
          continue;
        }

        const capacityBytes = blocks1k * 1024;
        const usedBytes = used1k * 1024;
        const freeBytes = avail1k * 1024;

        const totalGb = (capacityBytes / (1024 * 1024 * 1024)).toFixed(1);
        const usedGb = (usedBytes / (1024 * 1024 * 1024)).toFixed(1);
        const freeGb = (freeBytes / (1024 * 1024 * 1024)).toFixed(1);
        const percentUsed = capacityBytes > 0 ? Math.round((usedBytes / capacityBytes) * 100) : 0;

        let name = 'Volume';
        let isExternal = false;
        let isRemovable = false;

        if (mountPoint === '/') {
          name = 'System Volume (Macintosh HD)';
        } else if (mountPoint === '/System/Volumes/Data') {
          name = 'Data Volume (Macintosh HD - Data)';
        } else if (mountPoint.startsWith('/Volumes/')) {
          name = mountPoint.replace('/Volumes/', '');
          isExternal = true;
          isRemovable = true;
        } else {
          name = path.basename(mountPoint) || 'Local Volume';
        }

        // Determine filesystem type and SMART status via diskutil info if possible
        let filesystem = 'APFS';
        let smartStatus = 'Unavailable';
        let model = 'Unavailable';
        let vendor = 'Unavailable';
        let isReadOnly = false;

        try {
          const { stdout: infoOut } = await execAsync(`diskutil info "${devPath}"`);
          
          if (infoOut.includes('File System Personality:')) {
            const fsMatch = infoOut.match(/File System Personality:\s+(.+)/);
            if (fsMatch) filesystem = fsMatch[1].trim();
          }

          if (infoOut.includes('SMART Status:')) {
            const smartMatch = infoOut.match(/SMART Status:\s+(.+)/);
            if (smartMatch) smartStatus = smartMatch[1].trim();
          }

          if (infoOut.includes('Device / Media Name:')) {
            const modelMatch = infoOut.match(/Device \/ Media Name:\s+(.+)/);
            if (modelMatch) model = modelMatch[1].trim();
          }

          if (infoOut.includes('Read-Only Media:')) {
            const roMatch = infoOut.match(/Read-Only Media:\s+(.+)/);
            if (roMatch && roMatch[1].trim().toLowerCase() === 'yes') {
              isReadOnly = true;
            }
          }
        } catch {
          // Fallback if diskutil fails for virtual mount
          smartStatus = 'Unavailable';
        }

        // Clean ID string for API usage
        const cleanId = devPath.replace('/dev/', '').replace(/[^a-zA-Z0-9_]/g, '_');

        drives.push({
          id: cleanId,
          name: name,
          model: model !== 'Unavailable' ? model : null,
          vendor: vendor !== 'Unavailable' ? vendor : null,
          device: devPath,
          mountPoint: mountPoint,
          filesystem: filesystem,
          capacityBytes: capacityBytes,
          usedBytes: usedBytes,
          freeBytes: freeBytes,
          capacity: `${totalGb} GB`,
          used: `${usedGb} GB`,
          free: `${freeGb} GB`,
          percentUsed: percentUsed,
          removable: isRemovable || isExternal,
          readOnly: isReadOnly,
          smartStatus: smartStatus,
          temp: null // Set to null as OS temperature requires root/vendor tools
        });
      }

      return drives;
    } catch (err) {
      console.error('[MacOSProvider] Error discovering storage devices:', err);
      return [];
    }
  }
}
