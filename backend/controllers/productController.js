const Product = require('../models/Product');
const db = require('../config/db');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllProducts = catchAsync(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort = 'newest' } = req.query;
  let sql = `SELECT p.*, s.store_name, c.name AS category_name, pi.image_url,
    (SELECT i.id FROM inventory i WHERE i.product_id=p.id AND i.stock > 0 ORDER BY i.id LIMIT 1) AS inventory_id
    FROM products p JOIN sellers s ON p.seller_id=s.id JOIN categories c ON p.category_id=c.id
    LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE WHERE p.status='active'`;
  const params = [];
  if (search) { sql += ' AND (p.title LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (category) { sql += ' AND p.category_id = ?'; params.push(category); }
  if (minPrice) { sql += ' AND p.base_price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { sql += ' AND p.base_price <= ?'; params.push(Number(maxPrice)); }
  const sorting = { price_asc: 'p.base_price ASC', price_desc: 'p.base_price DESC', newest: 'p.created_at DESC' };
  sql += ` ORDER BY ${sorting[sort] || sorting.newest}`;
  const [products] = await db.execute(sql, params);
  res.status(200).json({ status:'success', results:products.length, data:{ products } });
});

exports.getCategories = catchAsync(async (_req, res) => {
  const [categories] = await db.execute('SELECT id, name, description FROM categories ORDER BY name');
  res.status(200).json({ status:'success', data:{ categories } });
});

exports.getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('No product found with that ID', 404));
  res.status(200).json({ status:'success', data:{ product } });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const { category_id, title, description, base_price, stock = 0, sku } = req.body;
  if (!category_id || !title || !base_price) return next(new AppError('Category, title and price are required', 400));
  const [[seller]] = await db.execute('SELECT id FROM sellers WHERE user_id=? AND is_approved=TRUE', [req.user.id]);
  if (!seller) return next(new AppError('Only approved sellers can add products', 403));
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute('INSERT INTO products (seller_id, category_id, title, description, base_price) VALUES (?, ?, ?, ?, ?)', [seller.id, category_id, title, description || null, base_price]);
    const productId = result.insertId;
    await connection.execute('INSERT INTO inventory (product_id, sku, stock) VALUES (?, ?, ?)', [productId, sku || `AH-${productId}`, Math.max(0, Number(stock))]);
    if (req.file) await connection.execute('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, TRUE)', [productId, req.file.filename]);
    await connection.commit();
    res.status(201).json({ status:'success', data:{ product:{ id:productId, title, base_price } } });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const [result] = await db.execute('DELETE FROM products WHERE id=?', [req.params.id]);
  if (!result.affectedRows) return next(new AppError('No product found with that ID', 404));
  res.status(204).send();
});
