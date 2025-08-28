import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TIMEOUT = 30000;

test('CLI supports --file JSON and prints coordinates', { timeout: TIMEOUT }, async () => {
  const cli = resolve(__dirname, '../dist/cli.js');
  const jsonPath = resolve(__dirname, 'addresses.he.json');

  const proc = spawn(process.execPath, [cli, '--file', jsonPath], { stdio: ['ignore', 'pipe', 'pipe'] });

  let out = '';
  for await (const chunk of proc.stdout) out += chunk.toString();

  const exit = await new Promise(resolveExit => proc.on('close', code => resolveExit(code)));
  assert.equal(exit, 0, `CLI exited with ${exit}: ${out}`);

  // Expect e.g. "Coordinates: 32.16..., 34.83..."
  assert.match(out, /Coordinates:\s*-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?/);
});
