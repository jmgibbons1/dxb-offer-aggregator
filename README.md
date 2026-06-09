# Platinum Card — Offer Categories

Fetches offer categories from the Platinum Card Offers API (`GetCategories`) and
all **Food & Drink** offers (`GetOfferListing`), caches them in a local SQLite
database, and displays them in a tabbed Vite + React app.

## Architecture

```
getCategories (live API)
        │  fetch with captured headers/token
        ▼
server/  Express + better-sqlite3   →  caches into server/categories.db
        │  GET /api/categories  (reads cache, cold-fetches if empty)
        │  POST /api/refresh     (forces a live re-fetch)
        ▼
src/     Vite + React + TS         →  list view at http://localhost:5173
```

The Vite dev server proxies `/api/*` to the Express server on port 3001.

### Endpoints

| Method | Path                  | Purpose                                          |
| ------ | --------------------- | ------------------------------------------------ |
| GET    | `/api/categories`     | Categories from cache (cold-fetches if empty)    |
| POST   | `/api/refresh`        | Force a live re-fetch of categories              |
| GET    | `/api/offers`         | Search/filter offers (see query params below)    |
| POST   | `/api/offers/refresh` | Force a live re-download of the full offer set   |

`GET /api/offers` query params (all optional, combined with AND):

| Param         | Example         | Effect                                        |
| ------------- | --------------- | --------------------------------------------- |
| `q`           | `?q=steak`      | Global text search: brand, title, description |
| `categoryId`  | `?categoryId=2282` | Only offers tagged with that category      |
| `minDiscount` | `?minDiscount=50`  | Only offers with discount ≥ N%             |

The response also includes `stats.total` and `stats.byCategory` (offer counts
per category id).

Offers are paginated out of `GetOfferListing` (50/page) until the full reported
total is collected. Each offer is flattened into columns (with a numeric
`discount_num` for filtering and a JSON `category_ids` for category membership),
plus the full raw payload is kept in `raw` for a future detail view.

> **Note on categories:** `GetOfferListing` (`pageType: "alloffers"`) ignores the
> request `categoryId` and returns one combined "All Offers" feed. Category
> membership comes from each offer's own `categoryIds`. In the current feed that
> set spans only a couple of categories (mostly Food & Drink `2282`, some Leisure
> `4315`), so filtering by other categories returns nothing until the correct
> per-category offer source is wired up.

## Run

```bash
npm install
npm run dev        # starts API (:3001) and Vite (:5173) together
```

Open http://localhost:5173. Use **Refresh from API** to pull fresh data from
upstream and update the cache.

## Other commands

```bash
npm run refresh    # one-off: fetch upstream → SQLite cache
npm run build      # production build of the frontend
```

## Notes

- The `platinum_token` in [server/upstream.js](server/upstream.js) is a
  short-lived JWT captured from the original `getCategories` curl. If upstream
  starts returning 401/403, recapture the curl from the site and update `TOKEN`.
- The API normalises the upstream response: relative image paths are turned into
  absolute URLs and `isuserselected` is exposed as `isUserSelected`.
- The cache (`server/categories.db`) is gitignored. If a live refresh fails, the
  API serves whatever is already cached and returns a `warning` field.
