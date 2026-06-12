import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadLocalEnv = () => {
  const envFiles = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env')
  ];

  envFiles.forEach((filePath) => {
    if (!fs.existsSync(filePath)) return;

    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .forEach((line) => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!match) return;

        const [, key, rawValue] = match;
        if (process.env[key]) return;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
      });
  });
};

loadLocalEnv();

const PORT = Number(process.env.PORT) || 5000;

const CURRENT_DAILY_PRICE_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const DEFAULT_LIMIT = 100;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const COMMODITY_ALIASES = {
  Rice: ['Rice', 'Paddy', 'Paddy(Dhan)(Common)', 'Paddy(Dhan)(Fine)', 'Paddy(Dhan)(Super Fine)', 'Paddy(Dhan)(Basmati)'],
  Maize: ['Maize', 'Makka'],
  Wheat: ['Wheat'],
  Groundnut: ['Groundnut', 'Ground Nut Seed'],
  Tomato: ['Tomato'],
  Potato: ['Potato'],
  Onion: ['Onion']
};

const stateCache = new Map();
const STATE_CACHE_TTL_MS = 15 * 60 * 1000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Market Price API Server is running' });
});

const isRazorpayConfigured = () => Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

app.get('/api/razorpay-config', (_req, res) => {
  res.json({
    success: true,
    configured: isRazorpayConfigured(),
    keyId: RAZORPAY_KEY_ID || null,
    mode: RAZORPAY_KEY_ID.startsWith('rzp_live_') ? 'live' : 'test'
  });
});

app.post('/api/razorpay-create-order', async (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(200).json({
      success: false,
      error: 'Razorpay keys are not configured on the API server.'
    });
  }

  try {
    const amount = Number(req.body.amount);
    const currency = req.body.currency || 'INR';
    const receipt = req.body.receipt || `receipt_${Date.now()}`;
    const notes = req.body.notes || {};

    if (!Number.isInteger(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment amount.'
      });
    }

    const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: data?.error?.description || 'Unable to create Razorpay order.'
      });
    }

    return res.json({
      success: true,
      keyId: RAZORPAY_KEY_ID,
      order: data
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/razorpay-verify-payment', (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(200).json({
      success: false,
      error: 'Razorpay keys are not configured on the API server.'
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      error: 'Missing Razorpay payment verification fields.'
    });
  }

  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return res.json({
    success: generatedSignature === razorpay_signature,
    error: generatedSignature === razorpay_signature ? undefined : 'Payment signature verification failed.'
  });
});

const getCommodityCandidates = (commodity) => {
  if (!commodity) return [];
  const normalized = String(commodity).trim();
  if (!normalized) return [];
  const aliases = COMMODITY_ALIASES[normalized] || COMMODITY_ALIASES[normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()] || [];
  return [...new Set([normalized, ...aliases])];
};

const parseArrivalDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  const [day, month, year] = dateString.split('/').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

const buildCurrentDailyUrl = ({ commodity, state, district, market, limit = DEFAULT_LIMIT, date }) => {
  const params = new URLSearchParams({
    'api-key': API_KEY,
    format: 'json',
    limit: String(limit)
  });

  if (state) params.set('filters[state]', state);
  if (district) params.set('filters[district]', district);
  if (market) params.set('filters[market]', market);
  if (commodity) params.set('filters[commodity]', commodity);
  if (date) params.set('filters[arrival_date]', date);

  return `${CURRENT_DAILY_PRICE_API}?${params.toString()}`;
};

const isValidPriceRecord = (record) => {
  if (!record || typeof record !== 'object') return false;
  return Boolean(record.market && record.arrival_date && record.modal_price !== undefined && record.modal_price !== null);
};

