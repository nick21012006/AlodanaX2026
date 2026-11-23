#!/usr/bin/env node
/**
 * ALODANAX TechFest - Shared Code Synchronizer
 * 
 * Synchronizes the 4 canonical shared blocks from index.html (Single Source of Truth)
 * across all subpages: events.html, hackathon.html,
 * team.html, contact.html.
 * 
 * Shared Blocks:
 * 1. SHARED:BASE-CSS
 * 2. SHARED:DATA-SITE
 * 3. SHARED:DATA-EVENTS (only copied to pages that declare this marker)
 * 4. SHARED:COMPONENTS
 * 
 * Zero dependencies. Exits 0 on success, 1 on error.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SOURCE_FILE = path.join(rootDir, 'index.html');
const TARGET_FILES = [
  'events.html',
  'hackathon.html',
  'team.html',
  'contact.html'
].map(f => path.join(rootDir, f));

const SHARED_BLOCKS = [
  { key: 'BASE-CSS', requiredInTarget: true },
  { key: 'DATA-SITE', requiredInTarget: true },
  { key: 'DATA-EVENTS', requiredInTarget: false }, // Only events, hackathon, contact
  { key: 'COMPONENTS', requiredInTarget: true }
];

function getBlockRegex(key) {
  const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(
    `(/\\*\\s*====\\s*SHARED:${escapedKey}\\s*START\\s*====\\s*\\*/)([\\s\\S]*?)(/\\*\\s*====\\s*SHARED:${escapedKey}\\s*END\\s*====\\s*\\*/)`
  );
}

function sync() {
  console.log('--- ALODANAX Shared Block Synchronizer ---');

  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`Error: Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const extractedBlocks = {};

  // Extract from index.html
  for (const block of SHARED_BLOCKS) {
    const rx = getBlockRegex(block.key);
    const match = sourceContent.match(rx);
    if (!match) {
      console.error(`Error: Missing shared block in source (index.html): SHARED:${block.key}`);
      process.exit(1);
    }
    extractedBlocks[block.key] = match[2]; // The inner content
  }

  console.log('v Successfully extracted 4 shared blocks from index.html:');
  for (const block of SHARED_BLOCKS) {
    console.log(`  - SHARED:${block.key} (${extractedBlocks[block.key].trim().length} chars)`);
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const targetPath of TARGET_FILES) {
    const relName = path.relative(rootDir, targetPath);
    if (!fs.existsSync(targetPath)) {
      console.warn(`Warning: Target file not found, skipping: ${relName}`);
      continue;
    }

    let targetContent = fs.readFileSync(targetPath, 'utf-8');
    let fileChanged = false;

    for (const block of SHARED_BLOCKS) {
      const rx = getBlockRegex(block.key);
      if (rx.test(targetContent)) {
        const replacement = `$1${extractedBlocks[block.key]}$3`;
        const newContent = targetContent.replace(rx, replacement);
        if (newContent !== targetContent) {
          targetContent = newContent;
          fileChanged = true;
        }
      } else if (block.requiredInTarget) {
        console.error(`Error: Required block marker missing in ${relName}: SHARED:${block.key}`);
        process.exit(1);
      }
    }

    if (fileChanged) {
      fs.writeFileSync(targetPath, targetContent, 'utf-8');
      console.log(`  [UPDATED] ${relName}`);
      updatedCount++;
    } else {
      console.log(`  [IN-SYNC] ${relName}`);
      skippedCount++;
    }
  }

  console.log(`\nSynchronization Complete: ${updatedCount} updated, ${skippedCount} already in sync.`);
  process.exit(0);
}

sync();

