#!/usr/bin/env node
// PostToolUse: after a JS file is written/edited, lint it and run the related unit tests.
// Exit code 2 feeds the failure output back to Claude (it does not undo the edit).
const { spawnSync } = require('child_process');
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
  const file = (input.tool_input && input.tool_input.file_path) || '';
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (!file.endsWith('.js') || !path.resolve(file).startsWith(path.resolve(projectDir))) {
    process.exit(0);
  }
  if (file.includes(`${path.sep}node_modules${path.sep}`)) process.exit(0);

  const run = (args) =>
    spawnSync('npx', args, {
      cwd: projectDir,
      encoding: 'utf8',
      shell: false,
      timeout: 120000,
      env: { ...process.env, NODE_OPTIONS: '--experimental-vm-modules' },
    });

  const lint = run(['eslint', '--no-warn-ignored', file]);
  const tests = run([
    'jest',
    '--findRelatedTests',
    file,
    '--passWithNoTests',
    '--testPathPatterns',
    'tests/unit',
    '--silent',
  ]);

  const problems = [];
  if (lint.status !== 0) problems.push(`ESLint:\n${lint.stdout}${lint.stderr}`);
  if (tests.status !== 0) problems.push(`Related unit tests failed:\n${tests.stderr.slice(-3000)}`);
  if (problems.length) {
    process.stderr.write(problems.join('\n\n'));
    process.exit(2);
  }
  process.exit(0);
});
