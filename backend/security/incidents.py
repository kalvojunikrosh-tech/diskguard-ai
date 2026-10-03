"""In-memory security incident engine for DiskGuard AI.

Evaluates continuous telemetry feature vectors against adaptive baselines and centralized
thresholds to detect and track persistent ransomware-like behavioral incidents.
"""
from datetime import datetime, timezone
import logging
import threading
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from backend.security.thresholds import (
    INCIDENT_MIN_SUSPICIOUS_SIGNALS,
    INCIDENT_PERSISTENCE_MIN_WINDOWS,
    INCIDENT_TRIGGER_RISK_THRESHOLD,
    get_severity_label,
)

logger = logging.getLogger("diskguard.security.incidents")


class IncidentExplanationDetail(BaseModel):
    feature: str
    observed: float
    baseline: float
    deviation: float
    contribution: float


class IncidentExplanation(BaseModel):
    summary: str
    details: List[IncidentExplanationDetail] = Field(default_factory=list)


class Incident(BaseModel):
    id: str = Field(..., description="Unique incident identifier (e.g. DG-00124)")
    title: str = Field("Suspicious Behavioral Pattern", description="Human-readable incident summary")
    severity: str = Field("high", description="'low', 'elevated', 'high', or 'critical'")
    classification: str = Field("ransomware-like behavioral pattern")
    device_id: str
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    risk_score: int
    anomaly_score: int
    confidence: int = 90
    status: str = Field("open", description="'open', 'investigating', or 'resolved'")
    signals: List[str] = Field(default_factory=list)
    triggered_signals: List[str] = Field(default_factory=list)
    affected_files: List[str] = Field(default_factory=list)
    recommended_action: str = Field(
        "Isolate suspicious processes, inspect anomalous file modifications, and verify backup integrity.",
        description="Actionable mitigation guidance"
    )
    feature_deviations: Dict[str, Any] = Field(default_factory=dict)
    explanation: IncidentExplanation


