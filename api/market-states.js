// Vercel Serverless Function - states available in current AGMARKNET data
const CURRENT_DAILY_PRICE_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const stateCache = new Map();
const STATE_CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchPage(commodity, offset = 0) {
  const params = new URLSearchParams({
    'api-key': API_KEY,
    format: 'json',
    limit: '10',
    offset: String(offset)
  });

  if (commodity) params.set('filters[commodity]', commodity);

  const response = await fetch(`${CURRENT_DAILY_PRICE_API}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'FarmerManagementSystem/1.0'
    }
  });

  if (!response.ok) {
    return { rateLimited: response.status === 429, data: { records: [] } };
  }

  return { rateLimited: false, data: await response.json() };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { commodity } = req.query;
    const cacheKey = commodity || 'all';
    const cached = stateCache.get(cacheKey);

    if (cached && Date.now() - cached.createdAt < STATE_CACHE_TTL_MS) {
      return res.status(200).json(cached.value);
    }

    const states = new Set();
    let rateLimited = false;
    const firstPage = await fetchPage(commodity, 0);

    if (firstPage.rateLimited) {
      rateLimited = true;
    }

    const total = Number(firstPage.data.total || firstPage.data.records?.length || 0);
    firstPage.data.records?.forEach((record) => {
      if (record.state) states.add(record.state);
    });

    const maxPages = Math.min(Math.ceil(total / 10), 20);

    for (let page = 1; page < maxPages; page += 1) {
      const pageResult = await fetchPage(commodity, page * 10);
      if (pageResult.rateLimited) {
        rateLimited = true;
        break;
      }
      pageResult.data.records?.forEach((record) => {
        if (record.state) states.add(record.state);
      });
    }

    const payload = {
      success: states.size > 0,
      error: rateLimited ? 'rate_limited' : undefined,
      data: {
        states: [...states].sort((a, b) => a.localeCompare(b)),
        totalRecords: total
      },
      source: 'AGMARKNET Current Daily API',
      timestamp: new Date().toISOString()
    };

    if (states.size) {
      stateCache.set(cacheKey, { createdAt: Date.now(), value: payload });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      data: { states: [], totalRecords: 0 }
    });
  }
}
