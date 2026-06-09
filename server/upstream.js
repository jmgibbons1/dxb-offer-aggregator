// Calls the live Platinum Card Offers getCategories endpoint.
// Mirrors the headers from the captured `getCategories` curl. The platinum_token
// is a short-lived JWT — if it expires, recapture the curl and update TOKEN below.

const BASE_URL = 'https://www.platinumcardoffers.com';
const CATEGORIES_URL = `${BASE_URL}/webapi/OfferData/GetCategories`;
const OFFERS_URL = `${BASE_URL}/webapi/OfferData/GetOfferListing`;

const TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJwbGF0aW51bUNhcmQiLCJhdWQiOiJodHRwOi8vUGxhdGludW1DYXJkb2ZmZXJzIiwibmJmIjoxNzgwOTkzODgwLCJleHAiOjE3ODA5OTUwODAsInVuaXF1ZV9uYW1lIjoiLS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLVxyXG5NSUlFcEFJQkFBS0NBUUVBejdFUmxyTWkxNVE0cXJRTUFWWTlISXFuQXB6OXBSSFVjSGFwQ3BqZnNBTTAvSUlSXHJcbmVEdnFGRlp4TVVESG0rS2srQUhZempkazJsblpnemJFMGlINGNGWno4SWhDRzlCN2hTYnhpd2cxdVVCOTdxcWVcclxud0k2eDRkbUd5TGw2ZXc4RDdQbm5zbnEyNTRGeXErQ28xM0RNUXBLNk10ejRuYVoxaFhKbDkzQUtydlJWQllnUFxyXG5xOG9SS3ZQRlY4UzBhNEIwYVBpbEZaS0FRM1ZPQ1BOb0JoQkhRV0ZYc3BZdW5IODlXdmJ1UXo5QkdFcTltTk41XHJcbk95NE9QOXVYdTRKOE5aNjVFYUpEVUVvL3VkYVRhSU04WkYwc3lJaGtFdjJUMVNKZmxRZlZiUGtrM0NpY3dpbGhcclxudGw3dU0rNGlDa05oMmJxMmh6WTNkWHdYajlaTUE4dlVNYkdyQ1FJREFRQUJBb0lCQVFDdm5ITFl6OE1vTVVYd1xyXG40S2crQVNOUEhOVzJXZlFHUFJzNXRMdWVJRUVUWE1MU3QwLzZMLzd2RDJCS1d4SHNkeWt5SXEybFFDVmdreFJkXHJcbjVGTnJzaG1WTXlSNVAxMVdrMk85NUgzY0p5YjE2dGdRaytnRHZTUWZhWVNUK0hEZDJJWmpPN056c0ZzelNMc2pcclxuSmFUZDlaeGd0aHdHb2R6OXdDQWlvK1lmNEhiSUVuMVJoRk5ldVRHbnBHR1pLQzZQdGRMa1FZMWRLeHFVUzVEblxyXG5hcitETE91WURLbUhFaDNSSi9LTTBPSDVFT3UydE5YZit2cVhtYlEzemFXWlBvMTd3UEVMZVI1Wjh3Q1d2ZVJ4XHJcbjZ5SndzUmg4NDU1Q2tLbFRqUVBPbGpNYk93dUFER1JPbHlkNmMvVk5IdTI2R25IVFRuYTFESlZZcWN1MWxxTm1cclxua3pndDNNdlpBb0dCQU5aeUFmaHZ2YWVmY0UvZkJ4ay9abTZsdm9oOGNGYWNFT2FWUXpYTUJJSTJUZjVlTE83blxyXG5VaExDbkVkNmx0Q3paejVmRjh5bXBKRkkzamhNSXlHa1YrbGZXeVZiSkRvSzZTSjU2cFVVTjJZbEdIN3lOZlVPXHJcbktkczJWajNGUm9aV2RQNEpnRnJzajdKN2VjNDFOd0tqdU0rU0hHRk5uQnA0SE5zbVBodEc1NTh6QW9HQkFQZndcclxuQ0IrOVJTYUxrWnV0NVpHRzFRbU02amdaMk93Snc5TVdpV3c3b2hmdm12RHhUemVMRjJZOStidjZ4T1NxaldHNlxyXG5xR0ViNVI0V0VucUtMUG4zZHNlQ0hIN3VVSEtjQld2b0Zaa21VQ1NkSjFtZWphdVp5YTlPMGZXK2REci9oQ29BXHJcbnZZd1d5V2QrRS9JbG9vUEtuV213b1VTWEdzSjRlckRKeVpBNG9MelRBb0dBS2Fra2NOdGtnUGdjbmFlNmZWRXZcclxuMlRjaCtPb1QrUCtBMlFzT2I1a2ZGeHp0c2draHVaZisvZDRJOW1uK2VyVWZ6YUl6d1hKdWJqczEwTUlaNFNOSVxyXG5ZUEpCaHRSYUNWeXRSaUZoVFcwTUJqQVd2akxZQUsrcnVnYW9Zbis4MzhSVUhqWkNWV2UzMHZqaUJRbVprazIwXHJcblRiOFkvRjVUZ1dEc1dqYm53ZXpZZXJrQ2dZQWZWZ1FBMXZBVmRoQmFKN2xiRWpwOHNZV3N2MytPSFpIVmJRVERcclxuWENvWmNsd1gxYmZZWWtqNzBCdHZLYnVXMXdOMWRaendZUkV0STBjRW05QWhhNmhrZ01wUE5KbVFVcTNRdkkxMlxyXG5STVJlVEVwNzVqRXJuZzFDamVpMWNYUEpQU0FjR3VuWitjdE12RCtUSERTVkNaZXBrdnhlNmVZazdBczlxdE5CXHJcbjJoWmVwd0tCZ1FDNjNGeXFwc0hLWGtUcVF6QWNRVkRnMFFHaGl6ZXU1bVdDSk54bTRITFlTWjk5bzIwd25lcHJcclxuQVpidmN1VDUrcm00b3hjWnQxUURxMzU0ejFhb0h1WVFDWXFXZDBkbys1Q2hwTTFjcmhzY0E3WjZCenJYd25KZlxyXG5IbjRsaklrY2hXWFI4QmQ5WnF5QWlDOXFHYk1yYnNkbGR0MzhyQStTMzZuYm4zdVdqMm10c0E9PVxyXG4tLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLVxyXG4ifQ.KDzpQLIBtYBGrfmaU5V8Yo6HrlFlGbTh56qBV4-qfps';

