/**
 * Client API service for communicating with DiskGuard AI
 * Supports both standalone Real Monitoring (with empty initial state) and Sandbox Simulation Mode
 */

import { SIMULATED_DRIVES, getEdgeAiScenarioData } from '../data/edgeAiSimulation';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const IS_SIMULATION_MODE = import.meta.env.VITE_DATA_MODE !== 'backend';

// Centralized In-Memory Simulation & Real Monitoring State
let activeScenario = 'none'; // Default state is Real Monitoring ('none')
let selectedDeviceId = null;
let monitoredDeviceId = null;
let monitoringState = 'NO_DEVICE';
let streamTimer = null;
let realAnalysisTimer = null;
let healthCheckTimer = null;
let lastKnownBackendOnline = null;
const streamListeners = new Set();

function notifyBackendStatus(isOnline) {
  if (lastKnownBackendOnline !== isOnline) {
    lastKnownBackendOnline = isOnline;
    notifyStreamListeners({
      type: 'BACKEND_STATUS',
      payload: { online: isOnline }
    });
  }
}

async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    notifyBackendStatus(res.ok);
    return res.ok;
  } catch {
    notifyBackendStatus(false);
    return false;
  }
}

function startHealthHeartbeat() {
  if (healthCheckTimer) return;
  checkBackendHealth();
  healthCheckTimer = setInterval(checkBackendHealth, 3000);
}

function buildSimulatedAiInference(scenario) {
  if (scenario === 'none') {
    return null;
  }

  const scenarioData = getEdgeAiScenarioData(scenario);
  const classification = scenario === 'ransomware'
    ? 'RANSOMWARE_SUSPECT'
    : scenario === 'mass-rename' || scenario === 'high-entropy'
    ? 'SUSPICIOUS'
    : 'NOMINAL';

  const writeRateVal = scenario === 'ransomware' ? 630 : scenario === 'high-entropy' ? 380 : 48;
  const totalOpsVal = scenario === 'ransomware' ? 4890 : scenario === 'high-entropy' ? 2400 : 1284;
  const entropyVal = scenario === 'high-entropy' || scenario === 'ransomware' ? 5.4 : 1.3;

  return {
    classification,
    riskScore: scenarioData.riskScore,
    confidence: (scenarioData.confidence || 95) / 100,
    latencyMs: scenarioData.latencyMs || 18,
    features: {
      writeRate: writeRateVal,
      totalOpsPerSec: totalOpsVal,
      entropyShift: entropyVal,
      renameVelocity: scenario === 'mass-rename' ? 410 : 6
    },
    assessment: scenarioData.aiAssessment
  };
}

function buildSimulatedTelemetryEvent(scenario) {
  if (scenario === 'none') return null;
  const time = new Date().toLocaleTimeString();
  if (scenario === 'ransomware') {
    return {
      timestamp: time,
      process: 'svchost_update.exe (PID: 4912)',
      operation: 'WRITE_ENCRYPT',
      path: 'C:\\Users\\Documents\\finance_q3.xlsx.locked',
      writeRate: '630 ops/s',
      entropy: '7.92 Shannon',
      risk: 'CRITICAL'
    };
  } else if (scenario === 'mass-rename') {
    return {
      timestamp: time,
      process: 'batch_renamer.exe (PID: 3108)',
      operation: 'RENAME_BATCH',
      path: 'C:\\Users\\Photos\\family_vacation_04.jpg.crypto',
      writeRate: '180 ops/s',
      entropy: '3.15 Shannon',
      risk: 'ELEVATED'
    };
  } else if (scenario === 'high-entropy') {
    return {
      timestamp: time,
      process: 'encryptor_node.exe (PID: 5820)',
      operation: 'WRITE_HIGH_ENTROPY',
      path: 'C:\\Data\\database_vault.db',
      writeRate: '380 ops/s',
      entropy: '7.85 Shannon',
      risk: 'ELEVATED'
    };
  } else {
    return {
      timestamp: time,
      process: 'chrome.exe (PID: 1042)',
      operation: 'WRITE_CACHE',
      path: 'C:\\Users\\AppData\\Local\\Google\\Chrome\\User Data\\Cache\\data_0',
      writeRate: '48 ops/s',
      entropy: '1.30 Shannon',
      risk: 'NOMINAL'
    };
  }
}

