// Vercel Serverless Function - districts and mandis from current AGMARKNET data
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { state = 'Karnataka', commodity, limit = 500 } = req.query;
    const CURRENT_DAILY_PRICE_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
    const params = new URLSearchParams({
      'api-key': API_KEY,
      format: 'json',
      limit: String(limit)
    });

    if (state) params.set('filters[state]', state);
    if (commodity) params.set('filters[commodity]', commodity);

    let response = await fetch(`${CURRENT_DAILY_PRICE_API}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FarmerManagementSystem/1.0'
      }
    });

    if (response.ok) {
      const firstData = await response.json();
      if (!firstData.records?.length && commodity) {
        params.delete('filters[commodity]');
        response = await fetch(`${CURRENT_DAILY_PRICE_API}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'FarmerManagementSystem/1.0'
          }
        });
      } else {
        response = { ok: true, json: async () => firstData };
      }
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const records = (data.records || []).filter((record) => record.market && record.district);
    const districts = [...new Set(records.map((record) => record.district).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const marketsByDistrict = records.reduce((groups, record) => {
      if (!record.district || !record.market) return groups;
      if (!groups[record.district]) groups[record.district] = [];
      if (!groups[record.district].includes(record.market)) groups[record.district].push(record.market);
      return groups;
    }, {});

    Object.keys(marketsByDistrict).forEach((district) => {
      marketsByDistrict[district].sort((a, b) => a.localeCompare(b));
    });

    return res.status(200).json({
      success: true,
      data: { districts, marketsByDistrict },
      source: 'AGMARKNET Current Daily API',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      data: { districts: [], marketsByDistrict: {} }
    });
  }
}
