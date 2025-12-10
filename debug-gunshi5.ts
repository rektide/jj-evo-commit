#!/usr/bin/env node

import { cli } from 'gunshi';

const command = {
  name: 'test',
  description: 'Test gunshi argument parsing',
  args: {
    dryRun: {
      type: 'boolean',
      short: 'n',
      description: 'Test dry run flag'
    }
  },
  run: async (ctx) => {
    console.log('Full context keys:', Object.keys(ctx));
    console.log('Context args:', ctx.args);
    console.log('Context values:', ctx.values);
    console.log('Dry run value:', ctx.values?.dryRun);
    
    // Check if any unknown options were passed
    if (ctx.tokens && ctx.tokens.length > 0) {
      console.log('Unknown tokens:', ctx.tokens);
    }
  }
};

await cli(process.argv.slice(2), command);