import fs from 'node:fs/promises';
import path from 'node:path';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.jev']);

export interface ListFilesArgs {
  dirPath?: string;
  recursive?: boolean;
}

export const listFilesTool = {
  name: 'listFiles',
  description: 'List files and directories in the workspace',
  parameters: {
    dirPath: {
      type: 'string',
      description: 'Directory path relative to workspace root (default is .)',
      required: false,
    },
  },
  execute: async (args: Record<string, unknown>): Promise<{ files: string[]; count: number }> => {
    const targetDir = path.resolve(process.cwd(), (args.dirPath as string) || '.');
    // Ensure cannot escape workspace root
    if (!targetDir.startsWith(process.cwd())) {
      throw new Error('Access outside workspace directory is not allowed');
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      files.push(entry.isDirectory() ? `${entry.name}/` : entry.name);
    }

    return { files, count: files.length };
  },
};

export const readFileTool = {
  name: 'readFile',
  description: 'Read the text content of a file in the workspace',
  parameters: {
    filePath: {
      type: 'string',
      description: 'Path of the file relative to workspace root',
      required: true,
    },
    maxLines: {
      type: 'number',
      description: 'Maximum number of lines to read (default 200)',
      required: false,
    },
  },
  execute: async (
    args: Record<string, unknown>
  ): Promise<{ content: string; lines: number; path: string }> => {
    const rawPath = (args.filePath || args.path) as string;
    if (!rawPath) {
      throw new Error('filePath parameter is required');
    }

    const targetFile = path.resolve(process.cwd(), rawPath);
    if (!targetFile.startsWith(process.cwd())) {
      throw new Error('Access outside workspace directory is not allowed');
    }

    const content = await fs.readFile(targetFile, 'utf8');
    const lines = content.split('\n');
    const max = (args.maxLines as number) || 200;
    const truncated = lines.slice(0, max).join('\n');

    return {
      content: truncated,
      lines: lines.length,
      path: rawPath,
    };
  },
};

export const searchFilesTool = {
  name: 'searchFiles',
  description: 'Search for a string pattern across files in the workspace',
  parameters: {
    query: {
      type: 'string',
      description: 'Text string or pattern to search for',
      required: true,
    },
  },
  execute: async (
    args: Record<string, unknown>
  ): Promise<{ matches: Array<{ file: string; line: number; text: string }> }> => {
    const query = String(args.query || '').toLowerCase();
    if (!query) return { matches: [] };

    const matches: Array<{ file: string; line: number; text: string }> = [];

    async function searchDir(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await searchDir(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx|json|md)$/.test(entry.name)) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(query)) {
              const rel = path.relative(process.cwd(), fullPath);
              matches.push({ file: rel, line: i + 1, text: lines[i].trim() });
              if (matches.length >= 25) return;
            }
          }
        }
      }
    }

    await searchDir(process.cwd());
    return { matches };
  },
};