const HEADERS = {
  ADRUM: 'isAjax:true',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: `${BASE_URL}/`,
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36',
  'X-Security-Request': 'required',
  platinum_encsal: '#AED100$',
  platinum_token: TOKEN,
  platinum_userid: '1d3d3e67-1693-44d8-88b0-0be6380b1c5a',
};

// Returns { categories: [...], raw } or throws on network / parse failure.
export async function fetchCategories() {
  const res = await fetch(CATEGORIES_URL, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Upstream getCategories failed: HTTP ${res.status}`);
  }
  const raw = await res.json();
  const categories = raw?.responseModel?.data?.categories;
  if (!Array.isArray(categories)) {
    throw new Error('Unexpected getCategories response shape');
  }
  // Normalise: turn relative image paths into absolute URLs.
  const normalised = categories.map((c) => ({
    id: c.id,
    name: c.name,
    tooltip: c.tooltip ?? '',
    image: c.image ? `${BASE_URL}${c.image}` : '',
    isUserSelected: Boolean(c.isuserselected),
  }));
  return { categories: normalised, raw };
}

const abs = (path) => (path ? `${BASE_URL}${path}` : '');

// Upstream contact websites are often bare hosts ("www.radissonblu.com") with no
// scheme, which browsers treat as a relative path. Force an absolute https URL.
const httpUrl = (url) => {
  const u = String(url ?? '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

// Flatten one raw offer (offerData + envelope fields) into a stored row.
function normaliseOffer(offer) {
  const d = offer.offerData ?? {};
  const v = d.offerValidity ?? {};
  return {
    id: offer.id,
    brandName: d.brandName ?? '',
    brandLogo: abs(d.brandLogo),
    title: d.title ?? '',
    shortDescription: d.shortDescription ?? '',
    discount: offer.discount ?? '',
    website: httpUrl(d.offerContactWebsite),
    telephone: d.offerContactTelephone ?? '',
    email: d.offerContactEmail ?? '',
    validFrom: v.validFrom ?? '',
    validTo: v.validTo ?? '',
    image: abs(Array.isArray(d.images) ? d.images[0] : ''),
    // Geocoded venue locations (an offer can have several). Coords arrive as
    // strings; keep only entries that parse to finite numbers.
    locations: Array.isArray(d.locationDetails)
      ? d.locationDetails
          .map((l) => ({
            address: l.address ?? '',
            lat: parseFloat(l.latitude),
            lng: parseFloat(l.longitude),
          }))
          .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng))
      : [],
    // The offer's true membership (an offer can belong to several of each).
    categoryIds: Array.isArray(d.categoryIds) ? d.categoryIds : [],
    subcategoryIds: Array.isArray(d.subcategories)
      ? d.subcategories.map((s) => s.id).filter((id) => id != null)
      : [],
    raw: offer, // full payload, for a detail view later
  };
}

// A pageSize large enough that every nested subcategory bucket returns in full.
// The biggest subcategory currently holds a few hundred offers; this leaves headroom.
const CATEGORY_PAGE_SIZE = 2000;

// Strip a trailing "(123)" count off a subcategory display name.
const stripCount = (name) => String(name ?? '').replace(/\s*\(\d+\)\s*$/, '').trim();

function offerListingBody(overrides) {
  return {
    pageType: 'alloffers',
    currentPageNo: 1,
    pageSize: CATEGORY_PAGE_SIZE,
    isHeaderRequired: true,
    categoryId: 0,
    keyword: '',
    categoryName: '',
    subCategoryId: '',
    subCategoryName: '',
    subCategoryCount: 0,
    offerId: '',
    locationKeyword: '',
    sortBy: '',
    brands: [],
    features: [],
    specialOffer: false,
    // No discount band: the captured curls used 5–50, which silently drops every
    // offer outside that range. 0–100 returns the whole catalogue.
    minDiscount: 0,
    maxDiscount: 100,
    isFilterApplied: false,
    latitude: 0,
    longitude: 0,
    ...overrides,
  };
}

async function postOfferListing(body) {
  const res = await fetch(OFFERS_URL, {
    method: 'POST',
    headers: { ...HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Upstream GetOfferListing failed: HTTP ${res.status}`);
  return res.json();
}

