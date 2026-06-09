// SQLite-backed cache for offer categories.
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'categories.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Migration: the offers cache schema has changed twice. It used to be keyed by a
// single category_id (offers are actually tagged with many categories → category_ids
// JSON), and now also stores subcategory_ids. The cache is disposable, so whenever a
// required column is missing we drop it and let it re-download from upstream.
const offerCols = db.prepare(`PRAGMA table_info(offers)`).all();
const hasCol = (name) => offerCols.some((c) => c.name === name);
if (
  offerCols.length &&
  (!hasCol('category_ids') || !hasCol('subcategory_ids') || !hasCol('locations'))
) {
  db.exec('DROP TABLE IF EXISTS offers');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    tooltip         TEXT NOT NULL DEFAULT '',
    image           TEXT NOT NULL DEFAULT '',
    is_user_selected INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS offers (
    id                INTEGER PRIMARY KEY,
    category_ids      TEXT NOT NULL DEFAULT '[]',
    subcategory_ids   TEXT NOT NULL DEFAULT '[]',
    brand_name        TEXT NOT NULL DEFAULT '',
    brand_logo        TEXT NOT NULL DEFAULT '',
    title             TEXT NOT NULL DEFAULT '',
    short_description TEXT NOT NULL DEFAULT '',
    discount          TEXT NOT NULL DEFAULT '',
    discount_num      INTEGER NOT NULL DEFAULT 0,
    website           TEXT NOT NULL DEFAULT '',
    telephone         TEXT NOT NULL DEFAULT '',
    email             TEXT NOT NULL DEFAULT '',
    valid_from        TEXT NOT NULL DEFAULT '',
    valid_to          TEXT NOT NULL DEFAULT '',
    image             TEXT NOT NULL DEFAULT '',
    locations         TEXT NOT NULL DEFAULT '[]',
    raw               TEXT NOT NULL DEFAULT '{}',
    updated_at        TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subcategories (
    id          INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL,
    name        TEXT NOT NULL,
    offer_count INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const upsertStmt = db.prepare(`
  INSERT INTO categories (id, name, tooltip, image, is_user_selected, updated_at)
  VALUES (@id, @name, @tooltip, @image, @isUserSelected, @updatedAt)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    tooltip = excluded.tooltip,
    image = excluded.image,
    is_user_selected = excluded.is_user_selected,
    updated_at = excluded.updated_at
`);

const setMetaStmt = db.prepare(
  `INSERT INTO meta (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value`
);

// Replace the cached category set with a fresh fetch.
export function saveCategories(categories) {
  const updatedAt = new Date().toISOString();
  const tx = db.transaction((rows) => {
    db.prepare('DELETE FROM categories').run();
    for (const c of rows) {
      upsertStmt.run({ ...c, isUserSelected: c.isUserSelected ? 1 : 0, updatedAt });
    }
    setMetaStmt.run('last_refreshed', updatedAt);
    setMetaStmt.run('count', String(rows.length));
  });
  tx(categories);
  return updatedAt;
}

export function getCategories() {
  const rows = db
    .prepare('SELECT * FROM categories ORDER BY name COLLATE NOCASE')
    .all();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    tooltip: r.tooltip,
    image: r.image,
    isUserSelected: Boolean(r.is_user_selected),
  }));
}

const upsertOfferStmt = db.prepare(`
  INSERT INTO offers (
    id, category_ids, subcategory_ids, brand_name, brand_logo, title,
    short_description, discount, discount_num, website, telephone, email,
    valid_from, valid_to, image, locations, raw, updated_at
  ) VALUES (
    @id, @categoryIds, @subcategoryIds, @brandName, @brandLogo, @title,
    @shortDescription, @discount, @discountNum, @website, @telephone, @email,
    @validFrom, @validTo, @image, @locations, @raw, @updatedAt
  )
  ON CONFLICT(id) DO UPDATE SET
    category_ids = excluded.category_ids,
    subcategory_ids = excluded.subcategory_ids,
    brand_name = excluded.brand_name,
    brand_logo = excluded.brand_logo,
    title = excluded.title,
    short_description = excluded.short_description,
    discount = excluded.discount,
    discount_num = excluded.discount_num,
    website = excluded.website,
    telephone = excluded.telephone,
    email = excluded.email,
    valid_from = excluded.valid_from,
    valid_to = excluded.valid_to,
    image = excluded.image,
    locations = excluded.locations,
    raw = excluded.raw,
    updated_at = excluded.updated_at
`);

