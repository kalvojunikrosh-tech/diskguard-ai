import { EventEmitter } from 'events';

export class SimulationEngine extends EventEmitter {
  constructor() {
    super();
    this.scenario = 'none'; // 'none' | 'normal' | 'ransomware' | 'mass-rename' | 'high-entropy'
    this.timer = null;
    this.step = 0;
  }

  setScenario(scenario) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.scenario = scenario;
    this.step = 0;

    if (scenario === 'none') {
      this.emit('scenario_changed', { scenario: 'none', active: false });
      return;
    }

    this.emit('scenario_changed', { scenario, active: true });

    // Generate periodic synthetic telemetry events
    this.timer = setInterval(() => {
      this.step++;
      const events = this.generateSyntheticEvents(scenario, this.step);
      events.forEach(ev => this.emit('simulation_event', ev));
    }, 1000);
  }

  generateSyntheticEvents(scenario, step) {
    const now = new Date().toISOString();
    const mockDeviceId = 'simulated_drive';

    if (scenario === 'normal') {
      return [
        {
          timestamp: now,
          deviceId: mockDeviceId,
          eventType: 'MODIFY',
          path: `/Volumes/SimulatedDisk/Documents/report_${step % 10}.docx`,
          size: 45000 + Math.floor(Math.random() * 5000),
          processId: 1042,
          processName: 'word.exe'
        },
        {
          timestamp: now,
          deviceId: mockDeviceId,
          eventType: 'READ',
          path: `/Volumes/SimulatedDisk/Photos/img_${step % 20}.jpg`,
          size: 1200000,
          processId: 1088,
          processName: 'preview.app'
        }
      ];
    }

    if (scenario === 'ransomware') {
      const burstEvents = [];
      for (let i = 0; i < 15; i++) {
        burstEvents.push({
          timestamp: now,
          deviceId: mockDeviceId,
          eventType: 'RENAME',
          path: `/Volumes/SimulatedDisk/Data/financial_records_${step}_${i}.pdf.locked`,
          size: 500000 + i * 1024,
          processId: 9941,
          processName: 'unknown_payload.exe'
        });
      }
      return burstEvents;
    }

    if (scenario === 'mass-rename') {
      const renameEvents = [];
      for (let i = 0; i < 10; i++) {
        renameEvents.push({
          timestamp: now,
          deviceId: mockDeviceId,
          eventType: 'RENAME',
          path: `/Volumes/SimulatedDisk/Archive/backup_${step}_${i}.zip.enc`,
          size: 800000,
          processId: 4421,
          processName: 'batch_renamer.exe'
        });
      }
      return renameEvents;
    }

    if (scenario === 'high-entropy') {
      const entropyEvents = [];
      for (let i = 0; i < 12; i++) {
        entropyEvents.push({
          timestamp: now,
          deviceId: mockDeviceId,
          eventType: 'MODIFY',
          path: `/Volumes/SimulatedDisk/Database/chunk_${step}_${i}.dat`,
          size: 4096000,
          processId: 8812,
          processName: 'cipher_stream.exe'
        });
      }
      return entropyEvents;
    }

    return [];
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.scenario = 'none';
  }
}
