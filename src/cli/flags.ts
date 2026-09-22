import { ModelTier } from '../types/index.js';

export interface CliFlags {
  model: string;
  tier: ModelTier | 'auto';
  session: string;
  dryRun: boolean;
  config?: string;
  help: boolean;
  version: boolean;
  initialPrompt?: string;
}

export function parseCliFlags(args: string[]): CliFlags {
  const flags: CliFlags = {
    model: 'auto',
    tier: 'auto',
    session: 'latest',
    dryRun: false,
    help: false,
    version: false,
  };

  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--version' || arg === '-v') {
      flags.version = true;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--model' || arg === '-m') {
      flags.model = args[++i] || 'auto';
    } else if (arg === '--tier' || arg === '-t') {
      const val = args[++i];
      if (val && ['free', 'budget', 'premium', 'auto'].includes(val)) {
        flags.tier = val as ModelTier | 'auto';
      } else {
        throw new Error(`Invalid tier: ${val}. Must be 'free', 'budget', 'premium', or 'auto'`);
      }
    } else if (arg === '--session' || arg === '-s') {
      flags.session = args[++i] || 'latest';
    } else if (arg === '--config' || arg === '-c') {
      flags.config = args[++i];
    } else if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    }
  }

  if (positionalArgs.length > 0) {
    flags.initialPrompt = positionalArgs.join(' ');
  }

  return flags;
}

export function printHelp(): void {
  console.log(`
jev-harness - AI Terminal User Interface Harness

Usage:
  jev-harness [options] [initial-prompt]

Options:
  -m, --model <id>       Override dynamic routing with a specific model ID
  -t, --tier <tier>      Restrict routing to tier: free, budget, premium, auto
  -s, --session <id>     Session ID to resume or 'new' to start fresh
      --dry-run          Test router without generating agent response
  -c, --config <path>    Path to custom configuration file
  -h, --help             Display this help message
  -v, --version          Show version number

Keyboard Shortcuts:
  Enter                  Submit prompt
  Ctrl+C                 Abort current generation / Exit if input is empty
  Ctrl+L                 Clear screen
`);
}
