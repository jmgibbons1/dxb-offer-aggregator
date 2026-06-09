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

interface CategoriesProps {
  onSelect: (category: { id: number; name: string }) => void;
  onNearMe: () => void;
  onSearch: (query: string) => void;
}

export default function Categories({ onSelect, onNearMe, onSearch }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<ApiResponse['meta']>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      setStatus('loading');
      const r = await fetch('/api/categories');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: ApiResponse = await r.json();
      setCategories(data.categories);
      setMeta(data.meta);
      setMessage(data.warning ?? '');
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : String(err));
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
        <button className="near-me" onClick={onNearMe}>
          📍 Offers near me
        </button>
      </div>

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const q = search.trim();
          if (q) onSearch(q);
        }}
      >
        <input
          className="search"
          type="search"
          placeholder="Search all offers across every category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="near-me" type="submit" disabled={!search.trim()}>
          Search
        </button>
      </form>

      {message && <p className="warning">{message}</p>}
      {status === 'loading' && <p className="state">Loading categories…</p>}
      {status === 'error' && <p className="state error">Failed to load: {message}</p>}

      {status === 'ready' && (
        <ul className="list">
          {categories.map((c) => (
            <li
              key={c.id}
              className="row clickable"
              onClick={() => onSelect({ id: c.id, name: c.name })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect({ id: c.id, name: c.name });
              }}
            >
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
              <span className="chevron">›</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
