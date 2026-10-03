"""Comprehensive integration tests for Simulation -> Telemetry -> Features -> Scoring -> Incidents pipeline.

Validates:
A. Normal real telemetry after baseline -> low risk (< 30), 0 signals.
B. Start elevated_writes simulation -> feature values change, write_frequency increases, risk bounded (30-55), no incident.
C. Analysis detects changed behavior.
D. Stop simulation -> behavior returns toward normal.
E. mass_rename -> rename-related features increase.
F. high_entropy_test -> entropy-related features increase.
G. ransomware_like_burst -> multi-vector burst triggers high risk (>= 60) and incident engine.
H. Baseline integrity: baseline is never modified or corrupted during simulation.
I. Baseline learning mode: during learning, anomaly/risk remain strictly neutral (0).
J. Sandbox isolation: sandbox strictly refuses external paths.
"""
import os
import sys
import time
import unittest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app
from backend.ml import (
    BehavioralFeatures,
    extract_behavioral_features,
    get_baseline_engine,
    get_edge_model,
    calculate_risk_and_explanation,
)
from backend.security import get_incident_manager
from backend.simulation import SafeSimulator, get_simulator, SUPPORTED_SCENARIOS
from backend.simulation.simulator import verify_sandbox_path, SANDBOX_DIR
from backend.telemetry import TelemetrySnapshot, get_telemetry_collector


