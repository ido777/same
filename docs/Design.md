# Design Document for Same Location and Nearby Addresses Service

## Objectives

1. **Geocode input addresses** – Convert a human‑readable postal address into latitude/longitude coordinates using OpenStreetMap's [Nominatim](https://nominatim.openstreetmap.org/) service.
2. **Identify same‑location addresses** – Determine whether the resolved building has multiple official addresses.  Buildings on corners often have entrances on two different streets, each with its own address.
3. **Find adjacent addresses** – Return neighbouring buildings or land parcels near the resolved location, regardless of whether they are on the same street.
4. **Expose a reusable API** – Provide TypeScript functions that can be composed into a REST/GraphQL service and a future React frontend.
5. **Test with live data** – Use end‑to‑end tests that call real OSM APIs.  Avoid mocks to ensure that the service stays aligned with the external data source.

## High‑Level Architecture

```
┌──────────────┐        ┌───────────────────┐
│ Input Address│──────▶│   Geocode via     │────┐
└──────────────┘        │    Nominatim      │    │
                        └───────────────────┘    │
                                                   ▼
                ┌───────────────────────────┐      ┌─────────────────────────┐
                │ Identify Same‑Location    │      │ Identify Adjacent       │
                │ Entrances & Addresses     │      │ Addresses via Overpass  │
                └───────────────────────────┘      └─────────────────────────┘
                             │                              │
                             └──────────────┬───────────────┘
                                            ▼
                                   ┌────────────┐
                                   │  Results   │
                                   └────────────┘
```

### Geocoding

We use the public Nominatim API to geocode user‑provided addresses.  A `/search` request returns candidate placemarks; we pick the first result and read its `lat` and `lon` values.  An HTTP `User‑Agent` header is set to identify this application to OSM.

### Same‑location detection

Once we have the coordinates, we query the Overpass API with a small radius (e.g. 30 m) to list all nodes and ways with an `addr:housenumber` tag near that location.  We then look at each result's `addr:street` and `addr:housenumber` tags.  If multiple addresses appear on the same building or within a very small radius, we consider them “same location” addresses.  This simple heuristic handles corner buildings that have entrances on two streets.  Further refinements (e.g. using building polygons and entrance tags) can be added later.

### Adjacent addresses

To find nearby addresses, we expand the search radius (default 50–100 m) and request nodes or ways with the `addr:housenumber` tag.  We return a list of these addresses, including their coordinates and a formatted display name.  Consumers can adjust the radius depending on how broad the definition of “adjacent” should be.

### Future extensions

* **Street‑based adjacency** – Determine upstream/downstream neighbours along the same street by computing distances along the street polyline.
* **Cadastral data (גוש/חלקה)** – Integrate layers from the Israeli land registry to associate OSM buildings with land parcels.  This requires fetching authoritative cadastral layers, which are not provided by OSM.
* **GIS viewers** – Build configuration links for municipal GIS viewers (e.g. the Jerusalem GIS link provided by the user) to jump directly to a location and set layers.

## Data flow

1. **Input**: A human‑readable address provided by the user.
2. **Nominatim search**: A GET request to `https://nominatim.openstreetmap.org/search?format=json&q=<encoded address>&limit=1` returns JSON with potential matches.  We take the top result.
3. **Overpass query**: A POST request to `https://overpass-api.de/api/interpreter` with a query such as:
   ```
   [out:json];
   (
     node(around:50,<lat>,<lon>)["addr:housenumber"];
     way(around:50,<lat>,<lon>)["addr:housenumber"];
   );
   out center tags;
   ```
   returns nodes and ways within 50 m that have address tags.  The `center` keyword instructs Overpass to return the centroid of each way.
4. **Formatting**: For each element, we construct a display string by concatenating the `addr:street`, `addr:housenumber`, and `addr:city` tags (if present).  The consumer (backend API or frontend) can refine this formatting.

## Testing strategy

The project includes Jest tests under `packages/backend/test`.  These tests call the actual Nominatim and Overpass endpoints rather than mocking them.  Each test case is given generous timeouts to accommodate network latency.  When writing new tests:

* Choose addresses that are unlikely to change frequently (e.g. city centres or well‑known streets).
* Check for generic conditions (e.g. “the function returns at least one result” rather than specific coordinates) to reduce fragility.
* Do not send too many requests to OSM; group them by test or use `Promise.all` responsibly.

**Note**: Because we do not control OSM, network or data issues may occasionally cause tests to fail.  We treat such failures as cues to either adjust the search radius or change the test address.