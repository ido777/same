import test from 'node:test';
import assert from 'node:assert/strict';

// Import the compiled module from dist since TypeScript is compiled
// before tests run.  This ensures we are testing the same code that
// the CLI and server use.
import { geocode, getNearbyAddresses, getSameLocationAddresses } from '../dist/osmService.js';

const TIMEOUT = 30000;

test('geocode returns coordinates for a valid address', { timeout: TIMEOUT }, async () => {
  const coords = await geocode('Herzliya, Israel');
  assert.equal(typeof coords.lat, 'number');
  assert.equal(typeof coords.lon, 'number');
  // Check that the coordinates roughly match Herzliya (32°N, 34°E).
  assert.ok(coords.lat > 31 && coords.lat < 33, `lat ${coords.lat} out of expected range`);
  assert.ok(coords.lon > 33 && coords.lon < 35, `lon ${coords.lon} out of expected range`);
});

test('getNearbyAddresses returns some addresses around a coordinate', { timeout: TIMEOUT }, async () => {
  const { lat, lon } = await geocode('Herzliya, Israel');
  const addresses = await getNearbyAddresses(lat, lon, 100);
  assert.ok(Array.isArray(addresses), 'result is not an array');
  assert.ok(addresses.length > 0, 'no nearby addresses found');
  for (const addr of addresses) {
    assert.equal(typeof addr.lat, 'number');
    assert.equal(typeof addr.lon, 'number');
    assert.equal(typeof addr.displayName, 'string');
  }
});

test('getSameLocationAddresses returns addresses for the same location', { timeout: TIMEOUT }, async () => {
  const addresses = await getSameLocationAddresses('Herzliya, Israel');
  assert.ok(Array.isArray(addresses));
  assert.ok(addresses.length > 0);
});