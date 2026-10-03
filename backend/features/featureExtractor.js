import path from 'path';

export class FeatureExtractor {
  constructor(windowMs = 5000) {
    this.windowMs = windowMs;
    this.eventWindow = [];
  }

  addEvent(event) {
    const now = Date.now();
    this.eventWindow.push({ ...event, timestampMs: now });
    this.cleanOldEvents(now);
  }

  cleanOldEvents(now = Date.now()) {
    const cutoff = now - this.windowMs;
    this.eventWindow = this.eventWindow.filter(e => e.timestampMs >= cutoff);
  }

  extractFeatures() {
    const now = Date.now();
    this.cleanOldEvents(now);

    const count = this.eventWindow.length;
    const windowSec = this.windowMs / 1000;

    if (count === 0) {
      return {
        writeRate: 0,
        modificationRate: 0,
        renameRate: 0,
        deleteRate: 0,
        totalOpsPerSec: 0,
        burstIntensity: 0,
        entropyDelta: 0.0,
        directoryBreadth: 0,
        eventCount: 0
      };
    }

    let writes = 0;
    let modifies = 0;
    let renames = 0;
    let deletes = 0;
    let entropySum = 0;
    const directories = new Set();

    for (const ev of this.eventWindow) {
      const type = ev.eventType;
      if (type === 'CREATE' || type === 'WRITE') writes++;
      else if (type === 'MODIFY') modifies++;
      else if (type === 'RENAME') renames++;
      else if (type === 'DELETE') deletes++;

      if (ev.path) {
        directories.add(path.dirname(ev.path));
        // Check for suspicious extension mutations (e.g. .locked, .crypto, .enc)
        const ext = path.extname(ev.path).toLowerCase();
        if (['.locked', '.crypto', '.enc', '.crypted', '.ransom'].includes(ext)) {
          entropySum += 0.8;
        } else if (type === 'MODIFY' || type === 'CREATE') {
          entropySum += 0.05;
        }
      }
    }

    const writeRate = Number((writes / windowSec).toFixed(2));
    const modificationRate = Number((modifies / windowSec).toFixed(2));
    const renameRate = Number((renames / windowSec).toFixed(2));
    const deleteRate = Number((deletes / windowSec).toFixed(2));
    const totalOpsPerSec = Number((count / windowSec).toFixed(2));

    // Burst intensity: ratio of activity in last 1 second vs average in 5-second window
    const last1SecCutoff = now - 1000;
    const last1SecEvents = this.eventWindow.filter(e => e.timestampMs >= last1SecCutoff).length;
    const burstIntensity = Number((last1SecEvents / (totalOpsPerSec || 1)).toFixed(2));

    const entropyDelta = Number(Math.min(1.0, entropySum / (count || 1)).toFixed(3));

    return {
      writeRate,
      modificationRate,
      renameRate,
      deleteRate,
      totalOpsPerSec,
      burstIntensity,
      entropyDelta,
      directoryBreadth: directories.size,
      eventCount: count
    };
  }

  clear() {
    this.eventWindow = [];
  }
}
