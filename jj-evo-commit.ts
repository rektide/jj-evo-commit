#!/usr/bin/env node

import { exec } from "child_process"
import { promisify } from "util"
import { cli } from "gunshi"

const execAsync = promisify(exec)

function parseIdList(idString: string | undefined): Set<string> {
	if (!idString) return new Set()
	return new Set(
		idString
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id.length > 0),
	)
}

function shouldProcessEntry(
	entry: EvologEntry,
	skipIds: Set<string>,
	pickIds: Set<string>,
): boolean {
	// If pick list is specified, only process entries in the pick list
	if (pickIds.size > 0) {
		return pickIds.has(entry.commitHash) || pickIds.has(entry.changeId || "")
	}

	// If skip list is specified, skip entries in the skip list
	if (skipIds.size > 0) {
		return !skipIds.has(entry.commitHash) && !skipIds.has(entry.changeId || "")
	}

	// If neither skip nor pick is specified, process all entries
	return true
}

interface EvologEntry {
	commitHash: string
	author: string
	date: string
	description: string
	operation: string
}

function parseEvolog(output: string): EvologEntry[] {
	const entries: EvologEntry[] = []
	const lines = output.split("\n")

	let currentEntry: Partial<EvologEntry> = {}

	for (const line of lines) {
		const trimmedLine = line.trim()
		if (trimmedLine === "") continue

		// Match commit lines like: @	zxmrylrz rektide+scm@voodoowarez.com 2025-12-09 21:38:26 2b4dbc61
		const commitMatch = line.match(
			/^[@○]\s+(\w+)\s+(.+?)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([a-f0-9]+)/,
		)
		if (commitMatch) {
			if (currentEntry.commitHash) {
				entries.push(currentEntry as EvologEntry)
			}
			currentEntry = {
				commitHash: commitMatch[4],
				author: commitMatch[2],
				date: commitMatch[3],
			}
			continue
		}

		// Match operation lines first (before description lines) like: │	-- operation 3427fa914a32 snapshot working copy
		const opMatch = line.match(/^\s*[│\s]\s*--\s+operation\s+([a-f0-9]+)\s+(.+)/)
		if (opMatch && currentEntry.commitHash) {
			currentEntry.operation = opMatch[2].trim()
			continue
		}

		// Match description lines like: │	(no description set) or		(empty) (no description set)
		const descMatch = line.match(/^\s*[│\s]\s+(.+)/)
		if (descMatch && currentEntry.commitHash) {
			const desc = descMatch[1].trim()
			if (desc !== "" && !desc.startsWith("--")) {
				currentEntry.description = desc
			}
		}
	}

	// Add the last entry
	if (currentEntry.commitHash) {
		entries.push(currentEntry as EvologEntry)
	}

	return entries
}

async function recreateEvologState(
	entry: EvologEntry,
	commitHash: string,
	isFirst: boolean,
): Promise<void> {
	try {
		// Create a meaningful description for the change
		let description: string

		if (
			entry.description &&
			entry.description !== "(no description set)" &&
			entry.description !== "(empty) (no description set)"
		) {
			description = entry.description
		} else if (entry.operation) {
			description = `Evolog: ${entry.operation}`
		} else {
			description = `Evolog entry from ${entry.date}`
		}

		console.log(`Recreating state from commit ${commitHash}: ${description}`)

		// Create a new commit - first one uses specific base, others use @-
		let newCommand: string
		if (isFirst) {
			newCommand = `jj new ${commitHash}- -m "${description}"`
		} else {
			newCommand = `jj new -m "${description}"`
		}

		const { stdout: newStdout, stderr: newStderr } = await execAsync(newCommand)

		if (newStdout && newStdout.trim()) {
			process.stdout.write(newStdout)
		}
		if (newStderr && newStderr.trim()) {
			process.stderr.write(newStderr)
		}

		// Restore the state from the evolog commit
		const { stdout: restoreStdout, stderr: restoreStderr } = await execAsync(
			`jj restore --from ${commitHash}`,
		)

		if (restoreStdout && restoreStdout.trim()) {
			process.stdout.write(restoreStdout)
		}
		if (restoreStderr && restoreStderr.trim()) {
			process.stderr.write(restoreStderr)
		}

		console.log(`✓ Recreated state from ${commitHash}`)
	} catch (error) {
		console.error(`✗ Failed to recreate state from ${commitHash}:`, error)
		throw error // Re-throw to be handled by caller
	}
}

const command = {
	name: "jj-evo-commit",
	description: "Turns everything in the current evolog into jj changes",
	args: {
		"dry-run": {
			type: "boolean",
			short: "n",
			description: "Show what would be done without making changes",
		},
		skip: {
			type: "string",
			short: "s",
			description: "Comma-separated list of commit IDs or change IDs to skip",
		},
		pick: {
			type: "string",
			short: "p",
			description:
				"Comma-separated list of commit IDs or change IDs to process (only these will be processed)",
		},
	},
	run: async (ctx) => {
		const dryRun = ctx.values["dry-run"]

		try {
			// Get the evolog output in chronological order (oldest first)
			const { stdout: evologOutput, stderr: evologStderr } = await execAsync("jj evolog --reversed")

			// Show any warnings from jj evolog
			if (evologStderr && evologStderr.trim()) {
				console.warn("jj evolog warnings:", evologStderr)
			}

			// Parse the evolog entries
			const entries = parseEvolog(evologOutput)

			if (entries.length === 0) {
				console.log("No evolog entries found.")
				return
			}

			console.log(`Found ${entries.length} evolog entries to process in chronological order.`)

			if (dryRun) {
				console.log("Dry run mode - showing what would be created:")

				// Process each entry for dry run
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i]
					const isFirst = i === 0
					const baseCommit = isFirst ? `${entry.commitHash}-` : "@-"

					// Create the same description logic as in restoreAndCreateChange
					let description: string
					if (
						entry.description &&
						entry.description !== "(no description set)" &&
						entry.description !== "(empty) (no description set)"
					) {
						description = entry.description
					} else if (entry.operation) {
						description = `Evolog: ${entry.operation}`
					} else {
						description = `Evolog entry from ${entry.date}`
					}
					console.log(
						`Would recreate state from ${entry.commitHash} (base: ${baseCommit}): ${description}`,
					)
				}
			} else {
				// Process each entry for real - in chronological order
				let successCount = 0
				let errorCount = 0

				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i]
					const isFirst = i === 0

					try {
						await recreateEvologState(entry, entry.commitHash, isFirst)
						successCount++
					} catch (error) {
						errorCount++
						// Error already logged in recreateEvologState
					}
				}

				if (errorCount > 0) {
					console.log(`\nCompleted with ${successCount} successes and ${errorCount} errors.`)
				} else {
					console.log("\nDone! All evolog entries have been processed.")
				}
			}
		} catch (error) {
			console.error("Error processing evolog:", error)
			process.exit(1)
		}
	},
}

// Run the CLI
await cli(process.argv.slice(2), command, {
	name: "jj-evo-commit",
	version: "1.0.0",
	description: "Turns everything in the current evolog into jj changes",
})
