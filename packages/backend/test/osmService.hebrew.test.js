import test from 'node:test';
import assert from 'node:assert/strict';
import { geocode, getNearbyAddresses, getSameLocationAddresses } from '../dist/osmService.js';

const TIMEOUT = 30000;

// Test geocoding with Hebrew input.
test('geocode returns coordinates for a Hebrew address', { timeout: TIMEOUT }, async () => {
  const coords = await geocode('הרצליה, ישראל');
  assert.equal(typeof coords.lat, 'number');
  assert.equal(typeof coords.lon, 'number');
});

// Test nearby addresses with Hebrew address.
test('getNearbyAddresses works with Hebrew address', { timeout: TIMEOUT }, async () => {
  const { lat, lon } = await geocode('תל אביב, ישראל');
  const addresses = await getNearbyAddresses(lat, lon, 100);
  assert.ok(Array.isArray(addresses));
  assert.ok(addresses.length > 0);
});

// Test same location addresses with Hebrew address.
test('getSameLocationAddresses works with Hebrew address', { timeout: TIMEOUT }, async () => {
  const same = await getSameLocationAddresses('ירושלים, ישראל');
  assert.ok(Array.isArray(same));
  assert.ok(same.length > 0);
});