# jj-evo-commit

> Turns everything in the current evolog into jj changes

## Usage

```bash
# Run with dry run to see what would be created
npx tsx jj-evo-commit.ts --dry-run

# Actually create changes for all evolog entries
npx tsx jj-evo-commit.ts

# Or use npm scripts
npm run dev -- --dry-run
npm run dev
```

## What it does

This tool parses the output of `jj evolog` and creates a new jj change for each entry in the evolog. Each change will have a meaningful description based on:

1. The original description if it exists and isn't "(no description set)"
2. The operation description (e.g., "Evolog: snapshot working copy")
3. A fallback to "Evolog entry from [date]"

## Options

- `--dry-run, -n`: Show what would be done without making changes
- `--help, -h`: Show help information
- `--version, -V`: Show version information