function notifyStreamListeners(message) {
  streamListeners.forEach((listener) => {
    try {
      listener(message);
    } catch (err) {
      console.error('[Stream] Listener error:', err);
    }
  });
}

function broadcastState() {
  const currentDevices = SIMULATED_DRIVES;
  const stateToBroadcast = 'MONITORING';

  notifyStreamListeners({
    type: 'DEVICES_UPDATE',
    payload: {
      devices: currentDevices,
      selectedDeviceId: selectedDeviceId || 'drive_c',
      monitoredDeviceId: monitoredDeviceId || 'drive_d',
      state: stateToBroadcast
    }
  });

  notifyStreamListeners({
    type: 'STATUS_UPDATE',
    payload: {
      state: stateToBroadcast,
      selectedDeviceId: selectedDeviceId || 'drive_c',
      monitoredDeviceId: monitoredDeviceId || 'drive_d'
    }
  });

  notifyStreamListeners({
    type: 'AI_INFERENCE',
    payload: buildSimulatedAiInference(activeScenario)
  });

  notifyStreamListeners({
    type: 'TELEMETRY_EVENT',
    payload: buildSimulatedTelemetryEvent(activeScenario)
  });
}

function startStreamIfNeeded() {
  if (streamTimer || !IS_SIMULATION_MODE) return;
  streamTimer = setInterval(() => {
    if (streamListeners.size === 0 || activeScenario === 'none') return;

    const event = buildSimulatedTelemetryEvent(activeScenario);
    if (event) {
      notifyStreamListeners({
        type: 'TELEMETRY_EVENT',
        payload: event
      });
    }

    notifyStreamListeners({
      type: 'AI_INFERENCE',
      payload: buildSimulatedAiInference(activeScenario)
    });
  }, 3000);
}