// Parse the leading number out of a discount string ("20", "Up to 50%" -> 20/50).
function discountToNum(discount) {
  const m = String(discount ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

// Replace the entire offers cache with a fresh full download.
export function saveOffers(offers) {
  const updatedAt = new Date().toISOString();
  const tx = db.transaction((rows) => {
    db.prepare('DELETE FROM offers').run();
    for (const o of rows) {
      upsertOfferStmt.run({
        ...o,
        categoryIds: JSON.stringify(o.categoryIds ?? []),
        subcategoryIds: JSON.stringify(o.subcategoryIds ?? []),
        locations: JSON.stringify(o.locations ?? []),
        discountNum: discountToNum(o.discount),
        raw: JSON.stringify(o.raw ?? {}),
        updatedAt,
      });
    }
    setMetaStmt.run('offers_last_refreshed', updatedAt);
    setMetaStmt.run('offers_count', String(rows.length));
  });
  tx(offers);
  return updatedAt;
}

function rowToOffer(r) {
  return {
    id: r.id,
    categoryIds: JSON.parse(r.category_ids || '[]'),
    subcategoryIds: JSON.parse(r.subcategory_ids || '[]'),
    brandName: r.brand_name,
    brandLogo: r.brand_logo,
    title: r.title,
    shortDescription: r.short_description,
    discount: r.discount,
    discountNum: r.discount_num,
    website: r.website,
    telephone: r.telephone,
    email: r.email,
    validFrom: r.valid_from,
    validTo: r.valid_to,
    image: r.image,
    locations: JSON.parse(r.locations || '[]'),
  };
}

// Great-circle distance in km between two lat/lng points (haversine).
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// The nearest of an offer's locations to a point, as { distanceKm, location },
// or null when the offer has no locations.
function nearestLocation(locations, lat, lng) {
  let best = null;
  for (const loc of locations) {
    const d = distanceKm(lat, lng, loc.lat, loc.lng);
    if (best == null || d < best.distanceKm) best = { distanceKm: d, location: loc };
  }
  return best;
}

// Query the offer cache with optional global text search, category filter, and
// minimum discount. All filters combine (AND).
export function queryOffers({
  q = '',
  categoryId,
  subCategoryId,
  minDiscount = 0,
  lat,
  lng,
  radiusKm,
} = {}) {
  const where = [];
  const params = {};

  if (q.trim()) {
    where.push('(brand_name LIKE @q OR title LIKE @q OR short_description LIKE @q)');
    params.q = `%${q.trim()}%`;
  }
  if (minDiscount > 0) {
    where.push('discount_num >= @minDiscount');
    params.minDiscount = minDiscount;
  }
  // category_ids is a JSON array of numbers, e.g. [2282,4318]; match the id as a
  // whole token so 2282 doesn't match 22820.
  if (categoryId != null && categoryId !== '') {
    where.push(`(',' || REPLACE(REPLACE(category_ids, '[', ''), ']', '') || ',') LIKE @cat`);
    params.cat = `%,${Number(categoryId)},%`;
  }
  // subcategory_ids matched the same whole-token way.
  if (subCategoryId != null && subCategoryId !== '') {
    where.push(`(',' || REPLACE(REPLACE(subcategory_ids, '[', ''), ']', '') || ',') LIKE @sub`);
    params.sub = `%,${Number(subCategoryId)},%`;
  }

  const sql =
    'SELECT * FROM offers' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY discount_num DESC, brand_name COLLATE NOCASE';
  const rows = db.prepare(sql).all(params).map(rowToOffer);

  // No location supplied → return as-is.
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
  if (!hasPoint) return rows;

  // Annotate every offer with the distance to its nearest venue so each card can
  // show how far away it is (offers with no coordinates get distanceKm = null).
  const annotated = rows.map((o) => {
    const near = nearestLocation(o.locations, lat, lng);
    return near
      ? { ...o, distanceKm: near.distanceKm, nearestLocation: near.location }
      : { ...o, distanceKm: null, nearestLocation: null };
  });

  // A radius means "near me" mode: keep only offers in range, sorted closest-first.
  // Without a radius we only annotate, preserving the default (discount) ordering.
  if (Number.isFinite(radiusKm) && radiusKm > 0) {
    return annotated
      .filter((o) => o.distanceKm != null && o.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
  return annotated;
}

// Total cached offers, and counts per category and per subcategory id.
export function getOfferStats() {
  const rows = db.prepare('SELECT category_ids, subcategory_ids FROM offers').all();
  const byCategory = {};
  const bySubcategory = {};
  for (const r of rows) {
    for (const id of JSON.parse(r.category_ids || '[]')) {
      byCategory[id] = (byCategory[id] || 0) + 1;
    }
    for (const id of JSON.parse(r.subcategory_ids || '[]')) {
      bySubcategory[id] = (bySubcategory[id] || 0) + 1;
    }
  }
  return { total: rows.length, byCategory, bySubcategory };
}

const upsertSubcategoryStmt = db.prepare(`
  INSERT INTO subcategories (id, category_id, name, offer_count, updated_at)
  VALUES (@id, @categoryId, @name, @count, @updatedAt)
  ON CONFLICT(id) DO UPDATE SET
    category_id = excluded.category_id,
    name = excluded.name,
    offer_count = excluded.offer_count,
    updated_at = excluded.updated_at
`);

// Replace the cached subcategory taxonomy with a fresh sweep.
export function saveSubcategories(subcategories) {
  const updatedAt = new Date().toISOString();
  const tx = db.transaction((rows) => {
    db.prepare('DELETE FROM subcategories').run();
    for (const s of rows) {
      upsertSubcategoryStmt.run({ ...s, updatedAt });
    }
    setMetaStmt.run('subcategories_count', String(rows.length));
  });
  tx(subcategories);
  return updatedAt;
}

export function getSubcategories(categoryId) {
  const sql =
    'SELECT id, category_id, name, offer_count FROM subcategories' +
    (categoryId != null && categoryId !== '' ? ' WHERE category_id = @categoryId' : '') +
    ' ORDER BY name COLLATE NOCASE';
  return db
    .prepare(sql)
    .all(categoryId != null && categoryId !== '' ? { categoryId: Number(categoryId) } : {})
    .map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      name: r.name,
      offerCount: r.offer_count,
    }));
}

export function getMeta() {
  const rows = db.prepare('SELECT key, value FROM meta').all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export default db;
