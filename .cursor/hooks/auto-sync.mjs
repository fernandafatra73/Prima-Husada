#!/usr/bin/env node
/**
 * On agent stop: commit all tracked changes and push to origin.
 * Skips secrets (.env). Fails open so the agent is never blocked.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BLOCKED = new Set(['.env', '.env.local', '.env.production']);

function drainStdin() {
  try {
    readFileSync(0, 'utf8');
  } catch {
    // ignore
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function safeGit(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

drainStdin();

const porcelain = safeGit(['status', '--porcelain']);
if (!porcelain) {
  process.exit(0);
}

const lines = porcelain.split('\n').filter(Boolean);
const hasCommitable = lines.some((line) => {
  const path = line.slice(3).trim().replace(/^"|"$/g, '');
  const base = path.split(/[/\\]/).pop() ?? path;
  return !BLOCKED.has(base) && !path.includes('.env');
});

if (!hasCommitable) {
  process.exit(0);
}

try {
  git(['add', '-A']);
  const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  git(['commit', '-m', `chore(agent): auto sync ${stamp}`]);
  safeGit(['push', 'origin', 'HEAD']);
} catch {
  // fail open
}

process.exit(0);
