const razorpay = require('../config/razorpay'); // Adjust path to razorpay instance
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const db = require('../config/db');

exports.createCodOrder = catchAsync(async (req, res, next) => {
  const [[order]] = await db.execute(`
    SELECT o.id, o.total_amount
    FROM orders o JOIN buyers b ON b.id=o.buyer_id
    WHERE o.id=? AND b.user_id=? AND o.status IN ('pending','confirmed')
  `, [req.params.orderId, req.user.id]);
  if (!order) return next(new AppError('Pending order not found', 404));

  const [[existingPayment]] = await db.execute(
    "SELECT method,status FROM payments WHERE order_id=? AND (status='successful' OR method='cod') ORDER BY id DESC LIMIT 1",
    [order.id]
  );
  if (existingPayment?.status === 'successful') return next(new AppError('This order has already been paid', 409));
  if (existingPayment?.method === 'cod') {
    return res.status(200).json({ status: 'success', message: 'Cash on delivery is already selected' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "INSERT INTO payments (order_id,method,amount,status) VALUES (?,'cod',?,'pending')",
      [order.id, order.total_amount]
    );
    await connection.execute("UPDATE orders SET status='confirmed' WHERE id=? AND status='pending'", [order.id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  res.status(201).json({ status: 'success', message: 'Cash on delivery selected. Your order is confirmed.' });
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const [[dbOrder]] = await db.execute(`
    SELECT o.id, o.total_amount
    FROM orders o JOIN buyers b ON b.id=o.buyer_id
    WHERE o.id=? AND b.user_id=? AND o.status IN ('pending','confirmed')
  `, [req.params.orderId, req.user.id]);
  if (!dbOrder) return next(new AppError('Pending order not found', 404));

  const [[existingPayment]] = await db.execute("SELECT method,status FROM payments WHERE order_id=? AND (status='successful' OR method='cod') ORDER BY id DESC LIMIT 1", [dbOrder.id]);
  if (existingPayment?.status === 'successful') return next(new AppError('This order has already been paid', 409));
  if (existingPayment?.method === 'cod') return next(new AppError('Cash on delivery is already selected for this order', 409));

  const options = {
    amount: Math.round(Number(dbOrder.total_amount) * 100),
    currency: 'INR',
    receipt: `arthub_${dbOrder.id}_${Date.now()}`
  };

  const gatewayOrder = await razorpay.orders.create(options);

  if (!gatewayOrder) {
    return next(new AppError('Error creating Razorpay order', 500));
  }

  await db.execute(
    "INSERT INTO payments (order_id,method,transaction_id,amount,status) VALUES (?,'razorpay',?,?,'pending')",
    [req.params.orderId, gatewayOrder.id, Number(gatewayOrder.amount) / 100]
  );

  res.status(200).json({
    status: 'success',
    data: {
      order: gatewayOrder,
      keyId: process.env.RAZORPAY_KEY_ID
    }
  });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Complete payment verification details are required', 400));
  }

  const [[payment]] = await db.execute(`
    SELECT p.id FROM payments p
    JOIN orders o ON o.id=p.order_id
    JOIN buyers b ON b.id=o.buyer_id
    WHERE p.order_id=? AND p.transaction_id=? AND p.status='pending' AND b.user_id=?
    ORDER BY p.id DESC LIMIT 1
  `, [order_id, razorpay_order_id, req.user.id]);
  if (!payment) return next(new AppError('Payment attempt not found', 404));

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');

  if (razorpay_signature === expectedSign) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("UPDATE payments SET transaction_id=?,status='successful',paid_at=CURRENT_TIMESTAMP WHERE id=?", [razorpay_payment_id, payment.id]);
      await connection.execute("UPDATE orders SET status='confirmed' WHERE id=? AND status='pending'", [order_id]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: order_id
      }
    });
  } else {
    return next(new AppError('Invalid signature, payment verification failed!', 400));
  }
});
