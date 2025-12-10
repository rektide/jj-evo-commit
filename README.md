# jj-evo-commit

> Turns everything in the current evolog into jj changes

A small tool that parses `jj evolog` output and creates individual jj changes for each entry.

## Install

(Publish coming soon)

```bash
git clone https://github.com/rektide/jj-evo-commit
cd jj-evo-commit
pnpm link
```

## `jj-evo-commit Usage`

```bash
# Run with dry run to see what would be created
jj-evo-commit.ts --dry-run

# Actually create changes for all evolog entries
jj-evo-commit
# Skip specific commits
jj-evo-commit --skip abc123def,xyz789abc
# Only process specific commits
jj-evo-commit --pick abc123def,xyz789abc
# Use change IDs instead of commit IDs
jj-evo-commit --pick nqmwswvq  # processes all commits in this change's evolution
```

This tool parses the output of `jj evolog` and creates a new jj change for each entry in the evolog, **recreating the actual file state** from each point in the change's evolution. Each new change will:

1. **Restore the exact file content** from that specific evolog commit
2. **Use the original description** from that point in time (or generate a meaningful one)
3. **Preserve the chronological order** of how the change evolved

Unlike just creating empty commits, this tool actually reproduces the state of your files at each step of the change's history, allowing you to see how your work progressed over time.

### Options

- `--dry-run, -n`: Show what would be done without making changes
- `--skip, -s <ids>`: Comma-separated list of commit IDs or change IDs to skip
- `--pick, -p <ids>`: Comma-separated list of commit IDs or change IDs to process (only these will be processed)
- `--help, -h`: Show help information
- `--version, -v`: Show version information

You can specify either **commit IDs** (short hashes like `abc123def`) or **change IDs** (like `xyz123abc...`) in either list.
