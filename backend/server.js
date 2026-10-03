import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { DeviceDetector } from './device/detector.js';
import { TelemetryWatcher } from './telemetry/telemetryWatcher.js';
import { FeatureExtractor } from './features/featureExtractor.js';
import { EdgeClassifier } from './ai/edgeClassifier.js';
import { SimulationEngine } from './simulation/simulationEngine.js';

const PORT = process.env.PORT || 3002;

const app = express();
app.use(express.json());

// Controlled CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize core services
const deviceDetector = new DeviceDetector();
const telemetryWatcher = new TelemetryWatcher();
const featureExtractor = new FeatureExtractor(5000);
const simulationEngine = new SimulationEngine();

// System State Management
let selectedDeviceId = null;
let monitoredDeviceId = null;
let monitoringState = 'NO_DEVICE'; // 'NO_DEVICE' | 'DEVICE_DETECTED' | 'DEVICE_SELECTED' | 'CONNECTING' | 'MONITORING' | 'PERMISSION_REQUIRED' | 'DISCONNECTED' | 'ERROR'

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/telemetry' });

// Broadcast to all connected WebSocket clients
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// --------------------------------------------------------------------------
// EVENT BINDINGS
// --------------------------------------------------------------------------

// Device Hot-Plug Events
deviceDetector.on('devices_updated', (devices) => {
  if (devices.length === 0 && monitoringState === 'NO_DEVICE') {
    monitoringState = 'NO_DEVICE';
  } else if (devices.length > 0 && monitoringState === 'NO_DEVICE') {
    monitoringState = 'DEVICE_DETECTED';
  }
  broadcast('DEVICES_UPDATE', { devices, state: monitoringState });
});

deviceDetector.on('device_connected', (device) => {
  console.log(`[Server] Device connected: ${device.name}`);
  broadcast('DEVICE_HOTPLUG', { action: 'CONNECTED', device });
});

deviceDetector.on('device_disconnected', (device) => {
  console.log(`[Server] Device disconnected: ${device.name}`);
  broadcast('DEVICE_HOTPLUG', { action: 'DISCONNECTED', device });
});

deviceDetector.on('monitored_device_removed', (device) => {
  console.warn(`[Server] Monitored device ${device.name} disconnected. Stopping monitoring safely.`);
  telemetryWatcher.stopMonitoring();
  featureExtractor.clear();
  monitoredDeviceId = null;
  monitoringState = 'DISCONNECTED';
  broadcast('STATUS_UPDATE', {
    state: monitoringState,
    message: 'Device disconnected. Monitoring stopped safely.'
  });
});

// Real Telemetry Event Flow
telemetryWatcher.on('telemetry_event', (event) => {
  featureExtractor.addEvent(event);
  broadcast('TELEMETRY_EVENT', event);
});

telemetryWatcher.on('status_change', (status) => {
  if (status === 'MONITORING') {
    monitoringState = 'MONITORING';
  } else if (status === 'PERMISSION_REQUIRED') {
    monitoringState = 'PERMISSION_REQUIRED';
  } else if (status === 'ERROR') {
    monitoringState = 'ERROR';
  } else if (status === 'STOPPED' && monitoringState !== 'DISCONNECTED') {
    monitoringState = selectedDeviceId ? 'DEVICE_SELECTED' : 'DEVICE_DETECTED';
  }
  broadcast('STATUS_UPDATE', { state: monitoringState, status });
});

// Simulation Event Flow (isolated)
simulationEngine.on('simulation_event', (event) => {
  // Only process synthetic events if simulation active
  if (simulationEngine.scenario !== 'none') {
    featureExtractor.addEvent(event);
    broadcast('TELEMETRY_EVENT', event);
  }
});

// Continuous Feature Extraction & Edge AI Loop (every 500ms)
setInterval(() => {
  const isMonitoring = monitoringState === 'MONITORING';
  const isSimulating = simulationEngine.scenario !== 'none';

  if (isMonitoring || isSimulating) {
    const features = featureExtractor.extractFeatures();
    const aiResult = EdgeClassifier.classify(features, true);
    broadcast('AI_INFERENCE', aiResult);
  } else {
    const emptyFeatures = featureExtractor.extractFeatures();
    const emptyResult = EdgeClassifier.classify(emptyFeatures, false);
    broadcast('AI_INFERENCE', emptyResult);
  }
}, 500);

