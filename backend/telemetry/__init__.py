"""DiskGuard AI Telemetry Subsystem."""
from backend.telemetry.base import BaseTelemetryProvider, TelemetrySnapshot
from backend.telemetry.collector import TelemetryCollector, get_telemetry_collector
from backend.telemetry.macos import MacOSTelemetryProvider

__all__ = [
    "BaseTelemetryProvider",
    "TelemetrySnapshot",
    "TelemetryCollector",
    "get_telemetry_collector",
    "MacOSTelemetryProvider",
]
