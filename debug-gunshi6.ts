#!/usr/bin/env node

import { cli } from 'gunshi';

const command = {
  name: 'test',
  description: 'Test gunshi argument parsing',
  args: {
    'dry-run': {
      type: 'boolean',
      short: 'n',
      description: 'Test dry run flag'
    }
  },
  run: async (ctx) => {
    console.log('Context values:', ctx.values);
    console.log('Dry run value:', ctx.values['dry-run']);
    console.log('Dry run value (camelCase):', ctx.values.dryRun);
  }
};

await cli(process.argv.slice(2), command);