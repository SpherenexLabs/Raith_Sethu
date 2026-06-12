// Vercel Serverless Function - Price Trends from AGMARKNET API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { commodity = 'Rice', state = 'Karnataka', district, market, days = 30 } = req.query;

    const AGMARKNET_BASE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

    const districtFilter = district ? `&filters[district]=${encodeURIComponent(district)}` : '';
    const marketFilter = market ? `&filters[market]=${encodeURIComponent(market)}` : '';
    const url = `${AGMARKNET_BASE}?api-key=${API_KEY}&format=json&limit=100&filters[state]=${encodeURIComponent(state)}${districtFilter}${marketFilter}&filters[commodity]=${encodeURIComponent(commodity)}`;

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

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const records = Array.isArray(data.records)
      ? data.records.filter((record) => record.market && record.arrival_date && record.modal_price !== undefined)
      : [];

    return res.status(200).json({
      success: true,
      data: { ...data, records },
      source: 'AGMARKNET Government API',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching price trends:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      data: { records: [] }
    });
  }
}