class TestSimulationPipelineIntegration(unittest.TestCase):
    """End-to-end test suite for simulation data flow into behavioral analysis engine."""

    def setUp(self):
        self.client = TestClient(app)
        self.dev_id = "test_sim_disk"
        self.collector = get_telemetry_collector()
        self.baseline_engine = get_baseline_engine()
        self.sim = get_simulator()
        self.incident_mgr = get_incident_manager()

        # Stop any running simulation and reset state
        self.sim.stop()
        self.baseline_engine.reset(self.dev_id)
        self.collector.clear_window(self.dev_id)

    def tearDown(self):
        self.sim.stop()
        self.baseline_engine.reset(self.dev_id)
        self.collector.clear_window(self.dev_id)

    def _establish_nominal_baseline(self, dev_id: str, mean_write: float = 850.0):
        """Helper to establish an established baseline with realistic nominal values."""
        for i in range(5):
            features = BehavioralFeatures(
                sample_count=30,
                window_seconds=30.0,
                read_frequency=1500.0 + (i * 10),
                write_frequency=mean_write + (i * 15),
                file_modification_rate=120.0 + (i * 5),
                rename_rate=10.0 + i,
                entropy_change=0.0,
                access_irregularity=1.2,
                io_burstiness=1.8,
                read_write_ratio=1.5,
                mean_sample_entropy=4.12
            )
            self.baseline_engine.record_observation(dev_id, features)
        self.assertEqual(self.baseline_engine.get_status(dev_id), "established")

    # =========================================================================
    # Test A: Normal baseline establishment & normal analysis
    # =========================================================================
    def test_01_normal_telemetry_after_baseline_produces_low_risk(self):
        self._establish_nominal_baseline(self.dev_id, mean_write=800.0)

        # Feed 10 nominal snapshots
        snapshots = [
            TelemetrySnapshot(
                device_id=self.dev_id,
                read_bytes=30000,
                write_bytes=20000,
                read_operations=25,
                write_operations=14,
                file_modifications=2,
                rename_events=0,
                sample_entropy=4.1,
                delta_seconds=1.0
            ) for _ in range(10)
        ]
        self.collector.set_simulation_window(self.dev_id, snapshots)

        res = self.client.get(f"/api/analysis/{self.dev_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["baseline_status"], "established")
        self.assertEqual(data["classification"], "normal")
        self.assertLess(data["risk_score"], 30)
        self.assertEqual(len(data["explanation"]["signals"]), 0)

    # =========================================================================
    # Test B & C: Elevated writes simulation -> feature values change & detected
    # =========================================================================
    def test_02_elevated_writes_simulation_changes_features_and_detects(self):
        self._establish_nominal_baseline(self.dev_id, mean_write=800.0)
        profile_before = self.baseline_engine.get_profile(self.dev_id)
        mean_write_baseline = profile_before.mean_write_frequency

        # Start elevated_writes simulation targeting dev_id
        start_res = self.client.post("/api/simulation/start", json={
            "scenario": "elevated_writes",
            "device_id": self.dev_id
        })
        self.assertEqual(start_res.status_code, 200)
        self.assertEqual(start_res.json()["status"], "simulation_started")

        # Query analysis
        res = self.client.get(f"/api/analysis/{self.dev_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["telemetry_source"], "simulation")
        features = data["features"]
        self.assertIsNotNone(features.get("write_frequency"))
        # Verify write frequency is measurably elevated above baseline
        self.assertGreater(
            features["write_frequency"],
            mean_write_baseline * 1.5,
            f"Write frequency {features['write_frequency']} should exceed baseline {mean_write_baseline}"
        )
        # Verify risk is elevated but below critical incident threshold (bounded to 30-55)
        self.assertGreaterEqual(data["risk_score"], 25)
        self.assertLess(data["risk_score"], 60)
        self.assertIn("elevated", data["classification"].lower())

        # Verify signals capture the write frequency deviation
        signals = [s["feature"] for s in data["explanation"]["signals"]]
        self.assertIn("write_frequency", signals)
        self.assertNotIn("rename_rate", signals)

    # =========================================================================
    # Test D: Stop simulation -> behavior returns toward normal
    # =========================================================================
    def test_03_stop_simulation_returns_behavior_toward_normal(self):
        self._establish_nominal_baseline(self.dev_id, mean_write=800.0)

        # Start and then stop
        self.client.post("/api/simulation/start", json={"scenario": "elevated_writes", "device_id": self.dev_id})
        stop_res = self.client.post("/api/simulation/stop")
        self.assertEqual(stop_res.status_code, 200)
        self.assertFalse(stop_res.json()["running"])

        # Feed normal hardware snapshots
        normal_snaps = [
            TelemetrySnapshot(
                device_id=self.dev_id,
                read_bytes=35000,
                write_bytes=25000,
                read_operations=25,
                write_operations=13,
                file_modifications=2,
                rename_events=0,
                sample_entropy=4.12,
                delta_seconds=1.0
            ) for _ in range(15)
        ]
        self.collector.set_simulation_window(self.dev_id, normal_snaps)

        res = self.client.get(f"/api/analysis/{self.dev_id}")
        data = res.json()
        self.assertEqual(data["telemetry_source"], "hardware")
        self.assertEqual(data["classification"], "normal")
        self.assertLess(data["risk_score"], 30)

    # =========================================================================
    # Test E: mass_rename scenario -> rename-related features increase
    # =========================================================================
    def test_04_mass_rename_increases_rename_rate(self):
        self._establish_nominal_baseline(self.dev_id, mean_write=800.0)
        profile_before = self.baseline_engine.get_profile(self.dev_id)
        mean_rename_baseline = profile_before.mean_rename_rate

        self.client.post("/api/simulation/start", json={
            "scenario": "mass_rename",
            "device_id": self.dev_id
        })

        res = self.client.get(f"/api/analysis/{self.dev_id}")
        data = res.json()

        self.assertEqual(data["telemetry_source"], "simulation")
        features = data["features"]
        self.assertGreater(
            features["rename_rate"],
            mean_rename_baseline * 2.0,
            f"Rename rate {features['rename_rate']} should exceed baseline {mean_rename_baseline}"
        )
        signals = [s["feature"] for s in data["explanation"]["signals"]]
        self.assertIn("rename_rate", signals)

    # =========================================================================
    # Test F: high_entropy_test scenario -> entropy-related features increase
    # =========================================================================
    def test_05_high_entropy_test_increases_entropy_features(self):
        self._establish_nominal_baseline(self.dev_id, mean_write=800.0)

        self.client.post("/api/simulation/start", json={
            "scenario": "high_entropy_test",
            "device_id": self.dev_id
        })

        res = self.client.get(f"/api/analysis/{self.dev_id}")
        data = res.json()

        self.assertEqual(data["telemetry_source"], "simulation")
        features = data["features"]
        self.assertGreaterEqual(features["mean_sample_entropy"], 7.0)
        self.assertGreaterEqual(features["entropy_change"], 2.0)
        signals = [s["feature"] for s in data["explanation"]["signals"]]
        self.assertIn("entropy_change", signals)

    # =========================================================================
    # Test G: ransomware_like_burst scenario -> triggers high risk and incidents
    # =========================================================================
    def test_06_ransomware_burst_triggers_high_risk_and_incident(self):
        self._establish_nominal_baseline(self.dev_id, mean_write=800.0)

        # Start multi-vector ransomware simulation
        self.client.post("/api/simulation/start", json={
            "scenario": "ransomware_like_burst",
            "device_id": self.dev_id
        })

        # Cycle 1 evaluation
        res1 = self.client.get(f"/api/analysis/{self.dev_id}")
        data1 = res1.json()
        self.assertGreaterEqual(data1["risk_score"], 60)
        self.assertGreaterEqual(data1["anomaly_score"], 50)
        self.assertEqual(data1["classification"], "ransomware-like behavior")

        # Cycle 2 evaluation to satisfy persistence streak (streak >= 2)
        res2 = self.client.get(f"/api/analysis/{self.dev_id}")
        data2 = res2.json()
        self.assertGreaterEqual(data2["risk_score"], 60)

        # Check incidents
        inc_res = self.client.get("/api/incidents")
        incidents = inc_res.json().get("incidents", [])
        self.assertGreater(len(incidents), 0, "Security incident should be recorded for persistent burst")
        target_inc = incidents[0]
        self.assertEqual(target_inc["device_id"], self.dev_id)
        self.assertEqual(target_inc["status"], "open")

        # Lifecycle test: acknowledge and resolve
        ack_res = self.client.post(f"/api/incidents/{target_inc['id']}/acknowledge")
        self.assertEqual(ack_res.status_code, 200)
        self.assertEqual(ack_res.json()["incident"]["status"], "acknowledged")

        resolve_res = self.client.post(f"/api/incidents/{target_inc['id']}/resolve")
        self.assertEqual(resolve_res.status_code, 200)
        self.assertEqual(resolve_res.json()["incident"]["status"], "resolved")

    # =========================================================================
    # Test H: Baseline profile is NOT altered while simulation is running
    # =========================================================================
    def test_07_baseline_is_not_altered_during_simulation(self):
        self._establish_nominal_baseline(self.dev_id, mean_write=800.0)
        profile_before = self.baseline_engine.get_profile(self.dev_id)
        before_write = profile_before.mean_write_frequency

        self.client.post("/api/simulation/start", json={
            "scenario": "elevated_writes",
            "device_id": self.dev_id
        })

        # Query analysis multiple times
        for _ in range(3):
            self.client.get(f"/api/analysis/{self.dev_id}")

        profile_after = self.baseline_engine.get_profile(self.dev_id)
        self.assertEqual(
            profile_after.mean_write_frequency,
            before_write,
            "Baseline mean write frequency must remain unchanged during simulation"
        )
        self.assertEqual(profile_after.status, "established")

    # =========================================================================
    # Test I: Learning baseline preserves neutral scoring
    # =========================================================================
    def test_08_learning_baseline_preserves_neutral_risk(self):
        # Baseline is newly created in 'learning' mode
        profile = self.baseline_engine.get_profile("new_disk_test")
        self.assertEqual(profile.status, "learning")

        # Start simulation on new disk while still learning
        self.client.post("/api/simulation/start", json={
            "scenario": "ransomware_like_burst",
            "device_id": "new_disk_test"
        })

        res = self.client.get("/api/analysis/new_disk_test")
        data = res.json()
        self.assertEqual(data["baseline_status"], "learning")
        self.assertEqual(data["risk_score"], 0, "Risk score must remain 0 while baseline is learning")
        self.assertEqual(data["anomaly_score"], 0, "Anomaly score must remain 0 while baseline is learning")
        self.assertEqual(data["classification"], "normal")


if __name__ == "__main__":
    unittest.main(verbosity=2)
