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
    
    console.log(`Processing line: "${line}"`);
    
    // Match commit lines like: @  zxmrylrz rektide+scm@voodoowarez.com 2025-12-09 21:38:26 2b4dbc61
    const commitMatch = line.match(/^[@○]\s+(\w+)\s+(.+?)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([a-f0-9]+)/);
    if (commitMatch) {
      console.log(`  -> Commit match: hash=${commitMatch[4]}, author=${commitMatch[2]}, date=${commitMatch[3]}`);
      if (currentEntry.commitHash) {
        entries.push(currentEntry as EvologEntry);
      }
      currentEntry = {
        commitHash: commitMatch[4],
        author: commitMatch[2],
        date: commitMatch[3]
      };
    }
    
    // Match description lines like: │  (no description set) or    (empty) (no description set)
    const descMatch = line.match(/^\s*[│\s]\s+(.+)/);
    if (descMatch && currentEntry.commitHash) {
      const desc = descMatch[1].trim();
      console.log(`  -> Description match: "${desc}"`);
      if (desc !== '' && !desc.startsWith('--')) {
        currentEntry.description = desc;
      }
    }
    
    // Match operation lines first (before description lines) like: │  -- operation 3427fa914a32 snapshot working copy
    const opMatch = line.match(/^\s*[│\s]\s*--\s+operation\s+([a-f0-9]+)\s+(.+)/);
    if (opMatch && currentEntry.commitHash) {
      console.log(`  -> Operation match: "${opMatch[2].trim()}"`);
      currentEntry.operation = opMatch[2].trim();
      continue;
    }
  }
  
  // Add the last entry
  if (currentEntry.commitHash) {
    entries.push(currentEntry as EvologEntry);
  }
  
  return entries;
}

// Test with actual evolog output
try {
  const evologOutput = execSync('jj evolog', { encoding: 'utf8' });
  const entries = parseEvolog(evologOutput);
  
  console.log('\n=== PARSED ENTRIES ===');
  console.log(`Found ${entries.length} entries:`);
  entries.forEach((entry, i) => {
    console.log(`${i + 1}. Hash: ${entry.commitHash}`);
    console.log(`   Author: ${entry.author}`);
    console.log(`   Date: ${entry.date}`);
    console.log(`   Description: ${entry.description || 'none'}`);
    console.log(`   Operation: ${entry.operation || 'none'}`);
    console.log('');
  });
} catch (error) {
  console.error('Error:', error);
}