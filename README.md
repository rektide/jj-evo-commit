# jj-evo-commit

> Turns everything in the current evolog into jj changes

A TypeScript CLI tool that parses `jj evolog` output and creates individual jj changes for each entry. Built with [gunshi](https://gunshi.dev) for modern CLI development and uses async/await for all operations.

## Usage

```bash
# Run with dry run to see what would be created
npx tsx jj-evo-commit.ts --dry-run

# Actually create changes for all evolog entries
npx tsx jj-evo-commit.ts

# Skip specific commits
npm run dev -- --skip abc123def,xyz789abc

# Only process specific commits
npm run dev -- --pick abc123def,xyz789abc

# Use change IDs instead of commit IDs
npm run dev -- --pick nqmwswvq  # processes all commits in this change's evolution

# Combine skip and pick (pick takes precedence)
npm run dev -- --pick abc123 --skip abc123,def456

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
- `--skip, -s <ids>`: Comma-separated list of commit IDs or change IDs to skip
- `--pick, -p <ids>`: Comma-separated list of commit IDs or change IDs to process (only these will be processed)
- `--help, -h`: Show help information
- `--version, -v`: Show version information

### Skip vs Pick

- **Skip**: Process all evolog entries except those specified
- **Pick**: Only process the specified evolog entries (takes precedence over skip)
- **Both**: You can use both together - pick takes precedence if there's overlap

You can specify either **commit IDs** (short hashes like `abc123def`) or **change IDs** (like `xyz123abc...`) in either list.

## Development

This project uses:
- [gunshi](https://gunshi.dev) - Modern JavaScript CLI framework
- TypeScript for type safety
- tsx for running TypeScript files directly
- Async/await and Promise-based child process execution (no sync operations)
