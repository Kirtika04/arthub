const crypto = require('crypto');
const razorpay = require('../config/razorpay'); // Assumes your configured razorpay instance
const AppError = require('../utils/appError');

/**
 * Creates a new Razorpay Order.
 * @param {number} amount - Amount in standard currency units (e.g., INR rupees)
 * @param {string} receipt - Unique receipt identifier
 */
exports.createRazorpayOrder = async (amount, receipt = `receipt_${Date.now()}`) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in the smallest currency subunit (paise for INR)
      currency: 'INR',
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    throw new AppError(`Payment order creation failed: ${error.message`, 500);
  }
};

/**
 * Verifies the Razorpay payment signature to prevent spoofing.
 * @param {string} razorpayOrderId 
 * @param {string} razorpayPaymentId 
 * @param {string} razorpaySignature 
 */
exports.verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = razorpayOrderId + '|' + razorpayPaymentId;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpaySignature;

  return isAuthentic;
};
