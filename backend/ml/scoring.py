"""Deterministic anomaly and compounding risk calculation with explainable AI output."""
from typing import Dict, List, Tuple
from backend.ml.features import BehavioralFeatures


def calculate_risk_and_explanation(
    features: BehavioralFeatures,
    deviations: Dict[str, float],
    ml_class: str,
    ml_confidence: float,
    baseline_status: str
) -> Tuple[str, float, int, int, Dict]:
    """Calculate deterministic risk score, anomaly score, and machine-readable explanation.

    Compounding Rule:
    A single elevated signal (e.g. heavy sequential write from large file download)
    must NOT trigger ransomware classification. Risk increases significantly only
    when multiple behavioral indicators become abnormal concurrently (writes + renames + entropy + burstiness).

    Returns:
        (classification, confidence, anomaly_score, risk_score, explanation)
    """
    # 1. While baseline is learning, activity is strictly normal and safe,
    # and threat scoring must NOT be performed.
    if baseline_status == "learning":
        explanation = {
            "summary": "Behavior is within the learning window; baseline normal profile is establishing.",
            "signals": [],
            "top_features": []
        }
        return "normal", 0.5, 0, 0, explanation

    signals: List[Dict] = []
    total_raw_points = 0.0

    # 2. Inspect individual behavioral dimensions against baseline deviations
    write_dev = deviations.get("write_deviation", 0.0)
    if write_dev >= 2.0 and (features.write_frequency and features.write_frequency > 400.0):
        contrib = min(0.35, round(0.15 + (write_dev * 0.05), 2))
        signals.append({"feature": "write_frequency", "direction": "high", "contribution": contrib})
        total_raw_points += contrib

    mod_dev = deviations.get("mod_deviation", 0.0)
    if mod_dev >= 2.0 and (features.file_modification_rate and features.file_modification_rate > 250.0):
        contrib = min(0.35, round(0.15 + (mod_dev * 0.05), 2))
        signals.append({"feature": "file_modification_rate", "direction": "high", "contribution": contrib})
        total_raw_points += contrib

    rename_dev = deviations.get("rename_deviation", 0.0)
    if rename_dev >= 2.0 and (features.rename_rate and features.rename_rate > 20.0):
        contrib = min(0.40, round(0.20 + (rename_dev * 0.06), 2))
        signals.append({"feature": "rename_rate", "direction": "high", "contribution": contrib})
        total_raw_points += contrib

    burst_dev = deviations.get("burst_deviation", 0.0)
    if burst_dev >= 2.0 and (features.io_burstiness and features.io_burstiness > 3.5):
        contrib = min(0.25, round(0.10 + (burst_dev * 0.04), 2))
        signals.append({"feature": "io_burstiness", "direction": "high", "contribution": contrib})
        total_raw_points += contrib

    entropy_dev = deviations.get("entropy_deviation", 0.0)
    if entropy_dev >= 1.5 and (features.entropy_change and features.entropy_change > 1.8):
        contrib = min(0.45, round(0.25 + (entropy_dev * 0.08), 2))
        signals.append({"feature": "entropy_change", "direction": "high", "contribution": contrib})
        total_raw_points += contrib

    if features.read_write_ratio is not None and features.read_write_ratio < 0.1 and (features.write_frequency and features.write_frequency > 500.0):
        contrib = 0.12
        signals.append({"feature": "read_write_ratio", "direction": "low", "contribution": contrib})
        total_raw_points += contrib

    # Sort signals descending by contribution
    signals.sort(key=lambda s: s["contribution"], reverse=True)
    top_features = [s["feature"] for s in signals]

    abnormal_count = len(signals)

    # 3. Compounding Multiplier & Anomaly Score
    # Anomaly score represents statistical deviation distance from baseline
    mean_dev = (write_dev + mod_dev + rename_dev + burst_dev + entropy_dev) / 5.0
    anomaly_score = int(min(100, max(0, round(mean_dev * 18.0))))

    # Deterministic Risk Score
    if abnormal_count == 0:
        risk_score = min(15, anomaly_score)
        classification = "normal"
        confidence = max(0.85, ml_confidence)
        summary = "Behavior is within the established baseline."

    elif abnormal_count == 1:
        # Isolated signal: never label as ransomware! Elevated non-critical range (30-48)
        risk_score = min(48, max(30, int(total_raw_points * 110.0)))
        classification = "elevated activity"
        confidence = 0.80
        feat_name = signals[0]["feature"].replace("_", " ")
        summary = f"Elevated {feat_name} detected; behavior is unusual but non-malicious."

    elif abnormal_count == 2:
        # Dual signal (e.g. writes + modifications during normal software installation)
        risk_score = min(48, int(total_raw_points * 75.0))
        classification = "anomalous activity"
        confidence = 0.82
        summary = "Unusual write and file-modification activity detected."

    elif abnormal_count == 3:
        # Triple signal (e.g. writes + modifications + renames)
        risk_score = min(74, int(45.0 + (total_raw_points * 35.0)))
        classification = "suspicious behavioral pattern"
        confidence = max(0.85, ml_confidence)
        summary = "Suspicious behavioral pattern: concurrent high write velocity and mass file renames."

    else:
        # 4+ concurrent abnormal indicators (writes + modifications + renames + entropy shift + burstiness)
        risk_score = min(96, int(65.0 + (total_raw_points * 35.0)))
        classification = "ransomware-like behavior"
        confidence = max(0.90, ml_confidence)
        summary = "High-risk ransomware-like behavioral pattern: rapid file modifications, rename velocity, and entropy elevation."

    # Incorporate local ML inference probability
    if ml_class == "ransomware-like" and abnormal_count >= 2:
        risk_score = max(risk_score, 68)
        anomaly_score = max(anomaly_score, 65)

    return classification, round(confidence, 2), anomaly_score, risk_score, {
        "summary": summary,
        "signals": signals,
        "top_features": top_features
    }
