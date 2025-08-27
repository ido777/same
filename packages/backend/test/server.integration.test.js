import test from 'node:test';
import assert from 'node:assert/strict';

// Node 18+ provides a global fetch API.

const TIMEOUT = 60000;

test('API server returns geocode results and lists of addresses', { timeout: TIMEOUT }, async () => {
  // Dynamically import the compiled server.  The default export is
  // the http.Server instance but it is only started when the module
  // is executed directly.  Importing it here does not start the
  // listener.  We'll call server.listen ourselves.
  const module = await import('../dist/server.js');
  const server = module.default;
  // Use a random available port for testing.
  const port = 4000 + Math.floor(Math.random() * 1000);
  await new Promise(resolve => server.listen(port, resolve));
  try {
    // Test geocode endpoint
    let resp = await fetch(`http://localhost:${port}/api/geocode?address=${encodeURIComponent('Herzliya, Israel')}`);
    assert.equal(resp.status, 200);
    const geodata = await resp.json();
    assert.equal(typeof geodata.lat, 'number');
    assert.equal(typeof geodata.lon, 'number');
    // Test same-location endpoint
    resp = await fetch(`http://localhost:${port}/api/same?address=${encodeURIComponent('Herzliya, Israel')}`);
    assert.equal(resp.status, 200);
    const same = await resp.json();
    assert.ok(Array.isArray(same));
    // Test adjacent endpoint
    resp = await fetch(`http://localhost:${port}/api/adjacent?lat=${geodata.lat}&lon=${geodata.lon}&radius=50`);
    assert.equal(resp.status, 200);
    const adj = await resp.json();
    assert.ok(Array.isArray(adj));
  } finally {
    server.close();
  }
});