import { useState } from 'react';

const CACHE_KEY = 'autobenta_geo';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL_MS) return { lat, lng };
  } catch {}
  return null;
}

export default function useGeolocation() {
  const cached = readCache();
  const [state, setState] = useState({
    lat: cached?.lat ?? null,
    lng: cached?.lng ?? null,
    loading: false,
    error: null, // 'denied' | 'unavailable' | 'timeout' | 'not_supported'
  });

  const request = () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'not_supported' }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lng, ts: Date.now() })); } catch {}
        setState({ lat, lng, loading: false, error: null });
      },
      (err) => {
        const code = err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
        setState((s) => ({ ...s, loading: false, error: code }));
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const clear = () => {
    try { sessionStorage.removeItem(CACHE_KEY); } catch {}
    setState({ lat: null, lng: null, loading: false, error: null });
  };

  return {
    lat: state.lat,
    lng: state.lng,
    loading: state.loading,
    error: state.error,
    active: state.lat != null,
    supported: typeof navigator !== 'undefined' && !!navigator.geolocation,
    request,
    clear,
  };
}
