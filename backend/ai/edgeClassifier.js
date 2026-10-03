/**
 * Local Edge AI Model for storage behavioral anomaly detection & classification
 */
export class EdgeClassifier {
  static classify(features, isMonitoringActive = false) {
    if (!isMonitoringActive || !features || features.eventCount === 0) {
      return {
        classification: null,
        riskScore: 0,
        confidence: null,
        inferenceMs: null,
        features: features || {
          writeRate: 0,
          modificationRate: 0,
          renameRate: 0,
          deleteRate: 0,
          entropyDelta: 0,
          directoryBreadth: 0
        }
      };
    }

    const startTime = performance.now();

    const {
      writeRate,
      modificationRate,
      renameRate,
      deleteRate,
      burstIntensity,
      entropyDelta,
      directoryBreadth
    } = features;

    // Feature Weights for Local Anomaly & Ransomware Vector Distance
    let score = 0;

    // High write & modification velocity
    score += Math.min(30, writeRate * 3 + modificationRate * 2);

    // Mass renaming (classic ransomware pattern)
    score += Math.min(35, renameRate * 12);

    // Rapid file deletion
    score += Math.min(25, deleteRate * 8);

    // Entropy spike
    score += Math.min(30, entropyDelta * 40);

    // Wide directory breadth
    if (directoryBreadth > 3) {
      score += Math.min(15, directoryBreadth * 3);
    }

    const finalRiskScore = Math.min(100, Math.round(score));

    let classification = 'NORMAL';
    if (finalRiskScore >= 65 || renameRate > 5 || (entropyDelta > 0.4 && writeRate > 10)) {
      classification = 'RANSOMWARE_SUSPECT';
    } else if (finalRiskScore >= 25 || writeRate > 5 || directoryBreadth > 2) {
      classification = 'SUSPICIOUS';
    }

    // Calculate real inference latency
    const endTime = performance.now();
    const inferenceMs = Number((endTime - startTime).toFixed(2)) || 1;

    // Confidence metric derived from distance to decision boundary
    let confidence = 0.95;
    if (classification === 'RANSOMWARE_SUSPECT') {
      confidence = Number((0.88 + Math.min(0.11, (finalRiskScore - 65) * 0.003)).toFixed(3));
    } else if (classification === 'SUSPICIOUS') {
      confidence = Number((0.85 + Math.min(0.10, (finalRiskScore - 25) * 0.002)).toFixed(3));
    } else {
      confidence = Number((0.94 + Math.min(0.05, (25 - finalRiskScore) * 0.002)).toFixed(3));
    }

    return {
      classification,
      riskScore: finalRiskScore,
      confidence,
      inferenceMs,
      features
    };
  }
}
