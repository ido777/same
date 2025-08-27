import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';

const TIMEOUT = 60000;

/**
 * Helper to spawn the CLI, feed it input lines, and capture all output.
 * @param {string[]} inputs Lines to send to stdin.
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string }>}
 */
function runCli(inputs) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['dist/cli.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
    proc.on('error', reject);
    proc.on('close', code => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });
    // Feed inputs with newlines.  Use a small delay to mimic typing.
    proc.stdin.setDefaultEncoding('utf-8');
    for (const line of inputs) {
      proc.stdin.write(line + '\n');
    }
    proc.stdin.end();
  });
}

test('CLI returns results for a Hebrew address', { timeout: TIMEOUT }, async () => {
  // Provide Hebrew values for city, street and house number.
  const inputs = ['הרצליה', 'החרושת', '1'];
  const { exitCode, stdout, stderr } = await runCli(inputs);
  assert.equal(exitCode, 0, `CLI exited with non-zero code ${exitCode}. stderr=${stderr}`);
  // The CLI should print the resolved coordinates and headings for results.
  assert.ok(stdout.includes('Coordinates:'), `stdout did not contain coordinates; got: ${stdout}`);
  assert.ok(stdout.includes('Same'), `stdout did not contain same-location header: ${stdout}`);
  assert.ok(stdout.includes('Adjacent'), `stdout did not contain adjacent header: ${stdout}`);
});