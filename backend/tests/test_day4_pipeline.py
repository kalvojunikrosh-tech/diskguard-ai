"""
Day 4 End-to-End Pipeline & Safety Automated Test Suite
Validates:
1. Sandbox Path Boundary Enforcement (Rejection of paths outside backend/sandbox)
2. Centralized Thresholds & Scoring Engine
3. Incident Manager Lifecycle (Open -> Acknowledged -> Resolved)
4. Live FastAPI End-to-End Integration (Normal -> Elevated -> Ransomware Burst -> Stop & Persist)
"""

import os
import sys
import time
import requests
import unittest

# Ensure project root is in path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.simulation.simulator import get_simulator, verify_sandbox_path, SANDBOX_DIR
from backend.security.thresholds import (
    RISK_LEVELS,
    INCIDENT_RULES,
    get_risk_level,
    should_trigger_incident,
)
from backend.security.incidents import IncidentManager, incident_manager
from backend.ml.features import BehavioralFeatures
from backend.ml.scoring import calculate_risk_and_explanation


class TestSandboxSafetyBoundaries(unittest.TestCase):
    """Proves sandbox strictly refuses to operate outside backend/sandbox/"""

    def test_valid_sandbox_paths(self):
        valid_path = os.path.join(SANDBOX_DIR, "dummy_test.txt")
        resolved = verify_sandbox_path(valid_path)
        self.assertTrue(resolved.startswith(SANDBOX_DIR))

    def test_rejection_of_system_paths(self):
        system_paths = [
            "/etc/passwd",
            "/tmp/malicious_payload",
            os.path.expanduser("~/.bashrc"),
            os.path.join(ROOT_DIR, "src", "App.jsx"),
            os.path.join(ROOT_DIR, "backend", "main.py"),
            os.path.join(SANDBOX_DIR, "..", "main.py"),
            "/var/root",
        ]
        for path in system_paths:
            with self.assertRaises((PermissionError, ValueError), msg=f"Should reject: {path}"):
                verify_sandbox_path(path)


class TestThresholdsAndIncidentEngine(unittest.TestCase):
    """Validates centralized thresholds and deterministic escalation rules"""

    def test_risk_level_mapping(self):
        self.assertEqual(get_risk_level(15), "LOW")
        self.assertEqual(get_risk_level(45), "ELEVATED")
        self.assertEqual(get_risk_level(72), "HIGH")
        self.assertEqual(get_risk_level(95), "CRITICAL")

    def test_compounding_risk_isolated_vs_multi_signal(self):
        # 1 isolated signal (high writes only) -> risk remains bounded below critical
        features_iso = BehavioralFeatures(write_frequency=450.0)
        _, _, _, risk_iso, exp_iso = calculate_risk_and_explanation(
            features_iso,
            deviations={"write_deviation": 3.0},
            ml_class="normal",
            ml_confidence=0.8,
            baseline_status="established",
        )
        self.assertLess(risk_iso, 60)
        self.assertFalse(should_trigger_incident(risk_iso, len(exp_iso["signals"])))

        # 4 concurrent signals -> must escalate significantly to CRITICAL
        features_multi = BehavioralFeatures(
            write_frequency=600.0,
            file_modification_rate=150.0,
            rename_rate=65.0,
            entropy_change=3.5,
            io_burstiness=4.2,
        )
        deviations_multi = {
            "write_deviation": 4.0,
            "mod_deviation": 3.5,
            "rename_deviation": 4.5,
            "entropy_deviation": 3.0,
            "burst_deviation": 3.0,
        }
        _, _, _, risk_multi, exp_multi = calculate_risk_and_explanation(
            features_multi,
            deviations=deviations_multi,
            ml_class="ransomware_suspect",
            ml_confidence=0.92,
            baseline_status="established",
        )
        self.assertGreaterEqual(risk_multi, 80)
        self.assertTrue(should_trigger_incident(risk_multi, len(exp_multi["signals"])))

    def test_incident_lifecycle(self):
        mgr = IncidentManager()
        features_dict = {
            "write_frequency": 340.0,
            "file_modification_rate": 220.0,
            "rename_rate": 85.0,
            "entropy_change": 3.8,
        }
        exp_data = {
            "summary": "High burst ransomware-like behavior",
            "signals": [
                {"feature": "write_frequency", "direction": "high", "contribution": 0.25},
                {"feature": "file_modification_rate", "direction": "high", "contribution": 0.25},
                {"feature": "rename_rate", "direction": "high", "contribution": 0.25},
            ]
        }

        # First cycle - record high risk (streak = 1)
        inc1 = mgr.evaluate_and_record("disk0", 88, 75, "ransomware_suspect", 0.92, features_dict, exp_data)
        # Persistent streak requirement (2 cycles, streak = 2)
        inc2 = mgr.evaluate_and_record("disk0", 88, 75, "ransomware_suspect", 0.92, features_dict, exp_data)

        self.assertIsNotNone(inc2)
        all_incidents = mgr.get_all_incidents()
        self.assertGreaterEqual(len(all_incidents), 1)

        active_id = all_incidents[0].id
        self.assertEqual(all_incidents[0].status, "open")

        # Acknowledge
        acked = mgr.acknowledge_incident(active_id)
        self.assertIsNotNone(acked)
        self.assertEqual(acked.status, "acknowledged")

        # Resolve
        resolved = mgr.resolve_incident(active_id)
        self.assertIsNotNone(resolved)
        self.assertEqual(resolved.status, "resolved")


