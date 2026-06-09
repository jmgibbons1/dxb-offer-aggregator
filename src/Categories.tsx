import { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
  tooltip: string;
  image: string;
  isUserSelected: boolean;
}

interface ApiResponse {
  categories: Category[];
  meta?: { last_refreshed?: string; count?: string };
  warning?: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<ApiResponse['meta']>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setStatus('loading');
      // GET reads the SQLite cache; POST forces a live re-fetch from upstream.
      const r = await fetch(
        refresh ? '/api/refresh' : '/api/categories',
        refresh ? { method: 'POST' } : undefined
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: ApiResponse = await r.json();
      setCategories(data.categories);
      setMeta(data.meta);
      setMessage(data.warning ?? '');
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="toolbar">
        <p className="sub">
          {meta?.count ? `${meta.count} categories` : ''}
          {meta?.last_refreshed
            ? ` · updated ${new Date(meta.last_refreshed).toLocaleString()}`
            : ''}
        </p>
        <button className="refresh" onClick={() => load(true)} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh from API'}
        </button>
      </div>

      {message && <p className="warning">{message}</p>}
      {status === 'loading' && <p className="state">Loading categories…</p>}
      {status === 'error' && <p className="state error">Failed to load: {message}</p>}

      {status === 'ready' && (
        <ul className="list">
          {categories.map((c) => (
            <li key={c.id} className="row">
              {c.image ? (
                <img className="thumb" src={c.image} alt="" loading="lazy" />
              ) : (
                <div className="thumb placeholder" />
              )}
              <div className="info">
                <div className="name-line">
                  <span className="name">{c.name}</span>
                  {c.isUserSelected && <span className="badge">selected</span>}
                </div>
                {c.tooltip && <p className="tooltip">{c.tooltip}</p>}
              </div>
              <span className="id">#{c.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