const fetchCurrentDailyDataset = async ({ commodity, state, district, market, limit = DEFAULT_LIMIT, date }, timeoutMs = 5000) => {
  const commodityCandidates = getCommodityCandidates(commodity);
  const requests = commodityCandidates.length ? commodityCandidates : [''];
  let sawRateLimit = false;

  for (const commodityCandidate of requests) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = buildCurrentDailyUrl({
        commodity: commodityCandidate || undefined,
        state,
        district,
        market,
        limit,
        date
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'FarmerManagementSystem/1.0' },
        signal: controller.signal
      });

      if (response.status === 429) {
        sawRateLimit = true;
        continue;
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (typeof data?.message === 'string' && data.message.includes('"error"')) {
        throw new Error('Government market API rejected the query');
      }

      const records = Array.isArray(data?.records) ? data.records.filter(isValidPriceRecord) : [];
      records.sort((a, b) => {
        const bDate = parseArrivalDate(b.arrival_date);
        const aDate = parseArrivalDate(a.arrival_date);
        return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
      });

      if (records.length) {
        return {
          success: true,
          rateLimited: false,
          data: { ...data, records },
          commodityUsed: commodityCandidate || commodity || null
        };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    success: !sawRateLimit,
    rateLimited: sawRateLimit,
    data: { records: [] },
    commodityUsed: commodityCandidates[0] || commodity || null
  };
};

const fetchCurrentDailyPage = async ({ commodity, state, district, market, limit = 10, offset = 0, date }, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${buildCurrentDailyUrl({ commodity, state, district, market, limit, date })}&offset=${encodeURIComponent(offset)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'FarmerManagementSystem/1.0' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.status === 429) {
      return { success: false, rateLimited: true, data: { records: [] } };
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (typeof data?.message === 'string' && data.message.includes('"error"')) {
      throw new Error('Government market API rejected the query');
    }

    const records = Array.isArray(data?.records) ? data.records.filter(isValidPriceRecord) : [];
    return { success: true, rateLimited: false, data: { ...data, records } };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  }
};

const fetchAvailableStates = async (commodity, date = null) => {
  const cacheKey = `${commodity || 'all'}:${date || 'latest'}`;
  const cached = stateCache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < STATE_CACHE_TTL_MS) {
    return cached.value;
  }

  const candidates = getCommodityCandidates(commodity);
  const commodityRequests = candidates.length ? candidates : [''];
  const states = new Set();
  let totalRecords = 0;
  let rateLimited = false;

  for (const commodityCandidate of commodityRequests) {
    const firstPage = await fetchCurrentDailyPage({
      commodity: commodityCandidate || undefined,
      limit: 10,
      offset: 0,
      date
    }, 8000);

    if (firstPage.rateLimited) {
      rateLimited = true;
      continue;
    }

    const total = Number(firstPage.data.total || firstPage.data.records?.length || 0);
    totalRecords += total;
    firstPage.data.records?.forEach((record) => {
      if (record.state) states.add(record.state);
    });

    const maxPages = Math.min(Math.ceil(total / 10), 20);

    for (let page = 1; page < maxPages; page += 1) {
      const pageResult = await fetchCurrentDailyPage({
        commodity: commodityCandidate || undefined,
        limit: 10,
        offset: page * 10,
        date
      }, 8000);

      if (pageResult.rateLimited) {
        rateLimited = true;
        break;
      }

      pageResult.data.records?.forEach((record) => {
        if (record.state) states.add(record.state);
      });
    }

    if (states.size) break;
  }

  const value = {
    success: states.size > 0,
    rateLimited,
    data: {
      states: [...states].sort((a, b) => a.localeCompare(b)),
      totalRecords
    }
  };

  if (value.data.states.length) {
    stateCache.set(cacheKey, { createdAt: Date.now(), value });
  }

  return value;
};

