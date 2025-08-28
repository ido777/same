import test from 'node:test';
import assert from 'node:assert/strict';
import { geocode, getNearbyAddresses, getSameLocationAddresses } from '../dist/osmService.js';

// Node's test runner allows passing options with a custom timeout per test.
const TIMEOUT = 30000;

test('geocode returns coordinates for a valid address', { timeout: TIMEOUT }, async () => {
  const coords = await geocode('Herzliya, Israel');
  assert.equal(typeof coords.lat, 'number');
  assert.equal(typeof coords.lon, 'number');
  // Coordinates should roughly correspond to Herzliya (32°N, 34°E)
  assert.ok(coords.lat > 31 && coords.lat < 33);
  assert.ok(coords.lon > 33 && coords.lon < 35);
});

test('getNearbyAddresses returns some addresses around a coordinate', { timeout: TIMEOUT }, async () => {
  const { lat, lon } = await geocode('Herzliya, Israel');
  const addresses = await getNearbyAddresses(lat, lon, 100);
  assert.ok(Array.isArray(addresses));
  assert.ok(addresses.length > 0);
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