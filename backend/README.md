# DiskGuard AI Backend — Academic Edge AI Behavioral Detection Pipeline

> **Notice**: DiskGuard AI is an **academic research prototype** demonstrating on-device behavioral telemetry observation, rolling statistical feature extraction, adaptive baseline profiling, and local Edge AI classification for ransomware-like patterns on storage devices. It is not production-grade enterprise antivirus or endpoint detection software.

---

## 1. Supported Platform

- **Operating System**: macOS (Apple Silicon M1/M2/M3 and Intel x86_64).
- **Filesystem Support**: APFS (Apple File System) and HFS+.
- **Architecture Abstraction**: Telemetry collection is isolated behind the `BaseTelemetryProvider` interface (`backend/telemetry/base.py`). This abstraction enables future implementations (such as a future `WindowsTelemetryProvider`) without modifying core ML or scoring services. Windows support is not implemented in this prototype.

---

## 2. Observation Mode & Zero-Risk Safety Guarantees

DiskGuard AI runs in a strictly **read-only, non-destructive observation mode**.

### What DiskGuard AI Does:
- Inspects filesystem volume metadata via native `diskutil info -plist` and `shutil.disk_usage`.
- Collects hardware I/O counters (cumulative delta read/write bytes and operation counts) via `psutil.disk_io_counters()`.
- Listens to non-destructive filesystem events (`created`, `modified`, `moved`/renamed) using Apple's native `FSEvents` via the Python `watchdog` library.
- Safely samples small file headers (maximum 4096 bytes) solely to calculate Shannon entropy, immediately discarding file contents and paths.
- Maintains rolling in-memory telemetry buffers (60-second deques) for feature computation.

### What DiskGuard AI NEVER Does:
- **No File Encryption**: Never creates encryption keys, never encrypts or locks files.
- **No Deletion or Renaming**: Never deletes, renames, moves, or touches user files.
- **No File Modification**: Never writes, appends, or alters user data.
- **No Partition or Mount Alterations**: Never mounts, unmounts, formats, or modifies drive partitions.
- **No Process Termination**: Never kills, suspends, or injects into running OS processes.
- **No Quarantine**: Never sequesters or blocks files.
- **No Destructive Workloads**: Never executes real ransomware or destructive malware strains.

---

## 3. Telemetry Capabilities & Limitations on macOS

| Metric | Source | Availability | Limitations / Notes |
| :--- | :--- | :--- | :--- |
| **Read Bytes** | `psutil.disk_io_counters(perdisk=True)` | ✅ Real Hardware | Measured per physical disk (`disk0`) backing APFS containers. |
| **Write Bytes** | `psutil.disk_io_counters(perdisk=True)` | ✅ Real Hardware | Delta computed every 1-second sampling interval. |
| **Read IOPS** | `psutil.disk_io_counters(perdisk=True)` | ✅ Real Hardware | Operation counts reported directly by Darwin kernel IOKit. |
| **Write IOPS** | `psutil.disk_io_counters(perdisk=True)` | ✅ Real Hardware | Operation counts reported directly by Darwin kernel IOKit. |
| **File Modifications** | `watchdog` (`FSEvents`) | ✅ Real Filesystem | Listens on user workspace/volume; excludes SIP system paths. |
| **Rename Events** | `watchdog` (`FSEvents`) | ✅ Real Filesystem | Tracks `on_moved` events occurring on the monitored volume. |
| **Shannon Entropy** | Safe header read (4KB) | ✅ Real Sample | Calculated on modified files; bounded to 0.0–8.0 bits/byte. |
| **Process-to-File Attribution** | Kernel DTrace / Endpoint Security | ⚠️ Unavailable | Requires Apple SIP bypass or kernel entitlements; marked null. |
| **Direct Sector Access** | Raw block device | ⚠️ Unavailable | Requires root permissions and raw disk node access; bypassed for safety. |

---

## 4. Behavioral Feature Definitions

Features are calculated over a rolling time window (10–30 seconds) using `extract_behavioral_features()` in `backend/ml/features.py`. Unmeasurable or unavailable values are returned as `null` (not fabricated).

1. **`read_frequency`**: Average read operations per minute:
   $$\text{read\_frequency} = \frac{\sum \text{read\_operations}}{\text{window\_duration\_minutes}}$$
2. **`write_frequency`**: Average write operations per minute:
   $$\text{write\_frequency} = \frac{\sum \text{write\_operations}}{\text{window\_duration\_minutes}}$$
3. **`file_modification_rate`**: Number of file modification/creation events per minute:
   $$\text{file\_modification\_rate} = \frac{\sum \text{file\_modifications}}{\text{window\_duration\_minutes}}$$
4. **`rename_rate`**: Number of file rename/move events per minute:
   $$\text{rename\_rate} = \frac{\sum \text{rename\_events}}{\text{window\_duration\_minutes}}$$