app.get('/api/market-prices', async (req, res) => {
  const { commodity = 'Rice', state = 'Karnataka', district, market, limit = 10, date } = req.query;
  console.log(`[API] Fetching market prices for ${commodity} in ${state}${date ? ` on ${date}` : ''}`);

  try {
    const result = await fetchCurrentDailyDataset({
      commodity,
      state,
      district,
      market,
      limit,
      date
    });

    console.log(`[API] Fetched ${result.data.records?.length || 0} records for ${commodity}${result.commodityUsed && result.commodityUsed !== commodity ? ` using alias ${result.commodityUsed}` : ''}`);
    return res.json({
      success: result.success,
      error: result.rateLimited ? 'rate_limited' : undefined,
      data: result.data,
      commodityUsed: result.commodityUsed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const msg = error.message;
    console.error(`[API] Error fetching market prices: ${msg}`);
    return res.json({ success: false, error: msg, data: { records: [] } });
  }
});

app.get('/api/market-states', async (req, res) => {
  const { commodity, date } = req.query;
  console.log(`[API] Fetching available states${commodity ? ` for ${commodity}` : ''}`);

  try {
    const result = await fetchAvailableStates(commodity, date);
    return res.json({
      success: result.success,
      error: result.rateLimited ? 'rate_limited' : undefined,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const msg = error.message;
    console.error(`[API] Error fetching market states: ${msg}`);
    return res.json({ success: false, error: msg, data: { states: [], totalRecords: 0 } });
  }
});

app.get('/api/market-locations', async (req, res) => {
  const { state = 'Karnataka', commodity, limit = 500 } = req.query;

  try {
    let result = await fetchCurrentDailyDataset({
      commodity,
      state,
      limit
    }, 8000);

    if (!result.data.records.length) {
      result = await fetchCurrentDailyDataset({
        state,
        limit
      }, 8000);
    }

    const records = result.data.records || [];
    const districts = [...new Set(records.map((record) => record.district).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const marketsByDistrict = records.reduce((groups, record) => {
      if (!record.district || !record.market) return groups;
      if (!groups[record.district]) groups[record.district] = [];
      if (!groups[record.district].includes(record.market)) groups[record.district].push(record.market);
      return groups;
    }, {});

    Object.keys(marketsByDistrict).forEach((recordDistrict) => {
      marketsByDistrict[recordDistrict].sort((a, b) => a.localeCompare(b));
    });

    return res.json({
      success: result.success,
      error: result.rateLimited ? 'rate_limited' : undefined,
      data: { districts, marketsByDistrict },
      commodityUsed: result.commodityUsed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const msg = error.message;
    console.error(`[API] Error fetching market locations: ${msg}`);
    return res.json({ success: false, error: msg, data: { districts: [], marketsByDistrict: {} } });
  }
});

app.get('/api/price-trends', async (req, res) => {
  const { commodity = 'Rice', state = 'Karnataka', district, market, days = 30 } = req.query;
  console.log(`[API] Fetching price trends for ${commodity} (${days} days)`);

  try {
    const result = await fetchCurrentDailyDataset({
      commodity,
      state,
      district,
      market,
      limit: Math.max(Number(days) * 4, 120)
    });

    return res.json({
      success: result.success,
      error: result.rateLimited ? 'rate_limited' : undefined,
      data: result.data,
      commodityUsed: result.commodityUsed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const msg = error.message;
    console.error(`[API] Error fetching price trends: ${msg}`);
    return res.json({ success: false, error: msg, data: { records: [] } });
  }
});

app.get('/api/soil-data', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ success: false, error: 'lat and lon are required' });
  }

  console.log(`[API] Fetching soil data for lat=${lat}, lon=${lon}`);

  try {
    const url =
      `https://rest.isric.org/soilgrids/v2.0/properties/query` +
      `?lon=${lon}&lat=${lat}` +
      `&property=phh2o&property=nitrogen&property=soc&property=clay` +
      `&depth=0-5cm&depth=5-15cm&value=mean`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'FarmerManagementSystem/1.0' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`SoilGrids returned ${response.status}`);

    const data = await response.json();
    console.log(`[API] SoilGrids data fetched successfully`);
    return res.json({ success: true, data });
  } catch (error) {
    const msg = error.name === 'AbortError' ? 'SoilGrids request timed out' : error.message;
    console.error(`[API] Soil data error: ${msg}`);
    return res.json({ success: false, error: msg });
  }
});

app.get('/api/commodities', (_req, res) => {
  res.json({
    success: true,
    commodities: [
      'Rice', 'Maize', 'Wheat', 'Groundnut',
      'Tomato', 'Potato', 'Onion', 'Cotton',
      'Sugarcane', 'Turmeric', 'Chilli'
    ]
  });
});

const server = app.listen(PORT, () => {
  console.log(`\nMarket Price API Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Market prices: http://localhost:${PORT}/api/market-prices?commodity=Rice&state=Karnataka\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`\nPort ${PORT} is already in use.`);
    console.log(`Another API server is already running at http://localhost:${PORT}`);
    console.log(`Use http://localhost:${PORT}/health to verify it, or stop that process before starting a new one.\n`);
    process.exit(0);
  }

  console.error('Server error:', error);
  process.exit(1);
});
