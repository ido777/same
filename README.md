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
│       ├── jest.config.js    # Jest configuration
│       ├── src/
│       │   ├── index.ts      # Main entry point (exports API functions)
│       │   └── osmService.ts # OSM utility functions
│       └── test/
│           └── osmService.test.ts # End‑to‑end tests hitting real OSM APIs
└── .github/
    └── workflows/
        └── ci.yml            # GitHub Action to run the tests
```

### Running the backend locally

The backend is a small TypeScript library that provides asynchronous functions to look up coordinates for a given address and then discover nearby addresses via the Overpass API.  It has no HTTP server yet.  To install dependencies and run the tests locally, navigate to `packages/backend` and run:

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

### Continuous Integration

The GitHub workflow defined in `.github/workflows/ci.yml` runs on pushes and pull requests to the `main` branch.  It installs the Node environment, installs dependencies from `package.json`, compiles the TypeScript code, and executes the test suite.  These tests do not use mocks; they call the real OpenStreetMap endpoints.  Please be mindful of OSM API usage policies when iterating on the tests.

### Next steps

* Add an HTTP API layer so that the frontend can request same‑location and adjacent addresses via REST or GraphQL.
* Build a React interface (see `packages/frontend` in the future) to input addresses, show results, and display them on a map.
* Integrate additional data sources, such as the Israeli land registry and municipal GIS systems, to enrich results with גוש/חלקה information and set map layers.

Contributions are welcome!  See the design and best practices documents in the `docs/` directory for more details about how to extend this project.