export const diskguardApi = {
  // GET /api/health
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        notifyBackendStatus(true);
        return await res.json();
      }
      notifyBackendStatus(false);
      return null;
    } catch {
      notifyBackendStatus(false);
      if (IS_SIMULATION_MODE) {
        return { status: 'ok', mode: activeScenario === 'none' ? 'REAL_MONITORING' : 'SANDBOX_SIMULATION' };
      }
      return null;
    }
  },

  // GET /api/devices
  async getDevices() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/devices`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        notifyBackendStatus(true);
        const data = await res.json();
        if (data && Array.isArray(data.devices) && data.devices.length > 0) {
          const realDevices = data.devices.map(d => ({
            id: d.id,
            device: d.mount_point === '/' ? '/' : (d.mount_point || d.id),
            name: d.name,
            driveType: (d.device_type || 'ssd').toUpperCase(),
            capacity: (d.total_bytes / (1024 ** 3)).toFixed(0) + ' GB',
            role: d.removable ? 'Removable Volume' : 'System Storage',
            health: 'Healthy',
            filesystem: d.filesystem || 'apfs',
            isReal: true,
            statusBadge: 'AVAILABLE',
            statusVariant: 'neutral',
            raw: d
          }));

          return {
            devices: realDevices,
            realDevices: realDevices,
            simulatedDevices: SIMULATED_DRIVES,
            isBackendConnected: true,
            selectedDeviceId: selectedDeviceId || realDevices[0]?.id || 'drive_c',
            monitoredDeviceId: monitoredDeviceId || 'drive_d',
            state: 'MONITORING'
          };
        }
      } else {
        notifyBackendStatus(false);
      }
    } catch {
      notifyBackendStatus(false);
      // Backend not running or unreachable, fallback to simulation mode
    }

    return {
      devices: SIMULATED_DRIVES,
      realDevices: [],
      simulatedDevices: SIMULATED_DRIVES,
      isBackendConnected: false,
      selectedDeviceId: selectedDeviceId || 'drive_c',
      monitoredDeviceId: monitoredDeviceId || 'drive_d',
      state: 'MONITORING'
    };
  },

  // GET /api/devices/:id
  async getDevice(id) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const d = await res.json();
        return {
          id: d.id,
          device: d.mount_point === '/' ? '/' : (d.mount_point || d.id),
          name: d.name,
          driveType: (d.device_type || 'ssd').toUpperCase(),
          capacity: (d.total_bytes / (1024 ** 3)).toFixed(0) + ' GB',
          role: d.removable ? 'Removable Volume' : 'System Storage',
          health: 'Healthy',
          filesystem: d.filesystem || 'apfs',
          isReal: true,
          raw: d
        };
      }
    } catch {
      // Fallback
    }
    return SIMULATED_DRIVES.find((d) => d.id === id) || null;
  },

  // POST /api/devices/:id/select
  async selectDevice(id) {
    if (IS_SIMULATION_MODE) {
      selectedDeviceId = id;
      broadcastState();
      return { success: true, selectedDeviceId: id };
    }
    try {
      const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}/select`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // POST /api/monitor/start or simulation start
  async startMonitoring(id) {
    const isSimDrive = ['drive_c', 'drive_d', 'drive_e'].includes(id);
    monitoredDeviceId = id;
    selectedDeviceId = id;
    monitoringState = 'MONITORING';

    if (!isSimDrive) {
      try {
        await fetch(`${API_BASE}/monitor/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: id })
        });

        // Start background polling for real analysis, telemetry, and incidents
        if (realAnalysisTimer) clearInterval(realAnalysisTimer);
        realAnalysisTimer = setInterval(async () => {
          try {
            const [analysisRes, telemRes, incRes] = await Promise.all([
              fetch(`${API_BASE}/analysis/${encodeURIComponent(id)}`),
              fetch(`${API_BASE}/telemetry/${encodeURIComponent(id)}`),
              fetch(`${API_BASE}/incidents`)
            ]);

            if (analysisRes.ok) {
              notifyBackendStatus(true);
              const analysis = await analysisRes.json();
              notifyStreamListeners({
                type: 'REAL_ANALYSIS_UPDATE',
                payload: analysis
              });

              notifyStreamListeners({
                type: 'AI_INFERENCE',
                payload: {
                  classification: analysis.classification === 'ransomware-like behavior' || analysis.classification === 'ransomware-like behavioral pattern'
                    ? 'RANSOMWARE_SUSPECT'
                    : (analysis.classification.includes('suspicious') || analysis.classification.includes('anomalous'))
                    ? 'SUSPICIOUS'
                    : 'NOMINAL',
                  riskScore: analysis.risk_score,
                  anomalyScore: analysis.anomaly_score,
                  confidence: analysis.confidence,
                  latencyMs: 12,
                  features: {
                    writeRate: Math.round(analysis.features?.write_frequency || 0),
                    totalOpsPerSec: Math.round(((analysis.features?.read_frequency || 0) + (analysis.features?.write_frequency || 0)) / 60),
                    entropyShift: analysis.features?.entropy_change != null ? analysis.features.entropy_change : 0.0,
                    renameVelocity: Math.round(analysis.features?.rename_rate || 0)
                  },
                  assessment: analysis.explanation?.summary,
                  realAnalysis: analysis
                }
              });
            }

            if (telemRes.ok) {
              const telem = await telemRes.json();
              if (telem.snapshots && telem.snapshots.length > 0) {
                const latest = telem.snapshots[telem.snapshots.length - 1];
                const tsDate = typeof latest.timestamp === 'number'
                  ? new Date(latest.timestamp * 1000)
                  : new Date(latest.timestamp || (latest.posix_timestamp ? latest.posix_timestamp * 1000 : Date.now()));
                notifyStreamListeners({
                  type: 'TELEMETRY_EVENT',
                  payload: {
                    timestamp: isNaN(tsDate.getTime()) ? new Date().toLocaleTimeString() : tsDate.toLocaleTimeString(),
                    process: 'macOS Storage Subsystem',
                    operation: latest.write_operations > latest.read_operations ? 'WRITE_BLOCK' : 'READ_BLOCK',
                    path: id === 'disk3s1s1' ? '/ (APFS Root)' : id,
                    writeRate: `${Math.round(latest.write_bytes / 1024)} KB/s`,
                    entropy: latest.sample_entropy ? `${latest.sample_entropy.toFixed(2)} Shannon` : 'N/A',
                    risk: 'NOMINAL'
                  }
                });
              }
            }

            if (incRes.ok) {
              const incData = await incRes.json();
              notifyStreamListeners({
                type: 'INCIDENTS_UPDATE',
                payload: incData.incidents || []
              });
            }
          } catch (pollErr) {
            notifyBackendStatus(false);
            console.warn('[Real Monitoring Poll Error]', pollErr);
          }
        }, 1500);

        broadcastState();
        return { success: true, monitoredDeviceId: id, state: 'MONITORING' };
      } catch (err) {
        console.warn('Backend start error, falling back to local state:', err);
      }
    }

    broadcastState();
    return { success: true, monitoredDeviceId: id, state: 'MONITORING' };
  },

  // POST /api/monitor/stop
  async stopMonitoring(id) {
    if (realAnalysisTimer) {
      clearInterval(realAnalysisTimer);
      realAnalysisTimer = null;
    }

    const isSimDrive = ['drive_c', 'drive_d', 'drive_e'].includes(id);
    if (!isSimDrive) {
      try {
        await fetch(`${API_BASE}/monitor/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: id })
        });
      } catch (err) {
        console.warn('Backend stop error:', err);
      }
    }

    monitoredDeviceId = null;
    monitoringState = 'DEVICE_SELECTED';
    broadcastState();
    return { success: true, monitoredDeviceId: null, state: 'DEVICE_SELECTED' };
  },

  // GET /api/analysis/:id
  async getRealAnalysis(deviceId) {
    try {
      const res = await fetch(`${API_BASE}/analysis/${encodeURIComponent(deviceId)}`);
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
  },

  // GET /api/telemetry/:id
  async getRealTelemetry(deviceId) {
    try {
      const res = await fetch(`${API_BASE}/telemetry/${encodeURIComponent(deviceId)}`);
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
  },

  // GET /api/devices/:id/status
  async getDeviceStatus(id) {
    if (IS_SIMULATION_MODE) {
      if (activeScenario === 'none') return null;
      const dev = SIMULATED_DRIVES.find((d) => d.id === id);
      return dev ? { id, state: monitoringState, active: monitoredDeviceId === id } : null;
    }
    try {
      const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}/status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // GET /api/devices/:id/telemetry
  async getDeviceTelemetry(id) {
    if (IS_SIMULATION_MODE) {
      if (activeScenario === 'none') return { events: [] };
      const evt = buildSimulatedTelemetryEvent(activeScenario);
      return { events: evt ? [evt] : [] };
    }
    try {
      const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}/telemetry`);
      if (!res.ok) return { events: [] };
      return await res.json();
    } catch {
      return { events: [] };
    }
  },

  // Simulation APIs
  async startSimulation(scenario) {
    try {
      const res = await fetch(`${API_BASE}/simulation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  async stopSimulation() {
    try {
      const res = await fetch(`${API_BASE}/simulation/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  async getSimulationStatus() {
    try {
      const res = await fetch(`${API_BASE}/simulation/status`);
      if (res.ok) return await res.json();
    } catch {
      return { running: false, scenario: 'none', sandbox: true };
    }
  },

  // Incident APIs
  async getIncidents() {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      if (res.ok) {
        const data = await res.json();
        return data.incidents || [];
      }
    } catch {
      return [];
    }
    return [];
  },

  async getIncident(id) {
    try {
      const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
  },

  async acknowledgeIncident(id) {
    try {
      const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}/acknowledge`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  async resolveIncident(id) {
    try {
      const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}/resolve`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  // Scenario Coordinator
  async setSimulationScenario(scenario) {
    const backendScenarioMap = {
      'normal': 'normal',
      'ransomware': 'ransomware_like_burst',
      'mass-rename': 'mass_rename',
      'high-entropy': 'high_entropy_test'
    };

    if (scenario === 'none') {
      try {
        await fetch(`${API_BASE}/simulation/stop`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      } catch {}
    } else if (backendScenarioMap[scenario]) {
      try {
        await fetch(`${API_BASE}/simulation/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: backendScenarioMap[scenario] })
        });
      } catch {}
    }

    if (IS_SIMULATION_MODE) {
      activeScenario = scenario;
      if (scenario === 'none') {
        selectedDeviceId = null;
        monitoredDeviceId = null;
        monitoringState = 'NO_DEVICE';
      } else {
        selectedDeviceId = selectedDeviceId || 'drive_c';
        monitoredDeviceId = monitoredDeviceId || 'drive_c';
        monitoringState = 'MONITORING';
      }
      broadcastState();
      return { success: true, scenario };
    }
    try {
      const res = await fetch(`${API_BASE}/simulation/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Telemetry stream subscriber
  connectTelemetryStream(onMessage, onError) {
    startHealthHeartbeat();

    if (IS_SIMULATION_MODE) {
      streamListeners.add(onMessage);

      // Emit initial state immediately to subscriber
      try {
        if (lastKnownBackendOnline !== null) {
          onMessage({
            type: 'BACKEND_STATUS',
            payload: { online: lastKnownBackendOnline }
          });
        }

        const currentDevices = activeScenario === 'none' ? [] : SIMULATED_DRIVES;
        const stateToBroadcast = activeScenario === 'none' ? 'NO_DEVICE' : 'MONITORING';

        onMessage({
          type: 'DEVICES_UPDATE',
          payload: {
            devices: currentDevices,
            selectedDeviceId: activeScenario === 'none' ? null : (selectedDeviceId || 'drive_c'),
            monitoredDeviceId: activeScenario === 'none' ? null : (monitoredDeviceId || 'drive_c'),
            state: stateToBroadcast
          }
        });
        onMessage({
          type: 'STATUS_UPDATE',
          payload: {
            state: stateToBroadcast,
            selectedDeviceId: activeScenario === 'none' ? null : (selectedDeviceId || 'drive_c'),
            monitoredDeviceId: activeScenario === 'none' ? null : (monitoredDeviceId || 'drive_c')
          }
        });
        onMessage({
          type: 'AI_INFERENCE',
          payload: buildSimulatedAiInference(activeScenario)
        });
      } catch (err) {
        if (onError) onError(err);
      }

      startStreamIfNeeded();

      return () => {
        streamListeners.delete(onMessage);
        if (streamListeners.size === 0 && streamTimer) {
          clearInterval(streamTimer);
          streamTimer = null;
        }
      };
    }

    // Backend WebSocket Mode
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/telemetry`;

    let ws = null;
    let reconnectTimer = null;

    function initWs() {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          notifyBackendStatus(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (onMessage) onMessage(data);
          } catch (err) {
            console.error('[WS] Error parsing message:', err);
          }
        };

        ws.onerror = (err) => {
          notifyBackendStatus(false);
          if (onError) onError(err);
        };

        ws.onclose = () => {
          notifyBackendStatus(false);
          reconnectTimer = setTimeout(initWs, 3000);
        };
      } catch (err) {
        notifyBackendStatus(false);
        if (onError) onError(err);
      }
    }

    initWs();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }
};


