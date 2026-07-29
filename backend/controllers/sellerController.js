const db = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createProduct = catchAsync(async (req, res, next) => {
  const { title, description, base_price, category_id, stock = 0, sku, variant_name = 'Standard' } = req.body;
  if (!title || !base_price || !category_id || !sku) return next(new AppError('Title, category, price and SKU are required', 400));
  const [[seller]] = await db.execute('SELECT id FROM sellers WHERE user_id=? AND is_approved=TRUE', [req.user.id]);
  if (!seller) return next(new AppError('Only approved sellers can add products', 403));
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute('INSERT INTO products (seller_id,category_id,title,description,base_price) VALUES (?,?,?,?,?)',[seller.id,category_id,title,description||null,base_price]);
    await connection.execute('INSERT INTO inventory (product_id,sku,variant_name,stock) VALUES (?,?,?,?)',[result.insertId,sku,variant_name,Math.max(0,Number(stock))]);
    for (const [index, file] of (req.files || []).entries()) await connection.execute('INSERT INTO product_images (product_id,image_url,is_primary) VALUES (?,?,?)',[result.insertId,`products/${file.filename}`,index===0]);
    await connection.commit();
    res.status(201).json({status:'success',message:'Product created successfully',data:{productId:result.insertId}});
  } catch(error) { await connection.rollback(); throw error; } finally { connection.release(); }
});

exports.getSellerProducts = catchAsync(async (req, res, next) => {
  const [[seller]] = await db.execute('SELECT id,is_approved FROM sellers WHERE user_id=?', [req.user.id]);
  if (!seller) return next(new AppError('Seller account required', 403));
  const [products] = await db.execute(`SELECT p.*, c.name AS category_name, COALESCE(SUM(i.stock),0) AS stock,(SELECT pi.image_url FROM product_images pi WHERE pi.product_id=p.id ORDER BY pi.is_primary DESC,pi.id LIMIT 1) AS image_url FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN inventory i ON i.product_id=p.id WHERE p.seller_id=? GROUP BY p.id ORDER BY p.created_at DESC`, [seller.id]);
  res.json({status:'success',results:products.length,data:{products,seller:{is_approved:Boolean(seller.is_approved)}}});
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const [[seller]] = await db.execute('SELECT id FROM sellers WHERE user_id=?', [req.user.id]);
  if (!seller) return next(new AppError('Seller account required', 403));
  const [result] = await db.execute('DELETE FROM products WHERE id=? AND seller_id=?', [req.params.productId, seller.id]);
  if (!result.affectedRows) return next(new AppError('Art supply not found', 404));
  res.json({ status:'success', message:'Art supply deleted successfully' });
});
