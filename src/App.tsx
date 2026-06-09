import { useCallback, useEffect, useState } from 'react';
import Categories from './Categories';
import Offers from './Offers';

export interface Coords {
  lat: number;
  lng: number;
}

export interface Geo {
  coords: Coords | null;
  status: 'idle' | 'locating' | 'ready' | 'error';
  message: string;
  request: () => void;
}

type View =
  | { kind: 'categories' }
  | { kind: 'category'; id: number; name: string }
  | { kind: 'near' }
  | { kind: 'search'; query: string };

export default function App() {
  const [view, setView] = useState<View>({ kind: 'categories' });

  // The user's location lives at the top so every Offers view can show distances.
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<Geo['status']>('idle');
  const [message, setMessage] = useState('');

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setMessage('Geolocation is not supported by this browser.');
      return;
    }
    setStatus('locating');
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('ready');
      },
      (err) => {
        setStatus('error');
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable it to see how far away each offer is.'
            : `Could not get your location: ${err.message}`
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Ask once on load so distances can appear on every card from the start.
  useEffect(() => {
    request();
  }, [request]);

  const geo: Geo = { coords, status, message, request };

  return (
    <div className="page">
      <header className="header">
        <h1>Platinum Card Offers</h1>
      </header>

      {view.kind === 'categories' && (
        <Categories
          onSelect={(c) => setView({ kind: 'category', id: c.id, name: c.name })}
          onNearMe={() => setView({ kind: 'near' })}
          onSearch={(query) => setView({ kind: 'search', query })}
        />
      )}

      {view.kind === 'category' && (
        <Offers
          categoryId={view.id}
          categoryName={view.name}
          geo={geo}
          onBack={() => setView({ kind: 'categories' })}
        />
      )}

      {view.kind === 'near' && (
        <Offers
          categoryId={null}
          categoryName="Offers near me"
          geo={geo}
          nearByDefault
          onBack={() => setView({ kind: 'categories' })}
        />
      )}

      {view.kind === 'search' && (
        <Offers
          categoryId={null}
          categoryName="All offers"
          geo={geo}
          initialSearch={view.query}
          onBack={() => setView({ kind: 'categories' })}
        />
      )}
    </div>
  );
}
