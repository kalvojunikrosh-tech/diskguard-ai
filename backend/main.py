import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.ml import (
    BehavioralFeatures,
    calculate_risk_and_explanation,
    extract_behavioral_features,
    get_baseline_engine,
    get_edge_model,
)
from backend.providers.base import StorageDevice
from backend.security import Incident, get_incident_manager
from backend.services.device_service import get_device_service
from backend.simulation import SafeSimulator, get_simulator, SUPPORTED_SCENARIOS
from backend.telemetry import TelemetrySnapshot, get_telemetry_collector

from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("diskguard.api")

app = FastAPI(
    title="DiskGuard AI Backend",
    description="Edge AI-Based Real-Time Ransomware and Anomalous Disk Activity Detection API",
    version="0.2.0"
)

# Unified JSON Error Handlers (Section 15: No raw Python tracebacks, clean JSON)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid request parameters.", "details": str(exc.errors()), "status_code": 400}
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Internal server error handling %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred.", "status_code": 500}
    )

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class DevicesResponse(BaseModel):
    devices: List[StorageDevice]


class MonitorRequest(BaseModel):
    device_id: str = Field(..., description="Storage device identifier to start/stop monitoring")


class MonitorResponse(BaseModel):
    status: str
    device_id: str
    message: str


class TelemetryResponse(BaseModel):
    device_id: str
    count: int
    snapshots: List[TelemetrySnapshot]


class AnalysisResponse(BaseModel):
    device_id: str
    baseline_status: str
    learning_progress: Optional[Dict[str, int]] = None
    classification: str
    confidence: float
    anomaly_score: int
    risk_score: int
    features: Dict[str, Any]
    explanation: Dict[str, Any]
    telemetry_source: str = Field("hardware", description="'hardware' or 'simulation'")


class SimulationStartRequest(BaseModel):
    scenario: str = Field("normal", description="Scenario: normal, elevated_writes, mass_rename, high_entropy_test, ransomware_like_burst")
    device_id: Optional[str] = Field(None, description="Optional target device ID for simulation telemetry")


class SimulationStatusResponse(BaseModel):
    running: bool
    scenario: str
    sandbox: bool


@app.get("/api/health")
def get_health() -> Dict[str, str]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "diskguard-api",
        "platform": "macos",
        "mode": "read-only-telemetry"
    }


@app.get("/api/devices", response_model=DevicesResponse)
def get_devices():
    """Return the currently detected real storage devices."""
    service = get_device_service()
    devices = service.list_devices()
    return {"devices": devices}


@app.get("/api/devices/{device_id}", response_model=StorageDevice)
def get_device(device_id: str):
    """Return details for a specific detected storage device."""
    service = get_device_service()
    device = service.get_device(device_id)
    if not device:
        raise HTTPException(
            status_code=404,
            detail=f"Storage device with ID '{device_id}' was not found."
        )
    return device


@app.post("/api/monitor/start", response_model=MonitorResponse)
def start_monitoring(req: MonitorRequest):
    """Start real-time, read-only telemetry observation for a storage device."""
    collector = get_telemetry_collector()

    # Idempotent handling: return sensible response if already running
    if req.device_id in collector._providers:
        return {
            "status": "already_monitoring",
            "device_id": req.device_id,
            "message": f"Storage device '{req.device_id}' is already actively monitored."
        }

    service = get_device_service()
    device = service.get_device(req.device_id)
    if not device:
        # Check if root or known device node
        if req.device_id in ("disk0", "disk3s1s1", "/"):
            device = StorageDevice(
                id=req.device_id,
                name="Primary Storage",
                mount_point="/",
                device_path=f"/dev/{req.device_id}",
                filesystem="apfs",
                device_type="ssd",
                removable=False,
                platform="macos"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Storage device '{req.device_id}' not found. Cannot start telemetry."
            )

    # Reset baseline for fresh monitoring session
    baseline_engine = get_baseline_engine()
    baseline_engine.reset(req.device_id)

    success = collector.start_monitoring(device)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to initialize telemetry observer.")

    return {
        "status": "monitoring_started",
        "device_id": req.device_id,
        "message": f"Started read-only telemetry observation on {device.name} ({device.id})."
    }


@app.post("/api/monitor/stop", response_model=MonitorResponse)
def stop_monitoring(req: MonitorRequest):
    """Stop telemetry observation for a storage device."""
    collector = get_telemetry_collector()

    # Sensible response if device is not currently monitored
    if req.device_id not in collector._providers:
        return {
            "status": "not_monitoring",
            "device_id": req.device_id,
            "message": f"Storage device '{req.device_id}' is not currently being monitored."
        }

    collector.stop_monitoring(req.device_id)
    collector.clear_window(req.device_id)
    baseline_engine = get_baseline_engine()
    baseline_engine.reset(req.device_id)
    return {
        "status": "monitoring_stopped",
        "device_id": req.device_id,
        "message": f"Stopped observation on {req.device_id}."
    }


@app.get("/api/telemetry/{device_id}", response_model=TelemetryResponse)
def get_telemetry(device_id: str):
    """Return the latest rolling telemetry window (up to 30 snapshots) for a device."""
    collector = get_telemetry_collector()
    snapshots = collector.get_telemetry_window(device_id, limit=30)
    return {
        "device_id": device_id,
        "count": len(snapshots),
        "snapshots": snapshots
    }


