import { cacheMarketData, getCachedMarketData } from './marketDataCache';

const priceCache = new Map();
const PRICE_CACHE_TTL = 5 * 60 * 1000;

const BACKEND_API = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
const KARNATAKA_STATE = 'Karnataka';

const COMMODITY_CODES = {
  rice: 'Rice',
  maize: 'Maize',
  wheat: 'Wheat',
  groundnut: 'Groundnut',
  tomato: 'Tomato',
  potato: 'Potato',
  onion: 'Onion'
};

const emptyMarketData = (date = getTodayMarketDate()) => ({
  current: null,
  yesterday: null,
  weekAgo: null,
  trend: null,
  markets: [],
  date,
  freshness: 'none'
});

function getTodayMarketDate() {
  const now = new Date();
  return formatMarketDate(now);
}

function formatMarketDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

const getRecordValue = (record, ...keys) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== '') {
      return record[key];
    }
  }
  return null;
};

const parseMarketDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return null;

  if (typeof dateString === 'string' && dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number);
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
  }

  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameMarketDate = (dateString, expectedDate) => {
  const date = parseMarketDate(dateString);
  const expected = parseMarketDate(expectedDate);

  if (!date || !expected) return false;

  return (
    date.getFullYear() === expected.getFullYear() &&
    date.getMonth() === expected.getMonth() &&
    date.getDate() === expected.getDate()
  );
};

const getLatestMarketDate = (records) => {
  const latestDate = records.reduce((latest, record) => {
    const arrivalDate = getRecordValue(record, 'arrival_date', 'Arrival_Date');
    const parsedDate = parseMarketDate(arrivalDate);

    if (!parsedDate) return latest;
    if (!latest || parsedDate > latest) return parsedDate;
    return latest;
  }, null);

  return latestDate ? formatMarketDate(latestDate) : null;
};

const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'Recently';

  const date = parseMarketDate(dateString);
  if (!date) return 'Recently';

  const now = new Date();
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffHours < 0) return date.toLocaleDateString('en-IN');
  if (isSameMarketDate(dateString, getTodayMarketDate())) return 'Today';
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
};

const processRealMarketData = (records, date = null) => {
  const targetDate = date || getLatestMarketDate(records);
  if (!targetDate) return emptyMarketData();

  const marketMap = {};

  records.forEach((record) => {
    const marketName = getRecordValue(record, 'market', 'Market') || 'Unknown Market';
    const modalPrice = Number(getRecordValue(record, 'modal_price', 'Modal_Price') || 0);
    const arrivalDate = getRecordValue(record, 'arrival_date', 'Arrival_Date') || 'N/A';
    const parsedDate = parseMarketDate(arrivalDate);

    if (!isSameMarketDate(arrivalDate, targetDate)) return;
    if (!modalPrice) return;

    if (!marketMap[marketName] || (parsedDate && parsedDate > marketMap[marketName].parsedDate)) {
      marketMap[marketName] = {
        name: marketName,
        state: getRecordValue(record, 'state', 'State'),
        district: getRecordValue(record, 'district', 'District'),
        price: modalPrice,
        updated: formatDate(arrivalDate),
        minPrice: Number(getRecordValue(record, 'min_price', 'Min_Price') || modalPrice),
        maxPrice: Number(getRecordValue(record, 'max_price', 'Max_Price') || modalPrice),
        date: arrivalDate,
        parsedDate: parsedDate || new Date(0)
      };
    }
  });

  const markets = Object.values(marketMap)
    .sort((a, b) => b.parsedDate - a.parsedDate)
    .slice(0, 4)
    .map(({ parsedDate, ...market }) => market);
  const prices = markets.map((market) => market.price).filter(Boolean);

  if (!prices.length) {
    return emptyMarketData(targetDate);
  }

  const current = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const oldest = prices[prices.length - 1] || current;

  return {
    current,
    yesterday: null,
    weekAgo: null,
    trend: current >= oldest ? 'up' : 'down',
    markets,
    date: targetDate,
    freshness: isSameMarketDate(targetDate, getTodayMarketDate()) ? 'today' : 'latest'
  };
};

