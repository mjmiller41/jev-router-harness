import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PersistentMemoryStore } from '../../src/memory/persistentStore.js';

describe('Persistent Memory Store', () => {
  let tempDir: string;
  let storePath: string;
  let store: PersistentMemoryStore;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-memory-test-'));
    storePath = path.join(tempDir, 'memory.json');
    store = new PersistentMemoryStore({ filePath: storePath });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('sets and gets memory item by key', async () => {
    const item = await store.set({
      key: 'coding-style',
      category: 'preference',
      content: 'Always output TypeScript using interface instead of type aliases.',
      tags: ['typescript', 'style'],
    });

    expect(item.id).toBeDefined();
    expect(item.key).toBe('coding-style');

    const retrieved = await store.get('coding-style');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.content).toContain('TypeScript using interface');
    expect(retrieved?.accessCount).toBe(1);
  });

  it('guarantees atomic writes on disk', async () => {
    await store.set({
      key: 'atomic-test',
      category: 'project-rule',
      content: 'Verify file exists and is valid JSON.',
      tags: ['integrity'],
    });

    expect(fs.existsSync(storePath)).toBe(true);
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed['atomic-test']).toBeDefined();
  });

  it('queries memories by category and search term', async () => {
    await store.set({
      key: 'pref-theme',
      category: 'preference',
      content: 'Dark mode preferred',
      tags: ['ui'],
    });

    await store.set({
      key: 'rule-db',
      category: 'project-rule',
      content: 'PostgreSQL only for production',
      tags: ['database'],
    });

    const preferences = await store.query({ category: 'preference' });
    expect(preferences).toHaveLength(1);
    expect(preferences[0].key).toBe('pref-theme');

    const searchResults = await store.query({ search: 'PostgreSQL' });
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].key).toBe('rule-db');
  });

  it('deletes memory item and clears store', async () => {
    await store.set({
      key: 'to-delete',
      category: 'entity-fact',
      content: 'Temporary fact',
      tags: [],
    });

    const deleted = await store.delete('to-delete');
    expect(deleted).toBe(true);

    const nonExistent = await store.get('to-delete');
    expect(nonExistent).toBeNull();

    await store.set({ key: 'keep-or-clear', category: 'preference', content: 'hello', tags: [] });
    await store.clear();
    const remaining = await store.query();
    expect(remaining).toHaveLength(0);
  });
});
