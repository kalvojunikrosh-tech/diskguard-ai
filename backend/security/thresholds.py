"""Centralized security thresholds and risk configuration for DiskGuard AI.

Defines deterministic classification tiers, trigger criteria, and signal weights.
"""
from typing import Dict

# Risk Score Severity Tiers (0 - 100)
SEVERITY_TIERS = {
    "LOW": {"min": 0, "max": 29, "label": "Low Risk"},
    "ELEVATED": {"min": 30, "max": 59, "label": "Elevated Risk"},
    "HIGH": {"min": 60, "max": 79, "label": "High Risk"},
    "CRITICAL": {"min": 80, "max": 100, "label": "Critical Threat"},
}
RISK_LEVELS = SEVERITY_TIERS

# Incident Trigger Criteria
# An incident requires risk >= threshold AND at least 2 concurrent suspicious signals
INCIDENT_TRIGGER_RISK_THRESHOLD = 60
INCIDENT_MIN_SUSPICIOUS_SIGNALS = 2
INCIDENT_PERSISTENCE_MIN_WINDOWS = 2  # Must persist over >= 2 rolling evaluation checks

INCIDENT_RULES = {
    "trigger_threshold": INCIDENT_TRIGGER_RISK_THRESHOLD,
    "min_signals": INCIDENT_MIN_SUSPICIOUS_SIGNALS,
    "persistence_windows": INCIDENT_PERSISTENCE_MIN_WINDOWS,
}

# Feature Deviation Sensitivity Thresholds (Z-Scores)
DEVIATION_THRESHOLDS: Dict[str, float] = {
    "write_frequency": 2.0,       # 2 std deviations above baseline
    "file_modification_rate": 2.0, # 2 std deviations above baseline
    "rename_rate": 2.0,           # 2 std deviations above baseline
    "io_burstiness": 2.0,         # 2 std deviations above baseline
    "entropy_change": 1.5,        # 1.5 bits/byte deviation shift
}

# Hard Operational Thresholds (fallback when baseline is young)
HARD_THRESHOLDS: Dict[str, float] = {
    "write_frequency": 250.0,       # ops/min
    "file_modification_rate": 45.0, # files/min
    "rename_rate": 15.0,           # renames/min
    "io_burstiness": 3.0,          # peak-to-mean ratio
    "entropy_change": 1.5,         # bits/byte
}


def get_risk_level(risk_score: int) -> str:
    """Return uppercase severity tier string (LOW, ELEVATED, HIGH, CRITICAL)."""
    if risk_score >= 80:
        return "CRITICAL"
    if risk_score >= 60:
        return "HIGH"
    if risk_score >= 30:
        return "ELEVATED"
    return "LOW"


def get_severity_label(risk_score: int) -> str:
    """Return normalized severity level based on risk score."""
    return get_risk_level(risk_score).lower()


def should_trigger_incident(risk_score: int, signals_count: int) -> bool:
    """Check whether risk and signal multiplicity satisfy incident trigger rules."""
    return (
        risk_score >= INCIDENT_TRIGGER_RISK_THRESHOLD
        and signals_count >= INCIDENT_MIN_SUSPICIOUS_SIGNALS
    )
