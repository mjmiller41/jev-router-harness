import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { MemoryItem } from '../types/index.js';

export interface MemoryStoreOptions {
  filePath?: string;
}

export interface IPersistentMemoryStore {
  set(
    item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>
  ): Promise<MemoryItem>;
  get(key: string): Promise<MemoryItem | null>;
  query(filter?: { category?: string; search?: string }): Promise<MemoryItem[]>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class PersistentMemoryStore implements IPersistentMemoryStore {
  private filePath: string;
  private memoryCache: Map<string, MemoryItem> = new Map();

  constructor(options: MemoryStoreOptions = {}) {
    if (options.filePath) {
      this.filePath = options.filePath;
    } else {
      const localDir = path.join(process.cwd(), '.jev');
      if (fs.existsSync(localDir)) {
        this.filePath = path.join(localDir, 'memory.json');
      } else {
        const configDir = path.join(os.homedir(), '.config', 'jev-router-harness');
        this.filePath = path.join(configDir, 'memory.json');
      }
    }

    this.ensureDirExists();
    this.loadFromDisk();
  }

  public async set(
    item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>
  ): Promise<MemoryItem> {
    const now = new Date().toISOString();
    const existing = this.memoryCache.get(item.key);

    const record: MemoryItem = {
      id: existing ? existing.id : crypto.randomUUID(),
      key: item.key,
      category: item.category,
      content: item.content,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      accessCount: existing ? existing.accessCount : 0,
      tags: item.tags || [],
    };

    this.memoryCache.set(item.key, record);
    this.saveToDiskAtomic();
    return record;
  }

  public async get(key: string): Promise<MemoryItem | null> {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    item.accessCount += 1;
    item.updatedAt = new Date().toISOString();
    this.saveToDiskAtomic();
    return item;
  }

  public async query(filter?: { category?: string; search?: string }): Promise<MemoryItem[]> {
    let items = Array.from(this.memoryCache.values());

    if (filter?.category) {
      items = items.filter((i) => i.category === filter.category);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return items;
  }

  public async delete(key: string): Promise<boolean> {
    const exists = this.memoryCache.has(key);
    if (exists) {
      this.memoryCache.delete(key);
      this.saveToDiskAtomic();
      return true;
    }
    return false;
  }

  public async clear(): Promise<void> {
    this.memoryCache.clear();
    this.saveToDiskAtomic();
  }

  private ensureDirExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadFromDisk(): void {
    if (!fs.existsSync(this.filePath)) {
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);
      if (typeof data === 'object' && data !== null) {
        for (const [key, val] of Object.entries(data)) {
          this.memoryCache.set(key, val as MemoryItem);
        }
      }
    } catch {
      // In case of error or empty file, initialize empty cache
      this.memoryCache.clear();
    }
  }

  private saveToDiskAtomic(): void {
    this.ensureDirExists();
    const dir = path.dirname(this.filePath);
    const tempFile = path.join(dir, `.memory-${crypto.randomUUID()}.tmp`);

    const obj: Record<string, MemoryItem> = {};
    for (const [k, v] of this.memoryCache.entries()) {
      obj[k] = v;
    }

    const payload = JSON.stringify(obj, null, 2);

    // 1. Write to temp file
    const fd = fs.openSync(tempFile, 'w');
    fs.writeFileSync(fd, payload, 'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);

    // 2. Atomic rename to target file
    fs.renameSync(tempFile, this.filePath);
  }
}

export const defaultMemoryStore = new PersistentMemoryStore();
