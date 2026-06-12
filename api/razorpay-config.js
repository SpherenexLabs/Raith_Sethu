export default async function handler(_req, res) {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  return res.status(200).json({
    success: true,
    configured: Boolean(keyId && keySecret),
    keyId: keyId || null,
    mode: keyId.startsWith('rzp_live_') ? 'live' : 'test'
  });
}
