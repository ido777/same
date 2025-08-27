import { useState } from 'react';

interface AddressResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface ResultData {
  lat: number;
  lon: number;
  same: AddressResult[];
  adjacent: AddressResult[];
}

function App() {
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const address = `${street.trim()} ${number.trim()}, ${city.trim()}`;
    try {
      const geoRes = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const { lat, lon, error: geoError } = await geoRes.json();
      if (geoError) throw new Error(geoError);
      const sameRes = await fetch(`/api/same?address=${encodeURIComponent(address)}`);
      const same: AddressResult[] = await sameRes.json();
      const adjRes = await fetch(`/api/adjacent?lat=${lat}&lon=${lon}&radius=100`);
      const adjacent: AddressResult[] = await adjRes.json();
      setResult({ lat, lon, same, adjacent });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
  };
  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <h1>Same Address Finder</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div>
          <label>
            City:
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Street:
            <input
              type="text"
              value={street}
              onChange={e => setStreet(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            House number:
            <input
              type="text"
              value={number}
              onChange={e => setNumber(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div>
          <p>
            <strong>Coordinates:</strong> {result.lat.toFixed(5)}, {result.lon.toFixed(5)}
          </p>
          <h2>Same Location Addresses</h2>
          <ul>
            {result.same.map((addr, i) => (
              <li key={i}>{addr.displayName}</li>
            ))}
          </ul>
          <h2>Adjacent Addresses</h2>
          <ul>
            {result.adjacent.map((addr, i) => (
              <li key={i}>{addr.displayName}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;