5. **`entropy_change`**: Absolute difference between current mean sample entropy and established baseline entropy:
   $$\text{entropy\_change} = |\bar{H}_{\text{current}} - \bar{H}_{\text{baseline}}|$$
6. **`access_irregularity`**: Coefficient of variation of I/O operations across the window:
   $$\text{access\_irregularity} = \frac{\sigma_{\text{iops}}}{\mu_{\text{iops}} + \epsilon}$$
7. **`io_burstiness`**: Ratio of peak 1-second operations to average operations across the window:
   $$\text{io\_burstiness} = \frac{\max(\text{iops})}{\mu_{\text{iops}} + \epsilon}$$
8. **`read_write_ratio`**: Ratio of total read bytes to total write bytes:
   $$\text{read\_write\_ratio} = \frac{\sum \text{read\_bytes}}{\max(1, \sum \text{write\_bytes})}$$

---

## 5. Shannon Entropy

Shannon entropy is calculated in bits per byte (0.0 to 8.0) using:
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$

- **Plaintext & source code**: typically yields 3.5 – 4.8 bits/byte.
- **Compressed formats (ZIP/PNG)**: yields 7.2 – 7.6 bits/byte.
- **Encrypted / Ciphertext**: yields 7.8 – 8.0 bits/byte.

> [!IMPORTANT]
> **Entropy Limitation**: Shannon entropy is **only one behavioral indicator** and is insufficient on its own to identify ransomware. High entropy naturally occurs during normal file compression, media video rendering, and encrypted disk backups. DiskGuard AI requires concurrent behavioral deviations (such as high modification velocity and mass renames) before elevating risk.

---

## 6. Adaptive Baseline Learning

Implemented in `backend/ml/baseline.py`:

- **Phase 1: `learning`**:
  During the initial observation window (minimum 15 samples), the system records baseline behavior. Drives are **never classified as malicious** during baseline learning.
- **Phase 2: `established`**:
  Once 15+ observation samples have been collected, the system establishes a statistical profile ($\mu, \sigma$) for all 8 behavioral dimensions.
- **Deviations**:
  Statistical distance (Z-score) is calculated for each metric:
  $$Z = \max\left(0, \frac{x - \mu}{\sigma}\right)$$

---

## 7. Local Edge AI Model

Implemented in `backend/ml/model.py`:

- **Model Type**: `RandomForestClassifier` (35 estimators, max depth 4, balanced class weights).
- **Inference Location**: 100% on-device CPU execution (sub-15ms latency).
- **Dependencies**: Uses `scikit-learn` and `numpy`.
- **Zero Cloud Leakage**: No OpenAI API, no cloud telemetry streaming, no external telemetry services.
- **Training Data**: Trained locally on curated behavioral vectors (`backend/ml/dataset.csv`) modeling normal idle activity, developer builds, heavy media editing, backup sync, mass renames, and ransomware-like multi-vector encryption dynamics.

---

## 8. Deterministic Scoring & Compounding Risk

Implemented in `backend/ml/scoring.py`:

```json
{
  "classification": "normal",
  "confidence": 0.85,
  "anomaly_score": 12,
  "risk_score": 18
}
```

### Compounding Multiplier:
- **0 Signals**: Normal (Risk: 0–15).
- **1 Isolated Signal** (e.g. high sequential writes from a large ISO download):
  Risk remains bounded below 28. **An isolated signal never equals ransomware.**
- **2 Signals** (e.g. high writes + modifications during `npm install`):
  Elevated / Anomalous Activity (Risk: 30–48).
- **3 Signals** (e.g. high writes + high modifications + rapid renames):
  Suspicious Behavioral Pattern (Risk: 50–74).
- **4+ Signals** (high writes + modifications + renames + entropy shift + burstiness):
  Ransomware-Like Behavioral Pattern (Risk: 75–96).

---

## 9. Machine-Readable Explainability

Every analysis response includes structured explainability fields:

```json
{
  "summary": "Suspicious behavioral pattern: concurrent high write velocity and mass file renames.",
  "signals": [
    {
      "feature": "write_frequency",
      "direction": "high",
      "contribution": 0.15
    },
    {
      "feature": "file_modification_rate",
      "direction": "high",
      "contribution": 0.15
    }
  ],
  "top_features": [
    "write_frequency",
    "file_modification_rate"
  ]
}
```

Phased cautiously using approved terminology: `"ransomware-like behavior"`, `"anomalous activity"`, and `"suspicious behavioral pattern"`.

---

## 10. Safe Simulation Mode & Sandbox Guarantees (Mode B)

