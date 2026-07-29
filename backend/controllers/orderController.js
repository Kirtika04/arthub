const db = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBuyer = async userId => { const [[buyer]] = await db.execute('SELECT id FROM buyers WHERE user_id=?', [userId]); return buyer; };

exports.createOrder = catchAsync(async (req, res, next) => {
  const { items, shipping_address_id, shipping_address, coupon_id = null } = req.body;
  const buyer = await getBuyer(req.user.id);
  if (!buyer) return next(new AppError('Only buyer accounts can create orders', 403));
  if (!Array.isArray(items) || !items.length || (!shipping_address_id && !shipping_address)) return next(new AppError('Items and a shipping address are required', 400));
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let addressId = shipping_address_id;
    if (addressId) {
      const [[address]] = await connection.execute('SELECT id FROM addresses WHERE id=? AND user_id=? AND type IN (\'shipping\',\'billing\')', [addressId, req.user.id]);
      if (!address) throw new AppError('Valid shipping address required', 400);
    } else {
      const { street_address, city, state, postal_code, country = 'India' } = shipping_address;
      if (!street_address || !city || !state || !postal_code) throw new AppError('Complete shipping address required', 400);
      const [address] = await connection.execute('INSERT INTO addresses (user_id,type,street_address,city,state,postal_code,country) VALUES (?,\'shipping\',?,?,?,?,?)', [req.user.id, street_address, city, state, postal_code, country]);
      addressId = address.insertId;
    }
    const lineItems = [];
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) throw new AppError('Each item needs a positive quantity', 400);
      const [[inventory]] = await connection.execute(`SELECT i.id,i.product_id,p.seller_id,i.stock,p.base_price,i.price_modifier FROM inventory i JOIN products p ON p.id=i.product_id WHERE i.id=? AND p.status='active' FOR UPDATE`, [item.inventory_id]);
      if (!inventory || inventory.stock < quantity) throw new AppError('One or more items are unavailable', 409);
      lineItems.push({ ...inventory, quantity, price: Number(inventory.base_price) + Number(inventory.price_modifier) });
    }
    const total = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const [orderResult] = await connection.execute('INSERT INTO orders (buyer_id,shipping_address_id,total_amount,coupon_id) VALUES (?,?,?,?)', [buyer.id, addressId, total, coupon_id]);
    const shipments = new Map();
    for (const item of lineItems) {
      if (!shipments.has(item.seller_id)) { const [shipment] = await connection.execute('INSERT INTO shipments (order_id,seller_id) VALUES (?,?)', [orderResult.insertId,item.seller_id]); shipments.set(item.seller_id, shipment.insertId); }
      await connection.execute('INSERT INTO order_items (order_id,shipment_id,inventory_id,seller_id,quantity,price_per_unit,subtotal) VALUES (?,?,?,?,?,?,?)',[orderResult.insertId,shipments.get(item.seller_id),item.id,item.seller_id,item.quantity,item.price,item.price*item.quantity]);
      await connection.execute('UPDATE inventory SET stock=stock-? WHERE id=?',[item.quantity,item.id]);
    }
    await connection.execute(
      'DELETE ci FROM cart_items ci JOIN cart c ON c.id=ci.cart_id WHERE c.buyer_id=?',
      [buyer.id]
    );
    await connection.commit();
    res.status(201).json({status:'success',message:'Order created successfully',data:{orderId:orderResult.insertId,total_amount:total}});
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
});

exports.getUserOrders = catchAsync(async (req,res,next) => { const buyer=await getBuyer(req.user.id);if(!buyer)return next(new AppError('Buyer account required',403));const [orders]=await db.execute(`SELECT o.*,COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id=o.id),0) AS total_items FROM orders o WHERE o.buyer_id=? ORDER BY o.created_at DESC`,[buyer.id]);res.json({status:'success',results:orders.length,data:{orders}}); });
exports.getOrderDetails = catchAsync(async (req,res,next) => { const buyer=await getBuyer(req.user.id);if(!buyer)return next(new AppError('Buyer account required',403));const [[order]]=await db.execute(`SELECT o.*,(SELECT p.status FROM payments p WHERE p.order_id=o.id ORDER BY p.id DESC LIMIT 1) AS payment_status,(SELECT p.method FROM payments p WHERE p.order_id=o.id ORDER BY p.id DESC LIMIT 1) AS payment_method FROM orders o WHERE o.id=? AND o.buyer_id=?`,[req.params.id,buyer.id]);if(!order)return next(new AppError('Order not found',404));const [items]=await db.execute(`SELECT oi.*,p.id AS product_id,p.title,(SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC LIMIT 1) AS image_url,r.id AS return_id,r.reason AS return_reason,r.status AS return_status,rf.status AS refund_status,rf.amount AS refund_amount FROM order_items oi JOIN inventory i ON oi.inventory_id=i.id JOIN products p ON i.product_id=p.id LEFT JOIN returns r ON r.id=(SELECT r2.id FROM returns r2 WHERE r2.order_item_id=oi.id ORDER BY r2.id DESC LIMIT 1) LEFT JOIN refunds rf ON rf.id=(SELECT rf2.id FROM refunds rf2 WHERE rf2.return_id=r.id ORDER BY rf2.id DESC LIMIT 1) WHERE oi.order_id=?`,[order.id]);const [[shippingAddress]]=await db.execute('SELECT street_address,city,state,postal_code,country FROM addresses WHERE id=?',[order.shipping_address_id]);const [shipments]=await db.execute(`SELECT s.id,s.status,s.tracking_number,s.courier_partner,s.shipped_at,se.store_name FROM shipments s JOIN sellers se ON se.id=s.seller_id WHERE s.order_id=? ORDER BY s.id`,[order.id]);res.json({status:'success',data:{order,items,shippingAddress,shipments}}); });

exports.requestReturn = catchAsync(async (req, res, next) => {
  const reason = String(req.body.reason || '').trim();
  if (reason.length < 5) return next(new AppError('Please provide a return reason', 400));
  const buyer = await getBuyer(req.user.id);
  if (!buyer) return next(new AppError('Buyer account required', 403));
  const [[item]] = await db.execute(`SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.id=? AND o.id=? AND o.buyer_id=? AND o.status='delivered'`, [req.params.itemId, req.params.id, buyer.id]);
  if (!item) return next(new AppError('Returns are available only for your delivered order items', 400));
  const [[existing]] = await db.execute("SELECT id FROM returns WHERE order_item_id=? AND status IN ('requested','approved','received')", [item.id]);
  if (existing) return next(new AppError('A return request already exists for this item', 409));
  const [result] = await db.execute("INSERT INTO returns (order_item_id,reason,status) VALUES (?,?,'requested')", [item.id, reason]);
  res.status(201).json({ status:'success', message:'Return request submitted', data:{ returnId:result.insertId, status:'requested' } });
});
