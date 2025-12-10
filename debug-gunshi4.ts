#!/usr/bin/env node

import { cli } from 'gunshi';

const command = {
  name: 'test',
  description: 'Test gunshi argument parsing',
  run: async (ctx) => {
    console.log('Full context:', JSON.stringify(ctx, null, 2));
    
    // Check if any unknown options were passed
    if (ctx.tokens && ctx.tokens.length > 0) {
      console.log('Unknown tokens:', ctx.tokens);
    }
    
    // Try to manually parse the arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-n');
    console.log('Manual dry run check:', dryRun);
  }
};

await cli(process.argv.slice(2), command);