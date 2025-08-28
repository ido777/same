# Same Location and Nearby Addresses Application

This project aims to build a small micro‑service and user interface for working with OpenStreetMap data.  Given one or more postal addresses in Israel, the service will return:

1. **Same‑location addresses** – multiple addresses for a single building when it fronts multiple streets or has multiple entrances.
2. **Adjacent addresses** – neighbouring buildings and land parcels within a configurable radius.

The long‑term vision includes displaying these addresses on interactive maps (e.g. Google Maps and municipal GIS systems) and enriching results with cadastral information (גוש/חלקה) from the Israeli land registry.  For now we focus on the OpenStreetMap (OSM) component only.

## Repository layout

```
same/
├── README.md                 # This file
├── docs/
│   ├── Design.md             # High‑level design document
│   └── BestPractices.md      # Project coding and testing guidelines
├── packages/
│   └── backend/
│       ├── package.json      # Backend package manifest
│       ├── tsconfig.json     # TypeScript compiler options
│       ├── src/
│       │   ├── index.ts      # Main entry point (exports API functions)
│       │   ├── osmService.ts # OSM utility functions
│       │   ├── cli.ts        # Command‑line interface
│       │   └── server.ts     # Minimal HTTP API server
│       ├── dist/             # Compiled JavaScript output
│       └── test/
│           ├── osmService.integration.test.js  # Integration tests for core APIs
│           ├── osmService.hebrew.test.js       # Hebrew address integration tests
│           ├── cli.integration.test.js         # Interactive CLI test (Hebrew input)
│           └── server.integration.test.js      # API server integration test
└── .github/
    └── workflows/
        └── ci.yml            # GitHub Action to run the tests
├── packages/
│   └── frontend/
│       ├── package.json        # Frontend package manifest
│       ├── tsconfig.json       # TypeScript compiler options for the frontend
│       ├── vite.config.ts      # Vite configuration with API proxy
│       ├── index.html          # HTML entry point
│       └── src/
│           ├── main.tsx        # React entry point
│           ├── App.tsx         # Main App component
│           ├── index.css       # Simple styling
│           └── tests/
│               └── app.spec.ts  # Playwright end‑to‑end tests for the UI
```

### Running the backend locally

The backend is a small TypeScript library that provides asynchronous functions to look up coordinates for a given address and then discover nearby addresses via the Overpass API.  It now also includes a command‑line interface and a minimal HTTP server.

To install dependencies and run the tests locally, navigate to `packages/backend` and run:

```bash
cd packages/backend
npm install
npm test
```

The `npm test` script compiles the TypeScript sources with the TypeScript compiler and then executes a small test suite using Node’s built‑in [`node:test`](https://nodejs.org/api/test.html) runner.  **Note:** these tests call the real OSM APIs and require network connectivity.  If you run them offline, they will fail.  On continuous integration or a networked machine, they should pass and verify that the basic API functions work end to end.

To try the API functions manually in a Node REPL without running the tests:

```bash
cd packages/backend
npm run build
node
> const api = await import('./dist/index.js');
> await api.geocode('Herzliya, Israel');
```

### Command‑line interface

To interactively query addresses from your terminal, run:

```bash
cd packages/backend
npm run cli
```

You’ll be prompted to enter a city, street and house number (Hebrew input is supported).  The CLI then prints the coordinates of the resolved address, a list of same‑location addresses and a list of nearby addresses.

### Running the API server

You can expose the backend functions over HTTP by starting the built‑in server:

```bash
cd packages/backend
npm run start
```

By default the server listens on port 3000 and exposes the following endpoints:

* `GET /api/geocode?address=...` — returns `{ lat, lon }`
* `GET /api/same?address=...` — returns an array of same‑location address objects
* `GET /api/adjacent?lat=LAT&lon=LON&radius=RADIUS` — returns an array of nearby address objects

You can adjust the port by setting the `PORT` environment variable.

### Continuous Integration

The GitHub workflow defined in `.github/workflows/ci.yml` runs on pushes and pull requests to the `main` branch.  It sets up Node, installs dependencies for the backend, compiles the TypeScript code, and executes the backend test suite using Node’s built‑in test runner.  These tests call the real OpenStreetMap endpoints and therefore require network access.  Playwright tests for the frontend will be added in a future iteration and executed via a separate workflow once the React UI is more fully developed.

### Next steps

* Add an HTTP API layer so that the frontend can request same‑location and adjacent addresses via REST or GraphQL.
* Build a React interface (see `packages/frontend` in the future) to input addresses, show results, and display them on a map.
* Integrate additional data sources, such as the Israeli land registry and municipal GIS systems, to enrich results with גוש/חלקה information and set map layers.

Contributions are welcome!  See the design and best practices documents in the `docs/` directory for more details about how to extend this project.