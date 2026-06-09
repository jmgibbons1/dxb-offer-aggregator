import { useEffect, useMemo, useState } from 'react';

interface Offer {
  id: number;
  categoryIds: number[];
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
}

interface Category {
  id: number;
  name: string;
}

interface OffersResponse {
  offers: Offer[];
  stats?: { total: number; byCategory: Record<string, number> };
  meta?: Record<string, string>;
  warning?: string;
}

const DISCOUNT_OPTIONS = [0, 10, 20, 30, 40, 50];

// Strip HTML tags / decode a couple of common entities for plain-text display.
function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<OffersResponse['stats']>();
  const [meta, setMeta] = useState<Record<string, string>>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [minDiscount, setMinDiscount] = useState(0);

  // Load the category list once for the dropdown.
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  // Debounce the free-text search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Re-query whenever a filter changes.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debounced.trim()) params.set('q', debounced.trim());
    if (categoryId) params.set('categoryId', categoryId);
    if (minDiscount > 0) params.set('minDiscount', String(minDiscount));

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
        setStats(d.stats);
        setMeta(d.meta);
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
  }, [debounced, categoryId, minDiscount]);

  async function redownload() {
    try {
      setRefreshing(true);
      const r = await fetch('/api/offers/refresh', { method: 'POST' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: OffersResponse = await r.json();
      setOffers(d.offers);
      setStats(d.stats);
      setMeta(d.meta);
      // reset filters to show the freshly downloaded full set
      setSearch('');
      setCategoryId('');
      setMinDiscount(0);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }

  const lastRefreshed = meta?.offers_last_refreshed;
  const byCategory = stats?.byCategory ?? {};
  const totalCached = stats?.total ?? 0;

  // Categories sorted, annotated with how many cached offers each holds.
  const categoryOptions = useMemo(
    () =>
      [...categories]
        .map((c) => ({ ...c, count: byCategory[c.id] ?? 0 }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [categories, byCategory]
  );

  const hasFilters = Boolean(debounced.trim() || categoryId || minDiscount > 0);

  return (
    <div>
      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search offers (brand, title, description)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <select
          value={minDiscount}
          onChange={(e) => setMinDiscount(Number(e.target.value))}
        >
          {DISCOUNT_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d === 0 ? 'Any discount' : `${d}% or more`}
            </option>
          ))}
        </select>
        <button className="refresh" onClick={redownload} disabled={refreshing}>
          {refreshing ? 'Downloading…' : 'Re-download'}
        </button>
      </div>

      <p className="sub">
        {status === 'ready' ? `${offers.length} ` : ''}
        {hasFilters ? 'matching ' : ''}offer{offers.length === 1 ? '' : 's'}
        {totalCached ? ` of ${totalCached} cached` : ''}
        {lastRefreshed ? ` · updated ${new Date(lastRefreshed).toLocaleString()}` : ''}
      </p>

      {message && <p className="warning">{message}</p>}
      {status === 'loading' && <p className="state">Loading…</p>}
      {status === 'error' && <p className="state error">Failed to load: {message}</p>}

      {status === 'ready' && offers.length === 0 && (
        <p className="state">No offers match these filters.</p>
      )}

      {status === 'ready' && offers.length > 0 && (
        <ul className="list">
          {offers.map((o) => (
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
                <p className="meta-line">
                  {o.validTo && <span>Valid to {o.validTo}</span>}
                  {o.website && (
                    <a href={o.website} target="_blank" rel="noreferrer">
                      Website
                    </a>
                  )}
                </p>
              </div>
              <span className="id">#{o.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
