const db = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const buyerFor = async userId => { const [[buyer]] = await db.execute('SELECT id FROM buyers WHERE user_id=?', [userId]); return buyer; };
exports.getProductReviews = catchAsync(async (req, res) => {
  const [reviews] = await db.execute(`SELECT r.*, u.name AS user_name FROM reviews r JOIN buyers b ON r.buyer_id=b.id JOIN users u ON b.user_id=u.id WHERE r.product_id=? ORDER BY r.created_at DESC`, [req.params.productId]);
  const [[summary]] = await db.execute('SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_reviews FROM reviews WHERE product_id=?', [req.params.productId]);
  res.json({ status:'success', data:{ reviews, avgRating:summary.avg_rating ? Number(summary.avg_rating).toFixed(1) : 0, totalReviews:summary.total_reviews } });
});
exports.createReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body; const buyer = await buyerFor(req.user.id);
  if (!buyer) return next(new AppError('Only buyer accounts can review products', 403));
  if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) return next(new AppError('Rating must be between 1 and 5', 400));
  const [[purchase]] = await db.execute(`SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id JOIN inventory i ON i.id=oi.inventory_id WHERE o.buyer_id=? AND i.product_id=? AND o.status='delivered' LIMIT 1`, [buyer.id, req.params.productId]);
  if (!purchase) return next(new AppError('You can review this product after it has been delivered', 403));
  await db.execute(`INSERT INTO reviews (buyer_id, product_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment), created_at=CURRENT_TIMESTAMP`, [buyer.id, req.params.productId, rating, comment || null]);
  res.status(201).json({ status:'success', message:'Review saved successfully' });
});
