export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!keyId || !keySecret) {
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

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
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

    return res.status(200).json({
      success: true,
      keyId,
      order: data
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message
    });
  }
}
