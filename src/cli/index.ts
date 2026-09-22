#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { parseCliFlags, printHelp } from './flags.js';
import { App } from '../tui/App.js';
import { createRouter } from '../router/index.js';
import { EveAgentBridge } from '../agent/bridge.js';

async function main() {
  const flags = parseCliFlags(process.argv.slice(2));

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  if (flags.version) {
    console.log('jev-harness v1.0.0');
    process.exit(0);
  }

  const router = createRouter();
  const agentBridge = new EveAgentBridge();
  await agentBridge.initialize();

  const app = render(
    React.createElement(App, {
      router,
      agentBridge,
      initialModel: flags.model,
      initialTier: flags.tier,
      initialPrompt: flags.initialPrompt,
      dryRun: flags.dryRun,
    })
  );

  await app.waitUntilExit();
}

main().catch((err) => {
  console.error('Fatal error launching harness:', err);
  process.exit(1);
});
