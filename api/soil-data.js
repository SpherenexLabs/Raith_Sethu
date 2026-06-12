// Vercel Serverless Function - SoilGrids v2.0 Proxy (avoids browser CORS)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ success: false, error: 'lat and lon are required' });
  }

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
    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
}
