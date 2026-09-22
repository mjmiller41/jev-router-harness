import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TelemetryLogger } from '../../src/telemetry/logger.js';
import { TelemetryRecord } from '../../src/types/index.js';

describe('Telemetry Logger', () => {
  let tempDir: string;
  let logger: TelemetryLogger;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-log-test-'));
    logger = new TelemetryLogger({ logDir: tempDir });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('logs turn records to NDJSON file and reads them back', () => {
    const record: TelemetryRecord = {
      id: 'test-rec-1',
      sessionId: 'sess-123',
      turnIndex: 0,
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-flash',
      tier: 'free',
      inputTokens: 50,
      outputTokens: 120,
      decisionLatencyMs: 15,
      generationLatencyMs: 250,
      costUsd: 0.0,
      interrupted: false,
    };

    logger.logTurn(record);

    const readBack = logger.readRecords('sess-123');
    expect(readBack).toHaveLength(1);
    expect(readBack[0].model).toBe('gemini-2.5-flash');
    expect(readBack[0].costUsd).toBe(0.0);
  });

  it('filters records by session ID', () => {
    const rec1: TelemetryRecord = {
      id: '1',
      sessionId: 'sess-a',
      turnIndex: 0,
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-flash',
      tier: 'free',
      inputTokens: 10,
      outputTokens: 20,
      decisionLatencyMs: 10,
      generationLatencyMs: 100,
      costUsd: 0,
      interrupted: false,
    };
    const rec2: TelemetryRecord = {
      ...rec1,
      id: '2',
      sessionId: 'sess-b',
    };

    logger.logTurn(rec1);
    logger.logTurn(rec2);

    expect(logger.readRecords('sess-a')).toHaveLength(1);
    expect(logger.readRecords('sess-b')).toHaveLength(1);
    expect(logger.readRecords()).toHaveLength(2);
  });
});
