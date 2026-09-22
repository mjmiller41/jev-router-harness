import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TelemetryRecord } from '../types/index.js';

export interface LoggerOptions {
  logDir?: string;
  enableConsole?: boolean;
}

export class TelemetryLogger {
  private logFilePath: string;
  private enableConsole: boolean;

  constructor(options: LoggerOptions = {}) {
    const baseDir =
      options.logDir ||
      process.env.JEV_LOG_DIR ||
      path.join(os.homedir(), '.config', 'jev-router-harness', 'logs');

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    this.logFilePath = path.join(baseDir, 'telemetry.ndjson');
    this.enableConsole = options.enableConsole ?? false;
  }

  public logTurn(record: TelemetryRecord): void {
    const line = JSON.stringify(record) + '\n';
    try {
      fs.appendFileSync(this.logFilePath, line, 'utf8');
    } catch (err) {
      if (this.enableConsole) {
        console.error('Failed to append to telemetry log:', err);
      }
    }

    if (this.enableConsole) {
      console.log(
        `[Telemetry] Turn ${record.turnIndex} | Model: ${record.model} (${record.tier}) | Tokens: In=${record.inputTokens}, Out=${record.outputTokens} | Cost: $${record.costUsd.toFixed(4)} | Latency: ${record.generationLatencyMs}ms`
      );
    }
  }

  public readRecords(sessionId?: string): TelemetryRecord[] {
    if (!fs.existsSync(this.logFilePath)) {
      return [];
    }

    const content = fs.readFileSync(this.logFilePath, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const records: TelemetryRecord[] = [];

    for (const line of lines) {
      try {
        const record = JSON.parse(line) as TelemetryRecord;
        if (!sessionId || record.sessionId === sessionId) {
          records.push(record);
        }
      } catch {
        // Skip malformed lines
      }
    }

    return records;
  }

  public getLogFilePath(): string {
    return this.logFilePath;
  }
}

export const defaultLogger = new TelemetryLogger();
