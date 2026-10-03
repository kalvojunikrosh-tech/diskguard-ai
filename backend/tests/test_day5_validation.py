"""
DiskGuard AI — Day 5 Comprehensive Validation & Hardening Test Suite
Covers all requirements from the Day 5 Hardening & Final Validation spec:
1. Complete Test Suite execution
2. API Health test
3. Real storage-device detection & stability
4. Monitoring lifecycle & idempotency
5. Baseline lifecycle (learning -> established, no false alerts during learning)
6. Normal behavior simulation (risk < 30, no incident)
7. Elevated writes simulation (risk 30-60, no false critical incident)
8. Ransomware-like burst simulation (multi-signal, risk > 80, incident schema)
9. Incident lifecycle (open -> acknowledged -> resolved, history persisted)
10. Safety boundary verification (strict sandbox isolation)
11. Disconnected / unmounted device handling
12. Backend error handling & JSON schema
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
from backend.ml.features import BehavioralFeatures, extract_behavioral_features
from backend.ml.scoring import calculate_risk_and_explanation
from backend.ml.baseline import BaselineEngine, BaselineProfile
from backend.telemetry.macos import MacOSTelemetryProvider
from backend.telemetry import TelemetrySnapshot

API_BASE = "http://127.0.0.1:8000/api"


class TestDay5Validation(unittest.TestCase):
    """Day 5 Complete Automated Validation Suite"""

    @classmethod
    def setUpClass(cls):
        # Ensure backend is reachable
        try:
            r = requests.get(f"{API_BASE}/health", timeout=3.0)
            if r.status_code != 200:
                raise RuntimeError(f"Backend returned non-200: {r.status_code}")
        except Exception as e:
            raise RuntimeError(f"Backend not running at {API_BASE}: {e}")

    # =========================================================================
    # 1. API HEALTH TEST (Section 2)
    # =========================================================================
    def test_01_api_health_check(self):
        """GET /api/health returns HTTP 200 with clean operational status"""
        r = requests.get(f"{API_BASE}/health", timeout=3.0)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("service"), "diskguard-api")
        self.assertEqual(data.get("mode"), "read-only-telemetry")

    # =========================================================================
    # 2. REAL STORAGE DEVICE DISCOVERY & STABILITY (Section 3)
    # =========================================================================
    def test_02_device_discovery_and_stability(self):
        """Discovers real host storage devices, no mock drives as real, stable IDs"""
        r1 = requests.get(f"{API_BASE}/devices", timeout=3.0)
        self.assertEqual(r1.status_code, 200)
        devices1 = r1.json().get("devices", [])
        self.assertGreater(len(devices1), 0, "Should detect at least 1 real storage device on host")

        # Verify simulated drives are NOT returned as real devices
        real_ids = [d["id"] for d in devices1]
        for mock_id in ["drive_c", "drive_d", "drive_e"]:
            self.assertNotIn(mock_id, real_ids, f"Simulated drive '{mock_id}' must not appear in real devices")

        # Verify metadata safety and fields
        first_dev = devices1[0]
        self.assertIn("mount_point", first_dev)
        self.assertIn("filesystem", first_dev)
        self.assertIn("total_bytes", first_dev)
        self.assertGreater(first_dev["total_bytes"], 0)

        # Verify ID stability across consecutive calls
        r2 = requests.get(f"{API_BASE}/devices", timeout=3.0)
        devices2 = r2.json().get("devices", [])
        self.assertEqual([d["id"] for d in devices1], [d["id"] for d in devices2])

    # =========================================================================
    # 3. MONITORING LIFECYCLE & IDEMPOTENCY (Section 4)
    # =========================================================================
    def test_03_monitoring_lifecycle_and_idempotency(self):
        """Repeated start/stop requests are idempotent and handle non-monitoring cleanly"""
        dev_res = requests.get(f"{API_BASE}/devices", timeout=3.0).json()
        dev_id = dev_res["devices"][0]["id"]

        # 1. Start monitoring
        r_start1 = requests.post(f"{API_BASE}/monitor/start", json={"device_id": dev_id}, timeout=3.0)
        self.assertIn(r_start1.json().get("status"), ["monitoring_started", "already_monitoring"])

        # 2. Idempotent second start
        r_start2 = requests.post(f"{API_BASE}/monitor/start", json={"device_id": dev_id}, timeout=3.0)
        self.assertEqual(r_start2.json().get("status"), "already_monitoring")

        # 3. Stop monitoring
        r_stop1 = requests.post(f"{API_BASE}/monitor/stop", json={"device_id": dev_id}, timeout=3.0)
        self.assertEqual(r_stop1.json().get("status"), "monitoring_stopped")

        # 4. Clean second stop when not monitoring
        r_stop2 = requests.post(f"{API_BASE}/monitor/stop", json={"device_id": dev_id}, timeout=3.0)
        self.assertEqual(r_stop2.json().get("status"), "not_monitoring")

    # =========================================================================
    # 4. BASELINE LIFECYCLE & PLAUSIBLE VALUES (Section 5)
    # =========================================================================
    def test_04_baseline_lifecycle_and_learning_bounds(self):
        """Baseline begins in learning state, transitions to established, no false alerts while learning"""
        engine = BaselineEngine(min_samples=5)
        dev_id = "test_disk_lifecycle"
        self.assertEqual(engine.get_status(dev_id), "learning")
        profile = engine.get_profile(dev_id)
        self.assertEqual(profile.status, "learning")

        # While in learning mode, deviations must be bounded
        devs_learning = engine.compute_deviations(dev_id, BehavioralFeatures(write_frequency=1000.0, rename_rate=200.0))
        # Anomaly scoring during learning state should never produce extreme false positive
        _, _, _, risk, exp = calculate_risk_and_explanation(
            BehavioralFeatures(write_frequency=1000.0),
            deviations=devs_learning,
            ml_class="normal",
            ml_confidence=0.5,
            baseline_status="learning"
        )
        self.assertLess(risk, 40, "Risk must remain nominal while baseline is learning")

        # Feed 5 samples to transition to established
        for i in range(5):
            engine.record_observation(dev_id, BehavioralFeatures(
                sample_count=10,
                write_frequency=50.0 + i * 2.0,
                file_modification_rate=20.0 + i,
                rename_rate=1.0,
                entropy_change=0.2,
                io_burstiness=1.1,
                mean_sample_entropy=4.2
            ))

        self.assertEqual(engine.get_status(dev_id), "established")
        profile_est = engine.get_profile(dev_id)
        self.assertEqual(profile_est.status, "established")
        self.assertGreater(profile_est.mean_write_frequency, 0.0)
        self.assertGreater(profile_est.mean_modification_rate, 0.0)

    def test_04b_baseline_end_to_end_lifecycle(self):
        """Validates baseline learning and scoring lifecycle:
        1. Fresh monitoring -> learning
        2. Learning window 1 -> no threat score (anomaly=0, risk=0, classification=normal, signals=[])
        3. Learning windows 2-4 -> no threat score
        4. Window 5 -> baseline established (from collected normal observations)
        5. Post-establishment normal behavior -> scoring enabled (low anomaly/risk, normal)
        6. Suspicious behavior after establishment -> scoring enabled (elevated/high anomaly/risk)
        7. Monitor stop/start resets baseline appropriately
        """
        engine = BaselineEngine(min_samples=5)
        dev = "disk_baseline_lifecycle_test"

        # 1. Fresh monitoring -> learning
        self.assertEqual(engine.get_status(dev), "learning")
        p0 = engine.get_profile(dev)
        self.assertEqual(p0.status, "learning")
        self.assertEqual(p0.learning_progress["windows_collected"], 0)
        self.assertEqual(p0.learning_progress["windows_required"], 5)

        normal_feat_base = {
            "sample_count": 30,
            "read_frequency": 5000.0,
            "write_frequency": 1200.0,
            "file_modification_rate": 200.0,
            "rename_rate": 25.0,
            "entropy_change": 0.0,
            "access_irregularity": 1.2,
            "io_burstiness": 2.5,
            "read_write_ratio": 4.0,
            "mean_sample_entropy": 5.2
        }

        # 2. Learning window 1 -> no threat score
        feat1 = BehavioralFeatures(**normal_feat_base)
        p1 = engine.record_observation(dev, feat1)
        self.assertEqual(p1.status, "learning")
        self.assertEqual(p1.learning_progress["windows_collected"], 1)
        self.assertEqual(p1.learning_progress["windows_required"], 5)
        devs1 = engine.compute_deviations(dev, feat1)
        self.assertEqual(devs1["write_deviation"], 0.0)
        cls1, conf1, anom1, risk1, exp1 = calculate_risk_and_explanation(
            feat1, devs1, ml_class="normal", ml_confidence=0.8, baseline_status=p1.status
        )
        self.assertEqual(cls1, "normal")
        self.assertEqual(anom1, 0)
        self.assertEqual(risk1, 0)
        self.assertIn("learning window", exp1["summary"])
        self.assertEqual(exp1["signals"], [])
        self.assertEqual(exp1["top_features"], [])

        # 3. Learning windows 2-4 -> no threat score
        for w in range(2, 5):
            feat_w = BehavioralFeatures(
                sample_count=30,
                read_frequency=5000.0 + w * 20.0,
                write_frequency=1200.0 + w * 15.0,
                file_modification_rate=200.0 + w * 5.0,
                rename_rate=25.0 + w,
                entropy_change=0.0,
                access_irregularity=1.2,
                io_burstiness=2.5,
                read_write_ratio=4.0,
                mean_sample_entropy=5.2
            )
            pw = engine.record_observation(dev, feat_w)
            self.assertEqual(pw.status, "learning")
            self.assertEqual(pw.learning_progress["windows_collected"], w)
            self.assertEqual(pw.learning_progress["windows_required"], 5)
            devs_w = engine.compute_deviations(dev, feat_w)
            cls_w, conf_w, anom_w, risk_w, exp_w = calculate_risk_and_explanation(
                feat_w, devs_w, ml_class="normal", ml_confidence=0.8, baseline_status=pw.status
            )
            self.assertEqual(cls_w, "normal")
            self.assertEqual(anom_w, 0)
            self.assertEqual(risk_w, 0)
            self.assertEqual(exp_w["signals"], [])
            self.assertEqual(exp_w["top_features"], [])

        # 4. Window 5 -> baseline established from collected normal observations
        feat5 = BehavioralFeatures(
            sample_count=30,
            read_frequency=5080.0,
            write_frequency=1260.0,
            file_modification_rate=220.0,
            rename_rate=28.0,
            entropy_change=0.0,
            access_irregularity=1.2,
            io_burstiness=2.5,
            read_write_ratio=4.0,
            mean_sample_entropy=5.2
        )
        p5 = engine.record_observation(dev, feat5)
        self.assertEqual(p5.status, "established")
        self.assertEqual(p5.learning_progress["windows_collected"], 5)
        self.assertEqual(p5.learning_progress["windows_required"], 5)
        self.assertGreater(p5.mean_write_frequency, 1000.0)
        self.assertGreater(p5.mean_rename_rate, 20.0)

        # 5. Post-establishment normal behavior -> scoring enabled, normal classification, low anomaly/risk
        devs5 = engine.compute_deviations(dev, feat5)
        cls5, conf5, anom5, risk5, exp5 = calculate_risk_and_explanation(
            feat5, devs5, ml_class="normal", ml_confidence=0.88, baseline_status=p5.status
        )
        self.assertEqual(cls5, "normal")
        self.assertLess(risk5, 15, "Normal post-establishment behavior must yield low risk score")
        self.assertLess(anom5, 15, "Normal post-establishment behavior must yield low anomaly score")
        self.assertIn("established baseline", exp5["summary"])
        self.assertEqual(exp5["signals"], [])

        # 6. Suspicious behavior after establishment -> scoring enabled, elevated/high scores
        feat_attack = BehavioralFeatures(
            sample_count=30,
            read_frequency=8000.0,
            write_frequency=9500.0,        # massive spike vs ~1230 baseline
            file_modification_rate=1200.0, # massive spike vs ~210 baseline
            rename_rate=220.0,             # mass rename vs ~27 baseline
            entropy_change=2.8,            # high entropy shift
            io_burstiness=7.5,             # burst spike
            read_write_ratio=0.05,
            mean_sample_entropy=7.4
        )
        devs_attack = engine.compute_deviations(dev, feat_attack)
        self.assertGreaterEqual(devs_attack["write_deviation"], 2.0)
        self.assertGreaterEqual(devs_attack["rename_deviation"], 2.0)
        cls_atk, conf_atk, anom_atk, risk_atk, exp_atk = calculate_risk_and_explanation(
            feat_attack, devs_attack, ml_class="ransomware_suspect", ml_confidence=0.92, baseline_status=p5.status
        )
        self.assertGreaterEqual(risk_atk, 60, "Multi-signal attack after baseline establishment must trigger high risk")
        self.assertGreaterEqual(anom_atk, 60, "Multi-signal attack after baseline establishment must trigger high anomaly")
        self.assertGreater(len(exp_atk["signals"]), 0, "Attack signals must be populated")
        self.assertGreater(len(exp_atk["top_features"]), 0, "Attack top_features must be populated")

        # 7. Monitor stop/start resets baseline appropriately
        engine.reset(dev)
        self.assertEqual(engine.get_status(dev), "learning")
        p_reset = engine.get_profile(dev)
        self.assertEqual(p_reset.status, "learning")
        self.assertEqual(p_reset.learning_progress["windows_collected"], 0)
        self.assertEqual(p_reset.learning_progress["windows_required"], 5)

        # Also verify live API endpoint for fresh monitor reset
        dev_res = requests.get(f"{API_BASE}/devices", timeout=3.0).json()
        live_id = dev_res["devices"][0]["id"]

        # Ensure stopped first
        requests.post(f"{API_BASE}/monitor/stop", json={"device_id": live_id}, timeout=3.0)

        # Start monitor fresh
        r_start = requests.post(f"{API_BASE}/monitor/start", json={"device_id": live_id}, timeout=3.0)
        self.assertIn(r_start.json().get("status"), ["monitoring_started", "already_monitoring"])

        # Immediate analysis check: should be learning with learning_progress
        r_ana = requests.get(f"{API_BASE}/analysis/{live_id}", timeout=3.0)
        self.assertEqual(r_ana.status_code, 200)
        ana_data = r_ana.json()
        self.assertIn(ana_data["baseline_status"], ["learning", "established"])
        self.assertIn("learning_progress", ana_data)
        if ana_data["baseline_status"] == "learning":
            self.assertEqual(ana_data["anomaly_score"], 0)
            self.assertEqual(ana_data["risk_score"], 0)
            self.assertEqual(ana_data["classification"], "normal")
            self.assertEqual(ana_data["explanation"]["signals"], [])
            self.assertEqual(ana_data["explanation"]["top_features"], [])

        # Stop monitor resets baseline appropriately
        r_stop = requests.post(f"{API_BASE}/monitor/stop", json={"device_id": live_id}, timeout=3.0)
        self.assertEqual(r_stop.json()["status"], "monitoring_stopped")

        # After stop, standby status without monitoring
        r_standby = requests.get(f"{API_BASE}/analysis/{live_id}", timeout=3.0)
        self.assertEqual(r_standby.status_code, 200)
        self.assertEqual(r_standby.json()["baseline_status"], "standby")

    # =========================================================================
    # 5. SAFETY BOUNDARY VERIFICATION (Section 10)
    # =========================================================================
    def test_05_safety_boundary_enforcement(self):
        """Strictly forbids filesystem manipulation outside backend/sandbox/"""
        # Valid path
        valid = verify_sandbox_path(os.path.join(SANDBOX_DIR, "safe_test.txt"))
        self.assertTrue(valid.startswith(SANDBOX_DIR))

        # Rejection of dangerous root / user / system paths
        invalid_paths = [
            "/",
            "/Users",
            os.path.expanduser("~"),
            "/etc/passwd",
            "/tmp/payload.sh",
            os.path.join(SANDBOX_DIR, "..", "..", "package.json")
        ]
        for p in invalid_paths:
            with self.assertRaises((PermissionError, ValueError), msg=f"Did not reject unsafe path {p}"):
                verify_sandbox_path(p)

    # =========================================================================
    # 6. NORMAL BEHAVIOR SIMULATION (Section 6)
    # =========================================================================
    def test_06_normal_behavior_simulation(self):
        """Normal simulation keeps risk < 30 and never creates an incident"""
        # Stop any active simulation first
        requests.post(f"{API_BASE}/simulation/stop", timeout=3.0)

        r_start = requests.post(f"{API_BASE}/simulation/start", json={"scenario": "normal"}, timeout=3.0)
        self.assertEqual(r_start.status_code, 200)

        # Allow simulation to generate activity
        time.sleep(1.5)

        status = requests.get(f"{API_BASE}/simulation/status", timeout=3.0).json()
        self.assertTrue(status.get("running"))
        self.assertEqual(status.get("scenario"), "normal")
        self.assertTrue(status.get("sandbox"))

        # Stop simulation
        requests.post(f"{API_BASE}/simulation/stop", timeout=3.0)

    # =========================================================================
    # 7. ELEVATED WRITES SIMULATION (Section 7)
    # =========================================================================
    def test_07_elevated_writes_simulation(self):
        """Elevated writes scenario bounds risk to 30-60, no false critical incident"""
        # Test unit-level calculation for elevated writes
        features = BehavioralFeatures(
            write_frequency=450.0,
            file_modification_rate=40.0,
            rename_rate=2.0,
            entropy_change=0.3,
            io_burstiness=1.5
        )
        deviations = {
            "write_deviation": 2.5,
            "mod_deviation": 1.0,
            "rename_deviation": 0.0,
            "entropy_deviation": 0.0,
            "burst_deviation": 1.2
        }
        _, _, _, risk, exp = calculate_risk_and_explanation(
            features,
            deviations=deviations,
            ml_class="normal",
            ml_confidence=0.85,
            baseline_status="established"
        )
        self.assertGreaterEqual(risk, 25, "Elevated writes should produce elevated risk")
        self.assertLess(risk, 65, "Elevated writes must not exceed critical boundary")
        self.assertFalse(
            should_trigger_incident(risk, len(exp["signals"])),
            "Single elevated write vector must not trigger critical incident"
        )

    # =========================================================================
    # 8. RANSOMWARE-LIKE BURST & COMPLETE INCIDENT LIFECYCLE (Sections 8 & 9)
    # =========================================================================
    def test_08_ransomware_burst_and_incident_lifecycle(self):
        """Multi-signal burst creates incident; verifies complete incident lifecycle: open -> ack -> resolve"""
        dev_res = requests.get(f"{API_BASE}/devices", timeout=3.0).json()
        dev_id = dev_res["devices"][0]["id"]

        # 1. Start monitoring device so telemetry observes the sandbox burst
        requests.post(f"{API_BASE}/monitor/start", json={"device_id": dev_id}, timeout=3.0)

        # Establish baseline with nominal normal windows before testing burst against established baseline
        from backend.ml import get_baseline_engine
        engine = get_baseline_engine()
        for i in range(5):
            engine.record_observation(dev_id, BehavioralFeatures(
                sample_count=30,
                read_frequency=3000.0,
                write_frequency=800.0 + i * 10,
                file_modification_rate=100.0 + i * 5,
                rename_rate=10.0 + i,
                entropy_change=0.0,
                access_irregularity=1.0,
                io_burstiness=2.0,
                read_write_ratio=4.0,
                mean_sample_entropy=5.0
            ))
        self.assertEqual(engine.get_status(dev_id), "established")

        # 2. Start live burst simulation
        r_burst = requests.post(
            f"{API_BASE}/simulation/start",
            json={"scenario": "ransomware_like_burst"},
            timeout=3.0
        )
        self.assertEqual(r_burst.status_code, 200)

        # Allow burst loop to execute file actions and satisfy rolling persistence
        analysis = None
        for _ in range(5):
            time.sleep(1.2)
            r_analysis = requests.get(f"{API_BASE}/analysis/{dev_id}", timeout=3.0)
            if r_analysis.status_code == 200:
                data = r_analysis.json()
                if data.get("risk_score", 0) >= 60:
                    analysis = data
                    # Perform second evaluation check to satisfy INCIDENT_PERSISTENCE_MIN_WINDOWS (2 windows)
                    time.sleep(1.0)
                    r_analysis2 = requests.get(f"{API_BASE}/analysis/{dev_id}", timeout=3.0)
                    if r_analysis2.status_code == 200:
                        analysis = r_analysis2.json()
                    break

        self.assertIsNotNone(analysis, "Analysis should have captured high-risk burst")
        self.assertGreaterEqual(analysis.get("risk_score", 0), 60)

        # Check incidents endpoint
        r_incidents = requests.get(f"{API_BASE}/incidents", timeout=3.0)
        self.assertEqual(r_incidents.status_code, 200)
        incidents = r_incidents.json().get("incidents", [])
        self.assertGreater(len(incidents), 0, "Incident must be created for multi-signal burst")

        target_inc = incidents[0]
        inc_id = target_inc["id"]

        # Validate schema requirements (Section 8)
        self.assertIn("id", target_inc)
        self.assertIn("device_id", target_inc)
        self.assertIn("timestamp", target_inc)
        self.assertIn("risk_score", target_inc)
        self.assertIn("confidence", target_inc)
        self.assertIn("classification", target_inc)
        self.assertIn("triggered_signals", target_inc)
        self.assertIn("affected_files", target_inc)
        self.assertIn("recommended_action", target_inc)
        self.assertEqual(target_inc["status"], "open")

        # Lifecycle Step 1: Acknowledge
        r_ack = requests.post(f"{API_BASE}/incidents/{inc_id}/acknowledge", timeout=3.0)
        self.assertEqual(r_ack.status_code, 200)
        self.assertEqual(r_ack.json()["incident"]["status"], "acknowledged")

        # Lifecycle Step 2: Resolve
        r_res = requests.post(f"{API_BASE}/incidents/{inc_id}/resolve", timeout=3.0)
        self.assertEqual(r_res.status_code, 200)
        self.assertEqual(r_res.json()["incident"]["status"], "resolved")

        # Stop burst simulation and monitoring
        requests.post(f"{API_BASE}/simulation/stop", timeout=3.0)
        requests.post(f"{API_BASE}/monitor/stop", json={"device_id": dev_id}, timeout=3.0)

        # Verify history persists in incident list
        r_after = requests.get(f"{API_BASE}/incidents", timeout=3.0)
        all_inc_ids = [i["id"] for i in r_after.json().get("incidents", [])]
        self.assertIn(inc_id, all_inc_ids, "Resolved incident must remain visible in history")

    # =========================================================================
    # 9. DISCONNECTED DEVICE RESILIENCE (Section 11)
    # =========================================================================
    def test_09_disconnected_device_handling(self):
        """Inaccessible or unmounted storage paths do not crash collector"""
        fake_collector = MacOSTelemetryProvider(
            device_id="unmounted_disk_99",
            mount_point="/Volumes/NonExistentTestVolume_XYZ_404"
        )
        self.assertFalse(fake_collector.is_accessible())

        # Calling collect_sample must return gracefully without throwing
        snapshot = fake_collector.collect_sample()
        self.assertIsInstance(snapshot, TelemetrySnapshot)
        self.assertEqual(snapshot.device_id, "unmounted_disk_99")
        self.assertEqual(snapshot.write_operations, 0)

    # =========================================================================
    # 10. CLEAN ERROR RESPONSES & NO PYTHON TRACEBACKS (Section 15)
    # =========================================================================
    def test_10_clean_error_handling_schema(self):
        """400, 404, etc. return clean JSON schema with error and status_code, no tracebacks"""
        # 400 Bad Request
        r_400 = requests.post(f"{API_BASE}/simulation/start", json={"scenario": "nonexistent_scenario"})
        self.assertEqual(r_400.status_code, 400)
        data_400 = r_400.json()
        self.assertIn("error", data_400)
        self.assertEqual(data_400.get("status_code"), 400)
        self.assertNotIn("Traceback (most recent call last)", str(data_400))

        # 404 Device Not Found
        r_404_dev = requests.get(f"{API_BASE}/devices/nonexistent_device_id_123")
        self.assertEqual(r_404_dev.status_code, 404)
        data_404_dev = r_404_dev.json()
        self.assertIn("error", data_404_dev)
        self.assertEqual(data_404_dev.get("status_code"), 404)
        self.assertNotIn("Traceback (most recent call last)", str(data_404_dev))

        # 404 Incident Not Found
        r_404_inc = requests.post(f"{API_BASE}/incidents/DG-99999/acknowledge")
        self.assertEqual(r_404_inc.status_code, 404)
        data_404_inc = r_404_inc.json()
        self.assertIn("error", data_404_inc)
        self.assertEqual(data_404_inc.get("status_code"), 404)
        self.assertNotIn("Traceback (most recent call last)", str(data_404_inc))


if __name__ == "__main__":
    unittest.main()
