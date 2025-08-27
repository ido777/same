#!/usr/bin/env node
/*
 * Simple command‑line interface for looking up addresses using the OSM
 * services defined in osmService.ts.  The CLI prompts the user for a
 * city, street and house number (which may be in Hebrew) and returns
 * the latitude/longitude of the resulting address along with other
 * addresses at the same location and nearby addresses.  Input is
 * validated only for presence; deeper validation is deferred to the
 * geocoding service.
 */

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { geocode, getSameLocationAddresses, getNearbyAddresses } from './osmService';

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    const city = (await rl.question('Enter city: ')).trim();
    if (!city) {
      console.error('City is required.');
      rl.close();
      process.exit(1);
    }
    const street = (await rl.question('Enter street: ')).trim();
    if (!street) {
      console.error('Street is required.');
      rl.close();
      process.exit(1);
    }
    const number = (await rl.question('Enter house number: ')).trim();
    if (!number) {
      console.error('House number is required.');
      rl.close();
      process.exit(1);
    }
    const address = `${street} ${number}, ${city}`;
    console.log(`Resolving address: ${address}`);
    try {
      const { lat, lon } = await geocode(address);
      console.log(`Coordinates: lat=${lat}, lon=${lon}`);
      const same = await getSameLocationAddresses(address);
      console.log('Same‑location addresses:');
      same.forEach((a, i) => console.log(`${i + 1}. ${a.displayName}`));
      const adjacent = await getNearbyAddresses(lat, lon, 100);
      console.log('Adjacent addresses:');
      adjacent.forEach((a, i) => console.log(`${i + 1}. ${a.displayName}`));
    } catch (err: any) {
      console.error('Error:', err.message || err);
    }
  } finally {
    rl.close();
  }
}

// In an ES module environment, require is not defined.  To determine
// whether this file is being executed directly (as a CLI) rather than
// imported as a module, compare the invoked script path to the current
// module URL.  When run via `node dist/cli.js`, process.argv[1] will
// equal the file URL converted to a filesystem path.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && process.argv[1] === __filename) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}