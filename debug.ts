#!/usr/bin/env node

import { execSync } from 'child_process';

interface EvologEntry {
  commitHash: string;
  author: string;
  date: string;
  description: string;
  operation: string;
}

function parseEvolog(output: string): EvologEntry[] {
  const entries: EvologEntry[] = [];
  const lines = output.split('\n');
  
  let currentEntry: Partial<EvologEntry> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') continue;
    
    // Match commit lines like: @  zxmrylrz rektide+scm@voodoowarez.com 2025-12-09 21:38:26 2b4dbc61
    const commitMatch = line.match(/^[@○]\s+(\w+)\s+(.+?)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([a-f0-9]+)/);
    if (commitMatch) {
      if (currentEntry.commitHash) {
        entries.push(currentEntry as EvologEntry);
      }
      currentEntry = {
        commitHash: commitMatch[4],
        author: commitMatch[2],
        date: commitMatch[3]
      };
      continue;
    }
    
    // Match operation lines first (before description lines) like: │  -- operation 3427fa914a32 snapshot working copy
    const opMatch = line.match(/^\s*[│\s]\s*--\s+operation\s+([a-f0-9]+)\s+(.+)/);
    if (opMatch && currentEntry.commitHash) {
      currentEntry.operation = opMatch[2].trim();
      continue;
    }
    
    // Match description lines like: │  (no description set) or    (empty) (no description set)
    const descMatch = line.match(/^\s*[│\s]\s+(.+)/);
    if (descMatch && currentEntry.commitHash) {
      const desc = descMatch[1].trim();
      if (desc !== '' && !desc.startsWith('--')) {
        currentEntry.description = desc;
      }
    }
  }
  
  // Add the last entry
  if (currentEntry.commitHash) {
    entries.push(currentEntry as EvologEntry);
  }
  
  return entries;
}

function createChangeForEntry(entry: EvologEntry): void {
  try {
    // Create a meaningful description for the change
    let description: string;
    
    console.log(`DEBUG: entry.description = "${entry.description}"`);
    console.log(`DEBUG: entry.operation = "${entry.operation}"`);
    
    if (entry.description && entry.description !== '(no description set)' && entry.description !== '(empty) (no description set)') {
      description = entry.description;
    } else if (entry.operation) {
      description = `Evolog: ${entry.operation}`;
    } else {
      description = `Evolog entry from ${entry.date}`;
    }
    
    console.log(`Creating change for commit ${entry.commitHash}: ${description}`);
    
    // Use jj to create a new change
    execSync(`jj new -m "${description}"`, { stdio: 'inherit' });
    
    console.log(`✓ Created change for ${entry.commitHash}`);
  } catch (error) {
    console.error(`✗ Failed to create change for ${entry.commitHash}:`, error);
  }
}

// Test with actual evolog output
try {
  const evologOutput = execSync('jj evolog', { encoding: 'utf8' });
  const entries = parseEvolog(evologOutput);
  
  console.log('\n=== TESTING CHANGE CREATION ===');
  const firstEntry = entries[0];
  if (firstEntry) {
    createChangeForEntry(firstEntry);
  }
  
} catch (error) {
  console.error('Error:', error);
}