@app.get("/api/analysis/{device_id}", response_model=AnalysisResponse)
def get_analysis(device_id: str):
    """Return real-time behavioral analysis, anomaly score, risk score, and ML inference."""
    collector = get_telemetry_collector()
    baseline_engine = get_baseline_engine()
    model = get_edge_model()
    sim = get_simulator()

    is_sim = sim.is_running and sim.is_simulating(device_id)
    has_snapshots = bool(collector.get_telemetry_window(device_id, limit=1))
    is_active = collector.is_monitoring(device_id) or is_sim or has_snapshots
    if not is_active:
        return {
            "device_id": device_id,
            "baseline_status": "standby",
            "learning_progress": None,
            "classification": "normal",
            "confidence": 0.0,
            "anomaly_score": 0,
            "risk_score": 0,
            "features": {},
            "explanation": {
                "summary": "Device is in standby. Start monitoring to begin telemetry observation.",
                "signals": [],
                "top_features": []
            },
            "telemetry_source": "hardware"
        }

    snapshots = collector.get_telemetry_window(device_id, limit=30)

    if not snapshots:
        profile = baseline_engine.get_profile(device_id)
        return {
            "device_id": device_id,
            "baseline_status": "learning",
            "learning_progress": profile.learning_progress,
            "classification": "normal",
            "confidence": 0.0,
            "anomaly_score": 0,
            "risk_score": 0,
            "features": {},
            "explanation": {
                "summary": "Observation active. Gathering initial telemetry snapshots...",
                "signals": [],
                "top_features": []
            },
            "telemetry_source": "simulation" if is_sim else "hardware"
        }

    # Extract behavioral features over rolling window
    profile = baseline_engine.get_profile(device_id)
    features = extract_behavioral_features(snapshots, baseline_entropy=profile.mean_entropy)

    # Record into adaptive baseline only during real monitoring (never while simulation is running)
    if not is_sim:
        updated_profile = baseline_engine.record_observation(device_id, features)
    else:
        updated_profile = profile

    # Compute statistical deviations
    deviations = baseline_engine.compute_deviations(device_id, features)

    # Local Edge AI inference
    ml_class, ml_conf, _ = model.predict(features)

    # Deterministic scoring & explainable AI
    classification, confidence, anomaly_score, risk_score, explanation = calculate_risk_and_explanation(
        features=features,
        deviations=deviations,
        ml_class=ml_class,
        ml_confidence=ml_conf,
        baseline_status=updated_profile.status
    )

    # Record and evaluate security incidents if sustained risk is present
    incident_mgr = get_incident_manager()
    incident_mgr.evaluate_and_record(
        device_id=device_id,
        risk_score=risk_score,
        anomaly_score=anomaly_score,
        classification=classification,
        confidence=confidence,
        features=features.model_dump(),
        explanation_data=explanation,
        baseline_profile=updated_profile
    )

    return {
        "device_id": device_id,
        "baseline_status": updated_profile.status,
        "learning_progress": updated_profile.learning_progress,
        "classification": classification,
        "confidence": confidence,
        "anomaly_score": anomaly_score,
        "risk_score": risk_score,
        "features": features.model_dump(),
        "explanation": explanation,
        "telemetry_source": "simulation" if is_sim else "hardware"
    }


# =============================================================================
# SIMULATION ENDPOINTS (Safe Sandbox Only)
# =============================================================================

@app.post("/api/simulation/start")
def start_simulation(req: SimulationStartRequest):
    """Start safe sandbox behavioral simulation."""
    if req.scenario not in SUPPORTED_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported scenario '{req.scenario}'. Supported scenarios: {list(SUPPORTED_SCENARIOS)}"
        )

    sim = get_simulator()
    try:
        sim.start(req.scenario, device_id=req.device_id)
        return {
            "status": "simulation_started",
            "scenario": req.scenario,
            "sandbox": True,
            "message": f"Started safe sandbox simulation scenario '{req.scenario}'."
        }
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulation/stop")
def stop_simulation():
    """Stop active safe sandbox simulation."""
    sim = get_simulator()
    sim.stop()
    return {
        "status": "simulation_stopped",
        "running": False,
        "scenario": "none",
        "sandbox": True,
        "message": "Safe sandbox simulation stopped and cleaned up."
    }


@app.get("/api/simulation/status", response_model=SimulationStatusResponse)
def get_simulation_status():
    """Return status of safe sandbox simulation."""
    sim = get_simulator()
    return sim.get_status()


# =============================================================================
# INCIDENT ENDPOINTS
# =============================================================================

@app.get("/api/incidents")
def list_incidents():
    """Return all detected security incidents."""
    mgr = get_incident_manager()
    incidents = mgr.get_all()
    return {"incidents": incidents}


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str):
    """Return details for a specific incident."""
    mgr = get_incident_manager()
    inc = mgr.get_by_id(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return inc


@app.post("/api/incidents/{incident_id}/acknowledge")
def acknowledge_incident(incident_id: str):
    """Acknowledge incident and set status to investigating."""
    mgr = get_incident_manager()
    inc = mgr.acknowledge(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return {"status": "acknowledged", "incident": inc}


@app.post("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str):
    """Mark incident as resolved."""
    mgr = get_incident_manager()
    inc = mgr.resolve(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return {"status": "resolved", "incident": inc}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