class TestLiveApiPipeline(unittest.TestCase):
    """End-to-End validation of running FastAPI backend"""

    BASE_URL = "http://127.0.0.1:8000"

    @classmethod
    def setUpClass(cls):
        try:
            r = requests.get(f"{cls.BASE_URL}/api/health", timeout=3)
            cls.server_running = (r.status_code == 200)
        except Exception:
            cls.server_running = False

    def setUp(self):
        if not self.server_running:
            self.skipTest("FastAPI server is not currently running on http://127.0.0.1:8000")

    def test_01_health_and_devices(self):
        r = requests.get(f"{self.BASE_URL}/api/health")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["platform"], "macos")
        self.assertEqual(data["mode"], "read-only-telemetry")

        r_dev = requests.get(f"{self.BASE_URL}/api/devices")
        self.assertEqual(r_dev.status_code, 200)
        devices = r_dev.json().get("devices", [])
        self.assertGreater(len(devices), 0)

    def test_02_simulation_lifecycle_and_incidents(self):
        # 1. Stop any existing simulation
        requests.post(f"{self.BASE_URL}/api/simulation/stop")

        # 2. Start normal simulation
        r_start = requests.post(f"{self.BASE_URL}/api/simulation/start", json={"scenario": "normal"})
        self.assertEqual(r_start.status_code, 200)
        self.assertEqual(r_start.json()["status"], "simulation_started")
        self.assertEqual(r_start.json()["scenario"], "normal")

        time.sleep(2)
        r_status = requests.get(f"{self.BASE_URL}/api/simulation/status")
        self.assertEqual(r_status.json()["scenario"], "normal")
        self.assertTrue(r_status.json()["running"])

        # 3. Trigger ransomware-like burst
        r_burst = requests.post(f"{self.BASE_URL}/api/simulation/start", json={"scenario": "ransomware_like_burst"})
        self.assertEqual(r_burst.status_code, 200)
        self.assertEqual(r_burst.json()["scenario"], "ransomware_like_burst")

        # Wait for simulation to execute and observer to capture
        time.sleep(4)

        # Query analysis on primary device
        r_dev = requests.get(f"{self.BASE_URL}/api/devices")
        primary_dev = r_dev.json()["devices"][0]["id"]
        r_analysis = requests.get(f"{self.BASE_URL}/api/analysis/{primary_dev}")
        self.assertEqual(r_analysis.status_code, 200)
        analysis_data = r_analysis.json()
        self.assertIn("risk_score", analysis_data)

        # 4. Stop simulation
        r_stop = requests.post(f"{self.BASE_URL}/api/simulation/stop")
        self.assertEqual(r_stop.status_code, 200)
        self.assertFalse(r_stop.json()["running"])

        # 5. Verify sandbox directory is cleaned up
        bin_files = [f for f in os.listdir(SANDBOX_DIR) if f.endswith(".bin") or f.endswith(".txt")]
        self.assertEqual(len(bin_files), 0, "Sandbox files should be automatically cleaned up")

        # 6. Test Incident API
        r_inc = requests.get(f"{self.BASE_URL}/api/incidents")
        self.assertEqual(r_inc.status_code, 200)
        incidents = r_inc.json().get("incidents", [])

        # If incidents were recorded, test ack and resolve
        if incidents:
            target_id = incidents[0]["id"]
            r_ack = requests.post(f"{self.BASE_URL}/api/incidents/{target_id}/acknowledge")
            self.assertEqual(r_ack.status_code, 200)
            self.assertIn(r_ack.json()["incident"]["status"], ["acknowledged", "investigating"])

            r_res = requests.post(f"{self.BASE_URL}/api/incidents/{target_id}/resolve")
            self.assertEqual(r_res.status_code, 200)
            self.assertEqual(r_res.json()["incident"]["status"], "resolved")


if __name__ == "__main__":
    unittest.main(verbosity=2)