export const getAvailableMarketStates = async (commodity = '') => {
  const commodityName = commodity ? (COMMODITY_CODES[commodity.toLowerCase()] || commodity) : '';

  try {
    const params = new URLSearchParams({
      limit: '500'
    });

    if (commodityName) params.set('commodity', commodityName);

    const response = await fetch(`${BACKEND_API}/market-states?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result?.data?.states) ? result.data.states : [];
  } catch (error) {
    console.error('Backend market states unavailable:', error);
    return [];
  }
};

export const getMarketLocations = async (commodity = '', state = KARNATAKA_STATE) => {
  const commodityName = commodity ? (COMMODITY_CODES[commodity.toLowerCase()] || commodity) : '';

  try {
    const params = new URLSearchParams({
      state,
      limit: '500'
    });

    if (commodityName) params.set('commodity', commodityName);

    const response = await fetch(`${BACKEND_API}/market-locations?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const result = await response.json();
    return {
      districts: Array.isArray(result?.data?.districts) ? result.data.districts : [],
      marketsByDistrict: result?.data?.marketsByDistrict && typeof result.data.marketsByDistrict === 'object'
        ? result.data.marketsByDistrict
        : {}
    };
  } catch (error) {
    console.error('Backend market locations unavailable:', error);
    return { districts: [], marketsByDistrict: {} };
  }
};

export const getKarnatakaMarketLocations = async (commodity = '') => getMarketLocations(commodity, KARNATAKA_STATE);

export const getMarketPrices = async (commodity = 'rice', state = KARNATAKA_STATE, filters = {}) => {
  const commodityName = COMMODITY_CODES[commodity.toLowerCase()] || commodity;
  const today = getTodayMarketDate();
  const { district = '', market = '' } = filters;

  const cacheKey = `${commodityName}:${state}:${district}:${market}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PRICE_CACHE_TTL) {
    return cached.data;
  }

  const setCache = (data) => priceCache.set(cacheKey, { ts: Date.now(), data });

  try {
    const params = new URLSearchParams({
      commodity: commodityName,
      state,
      date: today,
      limit: '50'
    });

    if (district) params.set('district', district);
    if (market) params.set('market', market);

    const url = `${BACKEND_API}/market-prices?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const result = await response.json();
    const records = result?.data?.records || [];

    if (!result.success || !records.length) {
      throw new Error(result.error === 'rate_limited' ? 'Market API rate limited' : (result.error || 'No backend market records'));
    }

    cacheMarketData(commodityName, state, result.data).catch(() => {});
    const todayData = processRealMarketData(records, today);
    if (todayData.markets.length) {
      setCache(todayData);
      return todayData;
    }
  } catch (error) {
    console.warn('Backend today market prices unavailable, trying latest via backend:', error);
  }

  try {
    const params = new URLSearchParams({
      commodity: commodityName,
      state,
      limit: '100'
    });

    if (district) params.set('district', district);
    if (market) params.set('market', market);

    const response = await fetch(`${BACKEND_API}/market-prices?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const result = await response.json();
    const records = result?.data?.records || [];

    if (!result.success || !records.length) {
      throw new Error(result.error === 'rate_limited' ? 'Market API rate limited' : (result.error || 'No backend latest market records'));
    }

    const latestData = processRealMarketData(records);
    if (latestData.markets.length) {
      cacheMarketData(commodityName, state, result.data).catch(() => {});
      setCache(latestData);
      return latestData;
    }
  } catch (error) {
    console.error('Backend market prices unavailable:', error);
  }

  try {
    const cachedData = await getCachedMarketData(commodityName, state);
    if (cachedData?.records?.length) {
      const fallback = processRealMarketData(cachedData.records);
      if (fallback.markets.length) return fallback;
    }
  } catch {}

  return emptyMarketData(today);
};

const processTrendData = (records, days, endDate = null) => {
  if (!records?.length) return [];
  const end = parseMarketDate(endDate);
  const dailyPrices = records.reduce((groups, record) => {
    const arrivalDate = parseMarketDate(getRecordValue(record, 'arrival_date', 'Arrival_Date'));
    const price = Number(getRecordValue(record, 'modal_price', 'Modal_Price') || 0);
    const market = getRecordValue(record, 'market', 'Market');

    if (!arrivalDate || !price) return groups;
    if (end && arrivalDate > end) return groups;

    const day = formatMarketDate(arrivalDate);
    if (!groups[day]) {
      groups[day] = {
        day,
        date: arrivalDate,
        prices: [],
        markets: new Set()
      };
    }

    groups[day].prices.push(price);
    if (market) groups[day].markets.add(market);
    return groups;
  }, {});

  return Object.values(dailyPrices)
    .sort((a, b) => a.date - b.date)
    .slice(-days)
    .map((group) => {
      const averagePrice = group.prices.reduce((sum, price) => sum + price, 0) / group.prices.length;

      return {
        day: group.day,
        price: Math.round(averagePrice),
        market: Array.from(group.markets).slice(0, 3).join(', '),
        minPrice: Math.min(...group.prices),
        maxPrice: Math.max(...group.prices)
      };
    })
    .filter((record) => record.price > 0);
};

export const getPriceTrends = async (commodity, days = 30, state = KARNATAKA_STATE, endDate = null, filters = {}) => {
  const commodityName = COMMODITY_CODES[commodity.toLowerCase()] || commodity;
  const { district = '', market = '' } = filters;

  try {
    const params = new URLSearchParams({
      commodity: commodityName,
      state,
      days: String(days)
    });

    if (district) params.set('district', district);
    if (market) params.set('market', market);

    const url = `${BACKEND_API}/price-trends?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Backend API returned ${response.status}`);

    const result = await response.json();
    if (!result.success || !result.data?.records?.length) throw new Error(result.error || 'No backend trend records');

    return processTrendData(result.data.records, days, endDate);
  } catch (error) {
    console.warn('Backend trend API unavailable:', error);
    return [];
  }
};

const buildPricePrediction = (history, days, endDate = null, basePrice = null) => {
  if (!history.length && !basePrice) return [];

  const baseDate = parseMarketDate(endDate || history[history.length - 1]?.day || getTodayMarketDate());
  if (!baseDate) return [];

  const recentHistory = history.slice(-Math.min(history.length, 14));
  const prices = recentHistory.map((item) => Number(item.price)).filter(Boolean);
  if (!prices.length && basePrice) prices.push(Number(basePrice));
  if (!prices.length) return [];

  const lastPrice = Number(basePrice) || prices[prices.length - 1];
  let slope = 0;

  if (prices.length > 1) {
    const xAverage = (prices.length - 1) / 2;
    const yAverage = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const numerator = prices.reduce((sum, price, index) => sum + ((index - xAverage) * (price - yAverage)), 0);
    const denominator = prices.reduce((sum, _price, index) => sum + ((index - xAverage) ** 2), 0);
    slope = denominator ? numerator / denominator : 0;
  }

  return Array.from({ length: days }, (_item, index) => {
    const predictionDate = addDays(baseDate, index + 1);
    const predicted = Math.max(0, Math.round(lastPrice + slope * (index + 1)));

    return {
      day: formatMarketDate(predictionDate),
      predicted,
      source: `Based on ${recentHistory.length} real AGMARKNET price days`
    };
  });
};

export const predictPrices = async (commodity, days = 14, state = KARNATAKA_STATE, endDate = null, basePrice = null, filters = {}) => {
  const history = await getPriceTrends(commodity, 30, state, endDate, filters);
  return buildPricePrediction(history, days, endDate, basePrice);
};
