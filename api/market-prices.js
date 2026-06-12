// Vercel Serverless Function - Market Prices from AGMARKNET API
const apiCache = new Map();
const API_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { commodity = 'Rice', state = 'Karnataka', district, market, limit = 10, date } = req.query;

    const CURRENT_DAILY_PRICE_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

    const dateFilter = date ? `&filters[arrival_date]=${encodeURIComponent(date)}` : '';
    const stateFilter = state ? `&filters[state]=${encodeURIComponent(state)}` : '';
    const districtFilter = district ? `&filters[district]=${encodeURIComponent(district)}` : '';
    const marketFilter = market ? `&filters[market]=${encodeURIComponent(market)}` : '';
    const url = `${CURRENT_DAILY_PRICE_API}?api-key=${API_KEY}&format=json&limit=${limit}${stateFilter}${districtFilter}${marketFilter}&filters[commodity]=${encodeURIComponent(commodity)}${dateFilter}`;

    const cacheKey = `${commodity}:${state}:${district || ''}:${market || ''}:${date || ''}:${limit}`;
    const hit = apiCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < API_CACHE_TTL) {
      return res.status(200).json(hit.payload);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FarmerManagementSystem/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok && response.status !== 429) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = response.ok ? await response.json() : { records: [] };
    const records = Array.isArray(data.records)
      ? data.records.filter((record) => record.market && record.arrival_date && record.modal_price !== undefined)
      : [];

    const payload = {
      success: response.status !== 429,
      error: response.status === 429 ? 'rate_limited' : undefined,
      data: { ...data, records },
      source: 'AGMARKNET Government API',
      timestamp: new Date().toISOString()
    };

    if (payload.success && records.length) {
      apiCache.set(cacheKey, { ts: Date.now(), payload });
    }

    return res.status(200).json(payload);

  } catch (error) {
    console.error('Error fetching market prices:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      data: { records: [] }
    });
  }
}
