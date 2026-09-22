import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const runCommandTool = {
  name: 'runCommand',
  description: 'Execute a read-only shell command in the repository workspace',
  parameters: {
    command: {
      type: 'string',
      description: 'The shell command to run (e.g. "git status", "ls -la")',
      required: true,
    },
  },
  execute: async (
    args: Record<string, unknown>
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    const cmd = String(args.command || '').trim();
    if (!cmd) {
      throw new Error('command parameter is required');
    }

    // Safety checks against hazardous destructive commands
    const blockedKeywords = ['rm -rf /', ':(){ :|:& };:', 'mkfs', 'dd if='];
    for (const blocked of blockedKeywords) {
      if (cmd.includes(blocked)) {
        throw new Error(`Command rejected for safety: dangerous sequence detected`);
      }
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: process.cwd(),
        timeout: 10000,
        maxBuffer: 1024 * 512,
      });
      return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: (err.stdout || '').trim(),
        stderr: (err.stderr || err.message || '').trim(),
        exitCode: err.code || 1,
      };
    }
  },
};
