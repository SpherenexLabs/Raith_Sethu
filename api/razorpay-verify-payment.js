import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!keySecret) {
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
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return res.status(200).json({
    success: generatedSignature === razorpay_signature,
    error: generatedSignature === razorpay_signature ? undefined : 'Payment signature verification failed.'
  });
}
