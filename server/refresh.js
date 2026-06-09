// CLI: fetch categories + the full offer set from upstream into the SQLite cache.
// Usage: npm run refresh
import { fetchCategories, fetchAllOffers } from './upstream.js';
import { saveCategories, saveOffers, saveSubcategories } from './db.js';

try {
  const { categories } = await fetchCategories();
  const catAt = saveCategories(categories);
  console.log(`Cached ${categories.length} categories at ${catAt}`);

  const { offers, total, subcategories } = await fetchAllOffers();
  const offAt = saveOffers(offers);
  saveSubcategories(subcategories);
  console.log(
    `Cached ${offers.length}/${total} offers and ${subcategories.length} subcategories at ${offAt}`
  );
  process.exit(0);
} catch (err) {
  console.error('Refresh failed:', err.message);
  process.exit(1);
}