// Fetch the ENTIRE offer catalogue.
//
// The "alloffers" listing only returns a small curated subset (~119 offers) and
// ignores the discount band, so it can't be used for a full download. Instead we
// sweep every category with pageType "category": that response nests each
// category's offers under its subcategories (subCategories[].subCategoryOffers[]),
// plus a flat categoryOffers list for categories that have no subcategories (e.g.
// Star Deals). A large pageSize makes each nested bucket return in full.
//
// Offers routinely belong to several categories/subcategories, so we dedupe by id.
// Returns { offers, total, subcategories } where subcategories is the taxonomy
// (id, categoryId, name, count) discovered during the sweep.
export async function fetchAllOffers() {
  const { categories } = await fetchCategories();
  const byId = new Map(); // offer id -> normalised offer
  const membership = new Map(); // offer id -> Set of subcategory ids it was listed under
  const subcats = new Map(); // subcategory id -> { id, categoryId, name, count }

  const addToBucket = (id, subId) => {
    if (!membership.has(id)) membership.set(id, new Set());
    if (subId != null) membership.get(id).add(subId);
  };

  for (const cat of categories) {
    const raw = await postOfferListing(
      offerListingBody({ pageType: 'category', categoryId: cat.id, categoryName: cat.name })
    );
    const bucket = raw?.responseModel?.data?.offers?.[0];
    if (!bucket) {
      throw new Error(`Unexpected GetOfferListing response for category ${cat.id}`);
    }

    // Flat offers — categories with no subcategories surface them here.
    for (const o of bucket.categoryOffers ?? []) {
      if (!byId.has(o.id)) byId.set(o.id, normaliseOffer(o));
      addToBucket(o.id, null);
    }

    // Offers nested under each subcategory.
    for (const sub of bucket.subCategories ?? []) {
      const subId = sub.subCategoryId;
      if (subId != null && !subcats.has(subId)) {
        const parsed = String(sub.subCategoryName ?? '').match(/\((\d+)\)\s*$/);
        subcats.set(subId, {
          id: subId,
          categoryId: cat.id,
          name: stripCount(sub.subCategoryName),
          count: parsed ? parseInt(parsed[1], 10) : sub.subCategoryOffers?.length ?? 0,
        });
      }
      for (const o of sub.subCategoryOffers ?? []) {
        if (!byId.has(o.id)) byId.set(o.id, normaliseOffer(o));
        addToBucket(o.id, subId);
      }
    }
  }

  // Union the bucket membership into each offer's subcategoryIds. An offer's own
  // offerData.subcategories is sometimes narrower than the buckets it actually
  // appears in, so the buckets are the more complete source of truth.
  const offers = [...byId.values()].map((o) => {
    const ids = new Set(o.subcategoryIds);
    for (const id of membership.get(o.id) ?? []) ids.add(id);
    return { ...o, subcategoryIds: [...ids] };
  });
  return { offers, total: offers.length, subcategories: [...subcats.values()] };
}

export { BASE_URL };
