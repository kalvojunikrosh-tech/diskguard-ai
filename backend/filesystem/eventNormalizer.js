/**
 * Normalizes filesystem events into DiskGuard's standard internal schema
 */
export class EventNormalizer {
  static normalize({ deviceId, eventType, filePath, stats = null }) {
    let normalizedType = 'MODIFY';
    const upper = (eventType || '').toUpperCase();

    if (upper.includes('ADD') || upper.includes('CREATE')) {
      normalizedType = 'CREATE';
    } else if (upper.includes('UNLINK') || upper.includes('DELETE') || upper.includes('REMOVE')) {
      normalizedType = 'DELETE';
    } else if (upper.includes('RENAME') || upper.includes('MOVE')) {
      normalizedType = 'RENAME';
    } else if (upper.includes('READ')) {
      normalizedType = 'READ';
    } else {
      normalizedType = 'MODIFY';
    }

    return {
      timestamp: new Date().toISOString(),
      deviceId: deviceId,
      eventType: normalizedType,
      path: filePath,
      size: stats ? stats.size : null,
      processId: null,
      processName: null
    };
  }
}
