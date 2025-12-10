# jj-evo-commit

> Turns everything in the current evolog into jj changes

A TypeScript CLI tool that parses `jj evolog` output and creates individual jj changes for each entry. Built with [gunshi](https://gunshi.dev) for modern CLI development and uses async/await for all operations.

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

This tool parses the output of `jj evolog` and creates a new jj change for each entry in the evolog, **recreating the actual file state** from each point in the change's evolution. Each new change will:

1. **Restore the exact file content** from that specific evolog commit
2. **Use the original description** from that point in time (or generate a meaningful one)
3. **Preserve the chronological order** of how the change evolved

Unlike just creating empty commits, this tool actually reproduces the state of your files at each step of the change's history, allowing you to see how your work progressed over time.

## Options

- `--dry-run, -n`: Show what would be done without making changes
- `--help, -h`: Show help information
- `--version, -v`: Show version information

## Development

This project uses:
- [gunshi](https://gunshi.dev) - Modern JavaScript CLI framework
- TypeScript for type safety
- tsx for running TypeScript files directly
- Async/await and Promise-based child process execution (no sync operations)
