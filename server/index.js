import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchCategories, fetchAllOffers } from './upstream.js';
import {
  saveCategories,
  getCategories,
  saveOffers,
  saveSubcategories,
  getSubcategories,
  queryOffers,
  getOfferStats,
  getMeta,
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

// Lightweight health check for the ALB target group.
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Pull from upstream and refresh the SQLite cache. Returns the saved rows.
async function refresh() {
  const { categories } = await fetchCategories();
  const lastRefreshed = saveCategories(categories);
  console.log(`Cached ${categories.length} categories at ${lastRefreshed}`);
  return categories;
}

// Categories from the cache. If empty (cold start), fetch upstream first.
app.get('/api/categories', async (_req, res) => {
  try {
    let categories = getCategories();
    if (categories.length === 0) {
      categories = await refresh();
    }
    res.json({ categories, meta: getMeta() });
  } catch (err) {
    console.error(err);
    // Serve whatever is cached even if a live refresh failed.
    const categories = getCategories();
    if (categories.length > 0) {
      return res.json({ categories, meta: getMeta(), warning: String(err.message) });
    }
    res.status(502).json({ error: String(err.message) });
  }
});

// Download the full offer set from upstream into the SQLite cache.
async function refreshOffers() {
  const { offers, total, subcategories } = await fetchAllOffers();
  const lastRefreshed = saveOffers(offers);
  saveSubcategories(subcategories);
  console.log(
    `Cached ${offers.length}/${total} offers and ${subcategories.length} subcategories at ${lastRefreshed}`
  );
  return offers;
}

// Subcategories from the cache, optionally scoped to one category.
//   ?categoryId=<id>     only subcategories under that category
app.get('/api/subcategories', (req, res) => {
  res.json({ subcategories: getSubcategories(req.query.categoryId), meta: getMeta() });
});

// Search/filter offers from the cache.
//   ?q=<text>            global search over brand, title, description
//   ?categoryId=<id>     only offers tagged with that category
//   ?subCategoryId=<id>  only offers tagged with that subcategory
//   ?minDiscount=<n>     only offers with discount >= n  (e.g. 50)
//   ?lat=&lng=&radiusKm= only offers with a venue within radiusKm of (lat,lng),
//                        annotated with distanceKm and sorted nearest-first
// Cold-fetches the full set if the cache is empty.
app.get('/api/offers', async (req, res) => {
  const num = (v) => (v == null || v === '' ? undefined : Number(v));
  const filters = {
    q: req.query.q ?? '',
    categoryId: req.query.categoryId,
    subCategoryId: req.query.subCategoryId,
    minDiscount: Number(req.query.minDiscount) || 0,
    lat: num(req.query.lat),
    lng: num(req.query.lng),
    radiusKm: num(req.query.radiusKm),
  };
  try {
    if (getOfferStats().total === 0) {
      await refreshOffers();
    }
    const offers = queryOffers(filters);
    res.json({ offers, stats: getOfferStats(), meta: getMeta() });
  } catch (err) {
    console.error(err);
    const stats = getOfferStats();
    if (stats.total > 0) {
      return res.json({ offers: queryOffers(filters), stats, meta: getMeta(), warning: String(err.message) });
    }
    res.status(502).json({ error: String(err.message) });
  }
});

// Force a re-download of all offers from upstream.
app.post('/api/offers/refresh', async (_req, res) => {
  try {
    await refreshOffers();
    res.json({ offers: queryOffers({}), stats: getOfferStats(), meta: getMeta() });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: String(err.message) });
  }
});

// Force a re-fetch from upstream.
app.post('/api/refresh', async (_req, res) => {
  try {
    const categories = await refresh();
    res.json({ categories, meta: getMeta() });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: String(err.message) });
  }
});

// Serve the built Vite frontend (produced by `vite build` into ./dist). In dev
// this directory won't exist and the Vite dev server handles the UI instead.
app.use(express.static(DIST_DIR));
// SPA fallback: any non-/api, non-asset path returns index.html.
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(join(DIST_DIR, 'index.html'), (err) => {
    if (err) res.status(404).end();
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