DiskGuard AI provides **strictly separated dual operating modes**:
- **Mode A (Real Observation)**: Read-only hardware telemetry on real storage devices. Never creates, modifies, deletes, renames, or encrypts files.
- **Mode B (Safe Simulation)**: Generates synthetic disk workloads to validate the behavioral detection and incident pipeline.

### Sandbox Boundary Enforcement:
1. **Isolated Path**: Simulations execute **exclusively** inside `<project_root>/backend/sandbox/`.
2. **Path Traversal Defenses**: All filesystem operations resolve canonical absolute paths via `os.path.realpath()`. Any path outside `backend/sandbox/` raises an immediate `ValueError` and halts execution.
3. **Safe Synthetic Workloads**: Uses mock temporary dummy files (`test_file_*.bin`, `doc_*.txt`). Does **not** use cryptographic encryption; simulates high entropy using Python `os.urandom()`.
4. **Auto-Cleanup**: Automatically cleans up synthetic test files upon scenario completion or explicit simulation stop.

### Supported Simulation Scenarios:
| Scenario | Operations | Behavioral Effect | Expected Outcome |
| :--- | :--- | :--- | :--- |
| `normal` | Low-frequency reads & small text writes (2 ops/s) | Baseline variance | Low Risk (<30), No Incident |
| `elevated_writes` | Sequential test file writes (15–20 ops/s) | Elevated write frequency | Elevated Risk (30–60), No Incident |
| `mass_rename` | Rapid extension renaming of dummy files | High rename velocity (>60/min) | High Risk (>60), May trigger Incident |
| `high_entropy_test` | Dense pseudo-random buffer writes (8.0 bits/byte) | Sharp entropy deviation | High Risk (>60), May trigger Incident |
| `ransomware_like_burst` | Concurrent rapid writes + renames + random buffers | Multi-signal breach (4+ signals) | Critical Risk (>80), Generates Incident |

---

## 11. Centralized Incident Engine & Thresholds

Implemented in `backend/security/thresholds.py` and `backend/security/incidents.py`:

- **Risk Levels**:
  - `LOW`: < 30
  - `ELEVATED`: 30 – 60
  - `HIGH`: 60 – 80
  - `CRITICAL`: > 80
- **Incident Escalation Rules**:
  - `RISK_TRIGGER_THRESHOLD`: 60
  - `MIN_CONCURRENT_SIGNALS`: 2 (an isolated metric spike never generates an incident)
  - `PERSISTENCE_STREAK`: 2 consecutive evaluation cycles
- **Incident Persistence & Lifecycle**:
  - Incidents persist in-memory across simulation stops (stopping a simulation does **not** erase detected incidents).
  - Lifecycle: `open` $\rightarrow$ `acknowledged` $\rightarrow$ `resolved`.
  - Machine-readable explanations and feature contributions are attached to each incident record.

---

## 12. API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, platform (`macos`), and read-only telemetry mode. |
| `GET` | `/api/devices` | Real mounted storage devices discovered via `diskutil`. |
| `GET` | `/api/devices/{id}` | Specific device storage metrics and filesystem details. |
| `POST` | `/api/monitor/start` | Body: `{"device_id": "disk3s1s1"}` — starts real telemetry collection. |
| `POST` | `/api/monitor/stop` | Body: `{"device_id": "disk3s1s1"}` — stops telemetry observer. |
| `GET` | `/api/telemetry/{id}` | Returns latest rolling telemetry window (up to 30 snapshots). |
| `GET` | `/api/analysis/{id}` | Returns full behavioral analysis, baseline status, Edge AI classification, risk score, and signals. |
| `POST` | `/api/simulation/start` | Body: `{"scenario": "ransomware_like_burst"}` — starts safe sandbox simulation. |
| `POST` | `/api/simulation/stop` | Halts active simulation worker and cleans sandbox files. |
| `GET` | `/api/simulation/status` | Current simulation status, active scenario, ops counter, and elapsed time. |
| `GET` | `/api/incidents` | List all correlated security incidents. |
| `GET` | `/api/incidents/{id}` | Retrieve details for a specific security incident. |
| `POST` | `/api/incidents/{id}/acknowledge` | Mark an incident as acknowledged / under investigation. |
| `POST` | `/api/incidents/{id}/resolve` | Mark an incident as resolved. |

---

## 11. Known Prototype Limitations

1. **User-Space Limitations**: Operates entirely in user-space without kernel extensions (`KEXT`) or Apple Endpoint Security entitlements.
2. **Global Physical Disk I/O**: macOS reports disk I/O at the physical controller level (`disk0`), meaning APFS container volumes share hardware counters.
3. **Entropy Sampling**: Samples are limited to file headers (first 4KB) of modified user files to preserve system responsiveness and user privacy.
4. **Academic Prototype**: The local machine learning model is trained on synthesized behavioral feature distributions for educational demonstration.
