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
    website: d.offerContactWebsite ?? '',
    telephone: d.offerContactTelephone ?? '',
    email: d.offerContactEmail ?? '',
    validFrom: v.validFrom ?? '',
    validTo: v.validTo ?? '',
    image: abs(Array.isArray(d.images) ? d.images[0] : ''),
    // The offer's true category membership (an offer can belong to several).
    categoryIds: Array.isArray(d.categoryIds) ? d.categoryIds : [],
    raw: offer, // full payload, for a detail view later
  };
}

// Fetch ALL offers in the programme, paging until we've collected the reported
// total. The upstream "alloffers" listing ignores categoryId and returns the
// full set; each offer carries its own categoryIds. Returns { offers, total }.
export async function fetchAllOffers(pageSize = 50) {
  const collected = [];
  let total = Infinity;
  for (let page = 1; collected.length < total; page++) {
    const body = {
      pageType: 'alloffers',
      currentPageNo: page,
      pageSize,
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
      minDiscount: 5,
      maxDiscount: 50,
      isFilterApplied: false,
      latitude: 0,
      longitude: 0,
    };
    const res = await fetch(OFFERS_URL, {
      method: 'POST',
      headers: { ...HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Upstream GetOfferListing failed: HTTP ${res.status}`);
    const raw = await res.json();
    const bucket = raw?.responseModel?.data?.offers?.[0];
    const pageOffers = bucket?.categoryOffers;
    if (!Array.isArray(pageOffers)) {
      throw new Error('Unexpected GetOfferListing response shape');
    }
    total = bucket.categoryOffercount ?? pageOffers.length;
    collected.push(...pageOffers.map((o) => normaliseOffer(o)));
    if (pageOffers.length === 0) break; // safety: stop if a page is empty
  }
  return { offers: collected, total };
}

export { BASE_URL };
