#!/usr/bin/env node

import { cli } from 'gunshi';

const command = {
  name: 'test',
  description: 'Test gunshi argument parsing',
  options: {
    dryRun: {
      type: 'boolean',
      short: 'n',
      description: 'Test dry run flag'
    }
  },
  run: async (ctx) => {
    console.log('Full context:', JSON.stringify(ctx, null, 2));
    console.log('Context values:', ctx.values);
    console.log('Dry run value:', ctx.values.dryRun);
    console.log('Arguments:', process.argv.slice(2));
  }
};

await cli(process.argv.slice(2), command);