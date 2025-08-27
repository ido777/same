/*
 * Minimal HTTP server exposing the geocoding and address lookup functions
 * from osmService.ts as JSON endpoints.  This server uses Node’s built‑in
 * http and url modules; no external dependencies are required.  The
 * endpoints are:
 *   GET /api/geocode?address=STREET
 *     → { lat, lon }
 *   GET /api/same?address=STREET
 *     → [ { lat, lon, displayName }, ... ]
 *   GET /api/adjacent?lat=LAT&lon=LON&radius=RADIUS
 *     → [ { lat, lon, displayName }, ... ]
 */

import http from 'node:http';
import { parse as parseUrl } from 'node:url';
import { geocode, getSameLocationAddresses, getNearbyAddresses } from './osmService';

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  // Always allow cross-origin requests so that the frontend (served
  // from a different port) can call these APIs without CORS issues.
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsed = parseUrl(req.url || '', true);
  const { pathname, query } = parsed;
  try {
    if (pathname === '/api/geocode' && req.method === 'GET') {
      const address = query.address as string | undefined;
      if (!address) return sendJson(res, 400, { error: 'address is required' });
      const coords = await geocode(address);
      return sendJson(res, 200, coords);
    }
    if (pathname === '/api/same' && req.method === 'GET') {
      const address = query.address as string | undefined;
      if (!address) return sendJson(res, 400, { error: 'address is required' });
      const list = await getSameLocationAddresses(address);
      return sendJson(res, 200, list);
    }
    if (pathname === '/api/adjacent' && req.method === 'GET') {
      const latStr = query.lat as string | undefined;
      const lonStr = query.lon as string | undefined;
      if (!latStr || !lonStr) return sendJson(res, 400, { error: 'lat and lon are required' });
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const radius = query.radius ? parseInt(query.radius as string, 10) : 50;
      const list = await getNearbyAddresses(lat, lon, radius);
      return sendJson(res, 200, list);
    }
    // Not found
    sendJson(res, 404, { error: 'Not found' });
  } catch (err: any) {
    sendJson(res, 500, { error: err.message || err.toString() });
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

export default server;