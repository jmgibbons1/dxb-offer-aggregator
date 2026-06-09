import { useEffect, useState } from 'react';
import type { Geo } from './App';

interface OfferLocation {
  address: string;
  lat: number;
  lng: number;
}

interface Offer {
  id: number;
  categoryIds: number[];
  subcategoryIds: number[];
  brandName: string;
  brandLogo: string;
  title: string;
  shortDescription: string;
  discount: string;
  discountNum: number;
  website: string;
  validFrom: string;
  validTo: string;
  image: string;
  locations: OfferLocation[];
  // Present whenever the request included the user's location.
  distanceKm?: number | null;
  nearestLocation?: OfferLocation | null;
}

interface OffersResponse {
  offers: Offer[];
  stats?: { total: number; byCategory: Record<string, number> };
  meta?: Record<string, string>;
  warning?: string;
}

interface OffersProps {
  categoryId: number | null;
  categoryName: string;
  geo: Geo;
  nearByDefault?: boolean;
  initialSearch?: string;
  onBack: () => void;
}

const DISCOUNT_OPTIONS = [0, 10, 20, 30, 40, 50];
const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50];

// Strip HTML tags / decode a couple of common entities for plain-text display.
function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Defensive: ensure a contact website is an absolute URL (the API normalises this
// too, but guard against any bare host slipping through).
function toHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Format a kilometre distance as miles for display ("0.4 miles", "2.3 miles").
function miles(km: number): string {
  const mi = km * 0.621371;
  return `${mi < 0.1 ? mi.toFixed(2) : mi.toFixed(1)} miles`;
}

export default function Offers({
  categoryId,
  categoryName,
  geo,
  nearByDefault,
  initialSearch,
  onBack,
}: OffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // Filters (within this view). Seed from initialSearch (set debounced too so the
  // first query runs immediately without waiting for the debounce).
  const [search, setSearch] = useState(initialSearch ?? '');
  const [debounced, setDebounced] = useState(initialSearch ?? '');
  const [minDiscount, setMinDiscount] = useState(0);

  // Near-me filter: when on, results are limited to within radiusKm and sorted by
  // distance. Distances themselves show on every card as long as we have coords.
  const [nearFilter, setNearFilter] = useState(Boolean(nearByDefault));
  const [radiusKm, setRadiusKm] = useState(5);

  const { coords } = geo;

  // Debounce the free-text search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Re-query whenever the category, a filter, the location, or the radius changes.
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId != null) params.set('categoryId', String(categoryId));
    if (debounced.trim()) params.set('q', debounced.trim());
    if (minDiscount > 0) params.set('minDiscount', String(minDiscount));
    if (coords) {
      // Always send the point so every card gets a distance…
      params.set('lat', String(coords.lat));
      params.set('lng', String(coords.lng));
      // …but only constrain to a radius when the near-me filter is on.
      if (nearFilter) params.set('radiusKm', String(radiusKm));
    }

    let cancelled = false;
    setStatus('loading');
    fetch(`/api/offers?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: OffersResponse) => {
        if (cancelled) return;
        setOffers(d.offers);
        setMessage(d.warning ?? '');
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, debounced, minDiscount, coords, nearFilter, radiusKm]);

  // Toggle the near-me filter; request location first if we don't have it yet.
  function toggleNear() {
    if (!coords) {
      setNearFilter(true);
      geo.request();
    } else {
      setNearFilter((v) => !v);
    }
  }

  const hasFilters = Boolean(debounced.trim() || minDiscount > 0 || nearFilter);

  return (
    <div>
      <button className="back" onClick={onBack}>
        ‹ All categories
      </button>
      <h2 className="category-heading">{categoryName}</h2>

      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search Offers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={minDiscount} onChange={(e) => setMinDiscount(Number(e.target.value))}>
          {DISCOUNT_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d === 0 ? 'Any discount' : `${d}% or more`}
            </option>
          ))}
        </select>
        <button
          className={`near-me${nearFilter ? ' active' : ''}`}
          onClick={toggleNear}
          disabled={geo.status === 'locating'}
        >
          {geo.status === 'locating'
            ? 'Locating…'
            : nearFilter
              ? '📍 Near me ✕'
              : '📍 Near me'}
        </button>
        {nearFilter && (
          <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                within {r} km
              </option>
            ))}
          </select>
        )}
      </div>

      {geo.status === 'error' && nearFilter && <p className="warning">{geo.message}</p>}

      <p className="sub">
        {status === 'ready' ? `${offers.length} ` : ''}
        {hasFilters ? 'matching ' : ''}offer{offers.length === 1 ? '' : 's'}
        {nearFilter && coords ? ` within ${radiusKm} km` : ''}
      </p>

      {message && <p className="warning">{message}</p>}
      {status === 'loading' && <p className="state">Loading…</p>}
      {status === 'error' && <p className="state error">Failed to load: {message}</p>}

      {status === 'ready' && offers.length === 0 && (
        <p className="state">
          No offers{hasFilters ? ' match these filters' : ''}
          {nearFilter && coords ? ' near you — try a larger radius' : ''}.
        </p>
      )}

      {status === 'ready' && offers.length > 0 && (
        <ul className="list">
          {offers.map((o) => {
            // In near-me mode show the closest branch; otherwise the first listed.
            const loc = o.nearestLocation ?? o.locations?.[0] ?? null;
            return (
              <li key={o.id} className="row">
                {o.brandLogo ? (
                  <img className="thumb" src={o.brandLogo} alt="" loading="lazy" />
                ) : (
                  <div className="thumb placeholder" />
                )}
                <div className="info">
                  <div className="name-line">
                    <span className="name">{o.brandName}</span>
                    {o.discountNum > 0 && (
                      <span className="badge discount">{o.discountNum}% off</span>
                    )}
                  </div>
                  <p className="offer-title">{o.title}</p>
                  {o.shortDescription && (
                    <p className="tooltip">{plain(o.shortDescription).slice(0, 180)}</p>
                  )}
                  {loc && (
                    <p className="meta-line">
                      {loc.address && <span className="address">{loc.address}</span>}
                      <a href={mapsLink(loc.lat, loc.lng)} target="_blank" rel="noreferrer">
                        Map ({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)})
                      </a>
                    </p>
                  )}
                  <p className="meta-line">
                    {o.validTo && <span>Valid to {o.validTo}</span>}
                    {o.website && (
                      <a href={toHref(o.website)} target="_blank" rel="noreferrer">
                        Website
                      </a>
                    )}
                    {o.distanceKm != null && (
                      <span className="distance">📍 {miles(o.distanceKm)} away</span>
                    )}
                  </p>
                </div>
                <span className="id">#{o.id}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