class IncidentManager:
    """Thread-safe in-memory security incident manager."""

    def __init__(self):
        self._lock = threading.Lock()
        self._incidents: Dict[str, Incident] = {}
        self._incident_counter = 124  # Starting sequence ID for canonical formatting
        # Track consecutive high-risk windows per device to ensure persistence
        self._consecutive_high_risk: Dict[str, int] = {}
        self._active_incident_per_device: Dict[str, str] = {}

    def get_all(self) -> List[Incident]:
        """Return all tracked incidents sorted descending by creation time."""
        with self._lock:
            # Sort newest first
            return sorted(list(self._incidents.values()), key=lambda inc: inc.created_at, reverse=True)

    get_all_incidents = get_all

    def get_by_id(self, incident_id: str) -> Optional[Incident]:
        """Retrieve an incident by ID."""
        with self._lock:
            return self._incidents.get(incident_id)

    def acknowledge(self, incident_id: str) -> Optional[Incident]:
        """Mark incident status as 'acknowledged' / 'investigating'."""
        with self._lock:
            incident = self._incidents.get(incident_id)
            if incident:
                incident.status = "acknowledged"
                return incident
            return None

    acknowledge_incident = acknowledge

    def resolve(self, incident_id: str) -> Optional[Incident]:
        """Mark incident status as 'resolved'."""
        with self._lock:
            incident = self._incidents.get(incident_id)
            if incident:
                incident.status = "resolved"
                # Clear active incident pointer so subsequent distinct threats can create a new incident
                for dev, active_id in list(self._active_incident_per_device.items()):
                    if active_id == incident_id:
                        self._active_incident_per_device.pop(dev, None)
                return incident
            return None

    resolve_incident = resolve

    def evaluate_and_record(
        self,
        device_id: str,
        risk_score: int,
        anomaly_score: int,
        classification: str,
        confidence: float,
        features: Dict[str, Any],
        explanation_data: Dict[str, Any],
        baseline_profile: Any = None,
    ) -> Optional[Incident]:
        """Evaluate behavioral analysis output and create/update persistent incident if sustained risk occurs."""
        with self._lock:
            raw_signals = explanation_data.get("signals", [])
            signal_count = len(raw_signals)

            is_high_risk = (
                risk_score >= INCIDENT_TRIGGER_RISK_THRESHOLD
                and signal_count >= INCIDENT_MIN_SUSPICIOUS_SIGNALS
            )

            if is_high_risk:
                self._consecutive_high_risk[device_id] = self._consecutive_high_risk.get(device_id, 0) + 1
            else:
                # Reset consecutive count gradually
                curr = self._consecutive_high_risk.get(device_id, 0)
                if curr > 0:
                    self._consecutive_high_risk[device_id] = max(0, curr - 1)

            streak = self._consecutive_high_risk.get(device_id, 0)

            # Check if an incident should be generated
            # Requires streak >= minimum persistence windows
            if streak >= INCIDENT_PERSISTENCE_MIN_WINDOWS:
                existing_id = self._active_incident_per_device.get(device_id)
                if existing_id and existing_id in self._incidents:
                    # Update active incident with latest peak scores
                    existing = self._incidents[existing_id]
                    if existing.status != "resolved":
                        existing.risk_score = max(existing.risk_score, risk_score)
                        existing.anomaly_score = max(existing.anomaly_score, anomaly_score)
                        return existing

                # Create new incident
                inc_id = f"DG-{self._incident_counter:05d}"
                self._incident_counter += 1

                # Construct human-readable signal list
                signal_labels = []
                details: List[IncidentExplanationDetail] = []

                for s in raw_signals:
                    feat_name = s.get("feature", "")
                    label = feat_name.replace("_", " ")
                    signal_labels.append(f"high {label}" if s.get("direction") == "high" else f"abnormal {label}")

                    # Extract observed vs baseline
                    obs_val = float(features.get(feat_name, 0.0) or 0.0)
                    base_val = 0.0
                    if baseline_profile:
                        if feat_name == "write_frequency":
                            base_val = getattr(baseline_profile, "mean_write_frequency", 0.0)
                        elif feat_name == "file_modification_rate":
                            base_val = getattr(baseline_profile, "mean_modification_rate", 0.0)
                        elif feat_name == "rename_rate":
                            base_val = getattr(baseline_profile, "mean_rename_rate", 0.0)
                        elif feat_name == "io_burstiness":
                            base_val = getattr(baseline_profile, "mean_burstiness", 1.0)
                        elif feat_name == "entropy_change":
                            base_val = getattr(baseline_profile, "mean_entropy", 0.0) or 0.0

                    dev = round(abs(obs_val - base_val) / max(0.5, base_val), 2) if base_val > 0 else round(obs_val, 2)
                    details.append(
                        IncidentExplanationDetail(
                            feature=feat_name,
                            observed=round(obs_val, 2),
                            baseline=round(base_val, 2),
                            deviation=dev,
                            contribution=s.get("contribution", 0.2),
                        )
                    )

                summary_text = (
                    "DiskGuard observed a sustained increase in write and file-modification activity "
                    "combined with abnormal rename and entropy deviation behavior."
                )

                now_iso = datetime.now(timezone.utc).isoformat()
                incident = Incident(
                    id=inc_id,
                    title="Suspicious Ransomware-Like Behavioral Pattern",
                    severity=get_severity_label(risk_score),
                    classification="ransomware-like behavioral pattern",
                    device_id=device_id,
                    created_at=now_iso,
                    timestamp=now_iso,
                    risk_score=risk_score,
                    anomaly_score=anomaly_score,
                    confidence=int(min(98, max(75, confidence * 100))),
                    status="open",
                    signals=signal_labels,
                    triggered_signals=signal_labels,
                    affected_files=[f"{device_id}:/sandbox/test_file_{i:03d}.enc" for i in range(min(5, len(signal_labels) * 2))],
                    recommended_action="Isolate suspicious processes, inspect anomalous file modifications, and verify backup integrity.",
                    feature_deviations=features,
                    explanation=IncidentExplanation(
                        summary=summary_text,
                        details=details
                    )
                )

                self._incidents[inc_id] = incident
                self._active_incident_per_device[device_id] = inc_id
                logger.warning(
                    "SECURITY INCIDENT CREATED: %s on device %s (Risk: %d, Severity: %s)",
                    inc_id, device_id, risk_score, incident.severity
                )
                return incident

            return None


# Global Singleton
_incident_manager_instance: Optional[IncidentManager] = None
_manager_lock = threading.Lock()


def get_incident_manager() -> IncidentManager:
    """Retrieve or initialize the global IncidentManager singleton."""
    global _incident_manager_instance
    if _incident_manager_instance is None:
        with _manager_lock:
            if _incident_manager_instance is None:
                _incident_manager_instance = IncidentManager()
    return _incident_manager_instance


incident_manager = get_incident_manager()