// --------------------------------------------------------------------------
// REST API ENDPOINTS
// --------------------------------------------------------------------------

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'diskguard-agent',
    version: '0.1.0',
    platform: process.platform,
    arch: process.arch,
    monitoringState: monitoringState
  });
});

// GET /api/devices
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await deviceDetector.getDevices();
    res.json({
      devices: devices,
      selectedDeviceId: selectedDeviceId,
      monitoredDeviceId: monitoredDeviceId,
      state: monitoringState
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to discover devices', details: err.message });
  }
});

// GET /api/devices/:id
app.get('/api/devices/:id', (req, res) => {
  const device = deviceDetector.getDeviceById(req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json({ device });
});

// POST /api/devices/:id/select
app.post('/api/devices/:id/select', (req, res) => {
  const device = deviceDetector.getDeviceById(req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  selectedDeviceId = device.id;
  if (monitoringState !== 'MONITORING') {
    monitoringState = 'DEVICE_SELECTED';
  }

  broadcast('STATUS_UPDATE', { state: monitoringState, selectedDeviceId: device.id });
  res.json({ success: true, selectedDevice: device, state: monitoringState });
});

// POST /api/devices/:id/connect (Start Monitoring)
app.post('/api/devices/:id/connect', (req, res) => {
  const device = deviceDetector.getDeviceById(req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  // Turn off simulation if active
  if (simulationEngine.scenario !== 'none') {
    simulationEngine.setScenario('none');
  }

  selectedDeviceId = device.id;
  const started = telemetryWatcher.startMonitoring(device);

  if (started) {
    monitoredDeviceId = device.id;
    monitoringState = 'MONITORING';
    broadcast('STATUS_UPDATE', { state: monitoringState, monitoredDeviceId: device.id });
    return res.json({ success: true, message: 'Monitoring started', state: monitoringState });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Failed to start monitoring or permission required',
      state: telemetryWatcher.status
    });
  }
});

// POST /api/devices/:id/disconnect (Stop Monitoring)
app.post('/api/devices/:id/disconnect', (req, res) => {
  telemetryWatcher.stopMonitoring();
  featureExtractor.clear();
  monitoredDeviceId = null;
  monitoringState = selectedDeviceId ? 'DEVICE_SELECTED' : 'DEVICE_DETECTED';

  broadcast('STATUS_UPDATE', { state: monitoringState, monitoredDeviceId: null });
  res.json({ success: true, message: 'Monitoring stopped safely', state: monitoringState });
});

// GET /api/devices/:id/status
app.get('/api/devices/:id/status', (req, res) => {
  const device = deviceDetector.getDeviceById(req.params.id);
  const features = featureExtractor.extractFeatures();
  const isMonitored = monitoredDeviceId === req.params.id;
  const aiResult = EdgeClassifier.classify(features, isMonitored);

  res.json({
    deviceId: req.params.id,
    device: device,
    isMonitored: isMonitored,
    state: monitoringState,
    features: features,
    aiInference: aiResult
  });
});

// GET /api/devices/:id/telemetry
app.get('/api/devices/:id/telemetry', (req, res) => {
  const events = telemetryWatcher.getRecentEvents(50);
  res.json({ events });
});

// POST /api/simulation/scenario
app.post('/api/simulation/scenario', (req, res) => {
  const { scenario } = req.body;
  if (!['none', 'normal', 'ransomware', 'mass-rename', 'high-entropy'].includes(scenario)) {
    return res.status(400).json({ error: 'Invalid scenario name' });
  }

  // If running real monitoring, stop it when user switches to simulation
  if (scenario !== 'none' && monitoredDeviceId) {
    telemetryWatcher.stopMonitoring();
    monitoredDeviceId = null;
  }

  simulationEngine.setScenario(scenario);
  broadcast('STATUS_UPDATE', { scenario, isSimulating: scenario !== 'none' });
  res.json({ success: true, scenario });
});

// --------------------------------------------------------------------------
// START SERVER & DETECTOR
// --------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` DiskGuard AI Backend Local Agent running on port ${PORT}`);
  console.log(` REST API: http://localhost:${PORT}/api/health`);
  console.log(` WebSocket: ws://localhost:${PORT}/api/telemetry`);
  console.log(` Operating System: ${process.platform} (${process.arch})`);
  console.log(`====================================================`);

  // Start continuous dynamic device hot-plug polling
  deviceDetector.startHotPlugDetection(3000);
});
