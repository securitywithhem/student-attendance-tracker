#!/usr/bin/env node
// PreToolUse guard: blocks force-push, rm -rf outside the project, and edits to .env.
// Exit code 2 blocks the tool call and shows stderr to Claude.
const path = require('path');

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const tool = input.tool_name;
  const ti = input.tool_input || {};

  const block = (msg) => {
    process.stderr.write(`Blocked by project guard: ${msg}\n`);
    process.exit(2);
  };

  if (tool === 'Bash') {
    const cmd = String(ti.command || '');
    if (/git\s+push\b[^\n]*(--force\b|--force-with-lease\b|\s-f\b)/.test(cmd)) {
      block('git push --force is not allowed. Ask the user first.');
    }
    const rm = cmd.match(/rm\s+-[a-zA-Z]*r[a-zA-Z]*f?[a-zA-Z]*\s+([^;&|]+)/);
    if (rm) {
      const targets = rm[1].trim().split(/\s+/);
      for (const t of targets) {
        const clean = t.replace(/^["']|["']$/g, '');
        const abs = path.resolve(projectDir, clean.replace(/^~/, process.env.HOME || '~'));
        if (!abs.startsWith(path.resolve(projectDir) + path.sep)) {
          block(`rm -r outside the project (${clean}) is not allowed.`);
        }
      }
    }
  }

  if (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') {
    const base = path.basename(String(ti.file_path || ''));
    if (base === '.env' || (base.startsWith('.env.') && base !== '.env.example')) {
      block('editing .env files is not allowed. Edit .env.example instead.');
    }
  }
  process.exit(0);
});
