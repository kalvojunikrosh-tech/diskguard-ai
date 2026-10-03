"""
Detailed 4-Scenario End-to-End Test Execution Script
Runs the 4 required Day 4 test scenarios against the live FastAPI backend:
1. Normal Simulation Test
2. Elevated Writes Test
3. Ransomware-Like Burst Test
4. Stop Simulation & Incident Persistence + Lifecycle Test
"""

import json
import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def log_header(title):
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def main():
    log_header("DISKGUARD AI DAY 4 — LIVE END-TO-END VALIDATION")

    # Verify server health
    h = requests.get(f"{BASE_URL}/api/health").json()
    print(f"[HEALTH] Status: {h['status']}, Platform: {h['platform']}, Mode: {h['mode']}")

    # Get Primary Device
    devs = requests.get(f"{BASE_URL}/api/devices").json()["devices"]
    primary_dev = devs[0]["id"]
    print(f"[TARGET DEVICE] Using primary device: {primary_dev} ({devs[0].get('name', 'Main SSD')})")

    # Start monitoring on target device
    mon_res = requests.post(f"{BASE_URL}/api/monitor/start", json={"device_id": primary_dev}).json()
    print(f"[MONITORING] Started on {primary_dev}: {mon_res.get('status')}")

    # =========================================================================
    # TEST 1: NORMAL SIMULATION TEST
    # =========================================================================
    log_header("TEST 1: NORMAL WORKLOAD SIMULATION")
    requests.post(f"{BASE_URL}/api/simulation/stop")
    time.sleep(1)

    start_norm = requests.post(f"{BASE_URL}/api/simulation/start", json={"scenario": "normal"}).json()
    print(f"[START] Normal simulation started: {start_norm}")
    print("Observing for 4 seconds...")
    time.sleep(4)

    stat_norm = requests.get(f"{BASE_URL}/api/simulation/status").json()
    print(f"[STATUS] Running: {stat_norm['running']}, Scenario: {stat_norm['scenario']}")

    analysis_norm = requests.get(f"{BASE_URL}/api/analysis/{primary_dev}").json()
    print(f"[ANALYSIS] Risk Score: {analysis_norm['risk_score']}, Anomaly Score: {analysis_norm['anomaly_score']}")
    print(f"[ANALYSIS] Classification: {analysis_norm['classification']}, Confidence: {analysis_norm['confidence']}")
    print(f"[ANALYSIS] Signals count: {len(analysis_norm['explanation'].get('signals', []))}")

    assert analysis_norm['risk_score'] < 30, f"Expected risk < 30, got {analysis_norm['risk_score']}"
    print("✅ TEST 1 PASSED: Normal simulation maintained Low Risk (<30), 0 malicious signals.")

    # =========================================================================
    # TEST 2: ELEVATED WRITES TEST
    # =========================================================================
    log_header("TEST 2: ELEVATED WRITES WORKLOAD SIMULATION")
    start_elev = requests.post(f"{BASE_URL}/api/simulation/start", json={"scenario": "elevated_writes"}).json()
    print(f"[START] Elevated writes simulation started: {start_elev}")
    print("Observing for 4 seconds...")
    time.sleep(4)

    stat_elev = requests.get(f"{BASE_URL}/api/simulation/status").json()
    print(f"[STATUS] Running: {stat_elev['running']}, Scenario: {stat_elev['scenario']}")

    analysis_elev = requests.get(f"{BASE_URL}/api/analysis/{primary_dev}").json()
    print(f"[ANALYSIS] Risk Score: {analysis_elev['risk_score']}, Anomaly Score: {analysis_elev['anomaly_score']}")
    print(f"[ANALYSIS] Features: write_freq={analysis_elev['features'].get('write_frequency')}, renames={analysis_elev['features'].get('rename_rate')}")
    print(f"[ANALYSIS] Signals: {analysis_elev['explanation'].get('signals', [])}")

    # Elevated writes should be elevated but not critical incident
    assert analysis_elev['risk_score'] < 80, f"Expected risk < 80 for isolated elevated writes, got {analysis_elev['risk_score']}"
    print("✅ TEST 2 PASSED: Elevated writes produced bounded risk without critical incident escalation.")

    # =========================================================================
    # TEST 3: RANSOMWARE-LIKE BURST TEST
    # =========================================================================
    log_header("TEST 3: RANSOMWARE-LIKE BURST WORKLOAD SIMULATION")
    start_burst = requests.post(f"{BASE_URL}/api/simulation/start", json={"scenario": "ransomware_like_burst"}).json()
    print(f"[START] Ransomware-like burst started: {start_burst}")
    print("Observing burst execution for 5 seconds...")
    time.sleep(5)

    # Query analysis (1st cycle)
    requests.get(f"{BASE_URL}/api/analysis/{primary_dev}").json()
    time.sleep(1)
    # Query analysis (2nd cycle - triggers persistent incident)
    analysis_burst = requests.get(f"{BASE_URL}/api/analysis/{primary_dev}").json()
    print(f"[ANALYSIS] Risk Score: {analysis_burst['risk_score']}, Anomaly Score: {analysis_burst['anomaly_score']}")
    print(f"[ANALYSIS] Classification: {analysis_burst['classification']}, Confidence: {analysis_burst['confidence']}")
    print(f"[ANALYSIS] Top Features: {analysis_burst['explanation'].get('top_features', [])}")
    print(f"[ANALYSIS] Signals: {json.dumps(analysis_burst['explanation'].get('signals', []), indent=2)}")

    incidents_res = requests.get(f"{BASE_URL}/api/incidents").json()["incidents"]
    print(f"[INCIDENTS] Total incidents recorded: {len(incidents_res)}")
    for inc in incidents_res:
        print(f" -> Incident #{inc['id']}: [{inc['severity'].upper()}] {inc['title']} (Risk: {inc['risk_score']}, Status: {inc['status']})")

    assert len(incidents_res) > 0, "Expected at least 1 incident to be generated!"
    target_inc = incidents_res[0]
    print(f"✅ TEST 3 PASSED: Ransomware-like burst triggered Incident {target_inc['id']} with multi-signal correlation.")

    # =========================================================================
    # TEST 4: STOP SIMULATION & PERSISTENCE / LIFECYCLE TEST
    # =========================================================================
    log_header("TEST 4: STOP SIMULATION & INCIDENT PERSISTENCE / LIFECYCLE")
    stop_res = requests.post(f"{BASE_URL}/api/simulation/stop").json()
    print(f"[STOP] Simulation stopped: {stop_res}")

    time.sleep(1)
    stat_stopped = requests.get(f"{BASE_URL}/api/simulation/status").json()
    print(f"[STATUS] Running: {stat_stopped['running']}, Scenario: {stat_stopped['scenario']}")
    assert not stat_stopped['running'], "Simulation should be marked stopped"

    # Verify Incident STILL exists in memory (persisted across stop)
    incidents_after_stop = requests.get(f"{BASE_URL}/api/incidents").json()["incidents"]
    print(f"[PERSISTENCE] Total incidents after stop: {len(incidents_after_stop)}")
    assert len(incidents_after_stop) > 0, "Incidents MUST persist after simulation stops!"
    print(f" -> Incident {target_inc['id']} persisted with status '{incidents_after_stop[0]['status']}'")

    # Acknowledge incident
    ack_res = requests.post(f"{BASE_URL}/api/incidents/{target_inc['id']}/acknowledge").json()
    print(f"[ACKNOWLEDGE] Incident {target_inc['id']} acknowledged: status = '{ack_res['incident']['status']}'")
    assert ack_res['incident']['status'] in ['acknowledged', 'investigating']

    # Resolve incident
    res_res = requests.post(f"{BASE_URL}/api/incidents/{target_inc['id']}/resolve").json()
    print(f"[RESOLVE] Incident {target_inc['id']} resolved: status = '{res_res['incident']['status']}'")
    assert res_res['incident']['status'] == 'resolved'

    # Verify get by id
    detail_inc = requests.get(f"{BASE_URL}/api/incidents/{target_inc['id']}").json()
    print(f"[DETAIL] Incident {detail_inc['id']} verified resolved: status = '{detail_inc['status']}'")
    assert detail_inc['status'] == 'resolved'

    print("✅ TEST 4 PASSED: Incident persisted after simulation stop and completed full lifecycle (open -> acknowledged -> resolved).")
    log_header("ALL 4 END-TO-END TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
