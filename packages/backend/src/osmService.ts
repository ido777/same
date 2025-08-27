/**
 * OSM service functions for geocoding and neighbourhood queries.
 *
 * These functions use OpenStreetMap's Nominatim and Overpass APIs
 * to resolve addresses and find nearby addresses.  They return
 * simple data structures that can be consumed by higher‑level APIs.
 */

export interface Address {
  lat: number;
  lon: number;
  /**
   * A human‑friendly representation of the address, assembled from
   * available OSM tags.  Consumers may choose to format it differently.
   */
  displayName: string;
}

/**
 * Geocode a human‑readable address to latitude and longitude using
 * Nominatim.  Throws an error if no result is found.
 *
 * @param address The input address (e.g. "Herzliya, Israel").
 * @returns A Promise resolving to an object with `lat` and `lon` fields.
 */
export async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  const query = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  const response = await fetch(url, {
    headers: {
      // Identify the application per Nominatim usage policy
      'User-Agent': 'same-osm-app/0.1'
    }
  });
  if (!response.ok) {
    throw new Error(`Geocoding failed: HTTP ${response.status}`);
  }
  const data: any[] = await response.json();
  if (!data || data.length === 0) {
    throw new Error('Address not found');
  }
  const result = data[0];
  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon)
  };
}

/**
 * Query Overpass for addresses within a given radius of a coordinate.
 * It returns both nodes and way centroids with `addr:housenumber` tags.
 *
 * @param lat Latitude in decimal degrees.
 * @param lon Longitude in decimal degrees.
 * @param radius Search radius in metres (default 50).
 * @returns A Promise resolving to an array of Address objects.
 */
export async function getNearbyAddresses(lat: number, lon: number, radius = 50): Promise<Address[]> {
  const url = 'https://overpass-api.de/api/interpreter';
  // Build the Overpass query.  We search for nodes and ways with
  // addr:housenumber within the given radius.  The 'out center' clause
  // requests the centroid for ways so we can get coordinates.
  const query = `
    [out:json];
    (
      node(around:${radius},${lat},${lon})["addr:housenumber"];
      way(around:${radius},${lat},${lon})["addr:housenumber"];
    );
    out center tags;
  `;
  const form = new URLSearchParams();
  form.set('data', query);
  const response = await fetch(url, {
    method: 'POST',
    body: form,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'same-osm-app/0.1'
    }
  });
  if (!response.ok) {
    throw new Error(`Overpass query failed: HTTP ${response.status}`);
  }
  const data: any = await response.json();
  const results: Address[] = [];
  if (data.elements) {
    for (const el of data.elements) {
      const latVal: number | undefined = el.lat ?? el.center?.lat;
      const lonVal: number | undefined = el.lon ?? el.center?.lon;
      if (latVal === undefined || lonVal === undefined) {
        continue;
      }
      const street = el.tags?.['addr:street'] ?? '';
      const house = el.tags?.['addr:housenumber'] ?? '';
      const city = el.tags?.['addr:city'] ?? '';
      const displayNameParts = [street, house, city].filter(Boolean);
      const displayName = displayNameParts.join(' ');
      results.push({ lat: latVal, lon: lonVal, displayName });
    }
  }
  return results;
}

/**
 * Find other addresses that likely belong to the same location as the
 * supplied address.  Currently implemented by geocoding the address
 * and then searching within a narrow radius.
 *
 * @param address The input address.
 * @returns A Promise resolving to an array of Address objects.
 */
export async function getSameLocationAddresses(address: string): Promise<Address[]> {
  const { lat, lon } = await geocode(address);
  // Use a smaller radius for same‑location addresses (e.g. 30m).
  return await getNearbyAddresses(lat, lon, 30);
}

// index.ts re‑exports these functions so that consumers can import
// from the package root.  Nothing else should be exported from here.