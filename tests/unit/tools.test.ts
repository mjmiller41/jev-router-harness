import { describe, it, expect } from 'vitest';
import { listFilesTool, readFileTool, searchFilesTool } from '../../src/agent/tools/filesystem.js';
import { runCommandTool } from '../../src/agent/tools/command.js';

describe('Workspace Tools', () => {
  describe('listFilesTool', () => {
    it('lists directory contents in workspace', async () => {
      const res = await listFilesTool.execute({ dirPath: '.' });
      expect(res.count).toBeGreaterThan(0);
      expect(res.files).toContain('package.json');
    });

    it('rejects path traversal outside workspace', async () => {
      await expect(listFilesTool.execute({ dirPath: '../../../../etc' })).rejects.toThrow(
        /Access outside workspace/
      );
    });
  });

  describe('readFileTool', () => {
    it('reads existing file content', async () => {
      const res = await readFileTool.execute({ filePath: 'package.json' });
      expect(res.lines).toBeGreaterThan(0);
      expect(res.content).toContain('jev-router-harness');
    });

    it('limits output lines when maxLines is specified', async () => {
      const res = await readFileTool.execute({ filePath: 'package.json', maxLines: 5 });
      expect(res.content.split('\n').length).toBeLessThanOrEqual(5);
    });

    it('throws when filePath is missing or outside workspace', async () => {
      await expect(readFileTool.execute({})).rejects.toThrow(/filePath parameter is required/);
      await expect(readFileTool.execute({ filePath: '../../../etc/passwd' })).rejects.toThrow(
        /Access outside workspace/
      );
    });
  });

  describe('searchFilesTool', () => {
    it('finds matching pattern across codebase', async () => {
      const res = await searchFilesTool.execute({ query: 'typesafe-ai' });
      expect(res.matches.length).toBeGreaterThan(0);
      expect(res.matches[0].file).toBeDefined();
    });

    it('returns empty matches on empty query', async () => {
      const res = await searchFilesTool.execute({ query: '' });
      expect(res.matches).toEqual([]);
    });
  });

  describe('runCommandTool', () => {
    it('executes safe shell command', async () => {
      const res = await runCommandTool.execute({ command: 'echo "test command execution"' });
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toBe('test command execution');
    });

    it('rejects dangerous command keywords', async () => {
      await expect(runCommandTool.execute({ command: 'rm -rf /' })).rejects.toThrow(
        /dangerous sequence/
      );
    });

    it('rejects empty command', async () => {
      await expect(runCommandTool.execute({ command: '' })).rejects.toThrow(
        /command parameter is required/
      );
    });

    it('handles failing commands gracefully', async () => {
      const res = await runCommandTool.execute({ command: 'false' });
      expect(res.exitCode).not.toBe(0);
    });
  });
});
