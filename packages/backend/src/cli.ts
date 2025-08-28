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

import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';
// Import the service functions from the compiled module.  Under the
// NodeNext module system, relative imports must include the `.js`
// extension.
import { geocode, getSameLocationAddresses, getNearbyAddresses } from './osmService.js';

type JsonItem = { city: string; street: string; number: string };


// Define the Address type here to avoid importing types from the service
// module; this keeps the CLI self‑contained and prevents resolution issues
// when compiling with NodeNext.  It mirrors the shape returned by
// getNearbyAddresses and getSameLocationAddresses.
interface Address {
  lat: number;
  lon: number;
  displayName: string;
}

async function runInteractive() {
  const rl = readline.createInterface({ input, output });
  const ask = (prompt: string): Promise<string> => {
    return new Promise(resolve => {
      rl.question(prompt, answer => {
        resolve(answer.trim());
      });
    });
  };
  try {
    const city = await ask('Enter city: ');
    if (!city) {
      console.error('City is required.');
      rl.close();
      process.exit(1);
    }
    const street = await ask('Enter street: ');
    if (!street) {
      console.error('Street is required.');
      rl.close();
      process.exit(1);
    }
    const number = await ask('Enter house number: ');
    if (!number) {
      console.error('House number is required.');
      rl.close();
      process.exit(1);
    }
    const address = `${street} ${number}, ${city}`;
    await lookupAndPrint(address);
  } finally {
    rl.close();
  }
}

async function runPiped() {
  // Read all input from stdin.  When data is piped in via spawn, stdin is
  // not a TTY and we should not prompt.  We assume the input consists of
  // three lines: city, street, number.
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks).toString('utf8');
  const lines = data.split(/\r?\n/).filter(Boolean);
  const city = lines[0] ?? '';
  const street = lines[1] ?? '';
  const number = lines[2] ?? '';
  if (!city || !street || !number) {
    console.error('City, street and house number are required.');
    process.exit(1);
  }
  const address = `${street} ${number}, ${city}`;
  await lookupAndPrint(address);
}

async function lookupAndPrint(address: string) {
  console.log(`Resolving address: ${address}`);
  try {
    const { lat, lon } = await geocode(address);
    console.log(`Coordinates: lat=${lat}, lon=${lon}`);
    const same = await getSameLocationAddresses(address);
    console.log('Same‑location addresses:');
    same.forEach((a: Address, i: number) => console.log(`${i + 1}. ${a.displayName}`));
    const adjacent = await getNearbyAddresses(lat, lon, 100);
    console.log('Adjacent addresses:');
    adjacent.forEach((a: Address, i: number) => console.log(`${i + 1}. ${a.displayName}`));
  } catch (err: any) {
    console.error('Error:', (err as any).message || err);
  }
}

function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input, output });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runForAddress(city: string, street: string, number: string) {
  const addr = `${street} ${number}, ${city}`;
  console.log(`Resolving address: ${addr}`);
  const { lat, lon } = await geocode(addr);
  console.log(`Coordinates: ${lat}, ${lon}`);
  const same = await getSameLocationAddresses(addr);
  const adjacent = await getNearbyAddresses(lat, lon, 50);
  console.log(`Same-location addresses (${same.length}):`);
  same.forEach((a: any, i: number) => console.log(`${i + 1}. ${a.displayName}`));
  console.log(`Adjacent addresses (${adjacent.length}):`);
  adjacent.forEach((a: any, i: number) => console.log(`${i + 1}. ${a.displayName}`));
}


async function main() {
  const args = process.argv.slice(2);
  const i = args.findIndex(a => a === '--file' || a === '-f');
  if (i !== -1) {
    const filePath = args[i + 1];
    if (!filePath) {
      console.error('Missing path after --file');
      process.exit(2);
    }
    const raw = await fs.readFile(filePath, 'utf8');
    const list: JsonItem[] = JSON.parse(raw);
    for (const item of list) {
      await runForAddress(item.city, item.street, item.number);
    }
    return;
  }

  // Non-TTY stdin (piped): read 3 lines.
  if (!input.isTTY) {
    const chunks: string[] = [];
    input.setEncoding('utf8');
    for await (const chunk of input) chunks.push(chunk);
    const [city, street, number] = chunks.join('').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    await runForAddress(city, street, number);
    return;
  }

  // Interactive
  const city = await prompt('Enter city: ');
  const street = await prompt('Enter street: ');
  const number = await prompt('Enter house number: ');
  await runForAddress(city, street, number);
}


// In an ES module environment, require is not defined.  To determine
// whether this file is being executed directly (as a CLI) rather than
// imported as a module, compare the invoked script path to the current
// module URL.  When run via `node dist/cli.js`, process.argv[1] will
// equal the file URL converted to a filesystem path.
const __filename = fileURLToPath(import.meta.url);
// Determine whether this script is being run directly.  Node passes
// process.argv[1] as the path originally specified on the command line,
// which may be relative.  Resolve both to absolute paths for
// comparison so that `node dist/cli.js` and `node ./dist/cli.js` work.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}