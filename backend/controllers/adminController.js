const db = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const [revenueRes] = await db.execute(`
        SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue
        FROM orders o
        WHERE EXISTS (
            SELECT 1 FROM payments p
            WHERE p.order_id=o.id AND p.status='successful'
        )
    `);
    const [usersRes] = await db.execute('SELECT COUNT(*) as total_users FROM users');
    const [productsRes] = await db.execute('SELECT COUNT(*) as total_products FROM products');
    const [ordersRes] = await db.execute('SELECT COUNT(*) as total_orders FROM orders');
    const [sellersRes] = await db.execute('SELECT COUNT(*) AS active_sellers FROM sellers s JOIN users u ON u.id=s.user_id WHERE s.is_approved=TRUE AND u.is_active=TRUE');

    res.status(200).json({
        status: 'success',
        data: {
            totalRevenue: revenueRes[0].total_revenue || 0,
            totalUsers: usersRes[0].total_users || 0,
            totalProducts: productsRes[0].total_products || 0,
            totalOrders: ordersRes[0].total_orders || 0,
            activeSellers: sellersRes[0].active_sellers || 0
        }
    });
});

exports.getSellers = catchAsync(async (req, res, next) => {
    const [sellers] = await db.execute(`SELECT s.id,s.store_name,s.is_approved,u.name,u.email,u.phone,u.created_at FROM sellers s JOIN users u ON u.id=s.user_id ORDER BY u.created_at DESC`);
    res.status(200).json({ status: 'success', results: sellers.length, data: { sellers } });
});

exports.toggleSellerApproval = catchAsync(async (req, res, next) => {
    const [result] = await db.execute('UPDATE sellers SET is_approved=NOT is_approved WHERE id=?', [req.params.sellerId]);
    if (!result.affectedRows) return next(new AppError('Seller not found', 404));
    res.status(200).json({ status: 'success', message: 'Seller status updated' });
});

exports.getOrders = catchAsync(async (req, res) => {
    const [orders] = await db.execute(`
        SELECT o.id, o.total_amount, o.status, o.created_at,
               u.name AS buyer_name, u.email AS buyer_email,
               COALESCE(SUM(oi.quantity), 0) AS total_items
        FROM orders o
        JOIN buyers b ON b.id = o.buyer_id
        JOIN users u ON u.id = b.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id, o.total_amount, o.status, o.created_at, u.name, u.email
        ORDER BY o.created_at DESC
    `);
    res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
});

exports.approveOrder = catchAsync(async (req, res, next) => {
    const [result] = await db.execute(
        "UPDATE orders SET status='confirmed' WHERE id=? AND status='pending'",
        [req.params.orderId]
    );

    if (!result.affectedRows) {
        const [[order]] = await db.execute('SELECT status FROM orders WHERE id=?', [req.params.orderId]);
        if (!order) return next(new AppError('Order not found', 404));
        if (order.status === 'confirmed') {
            return res.status(200).json({ status: 'success', message: 'Order is already approved' });
        }
        return next(new AppError(`Only pending orders can be approved (current status: ${order.status})`, 409));
    }

    res.status(200).json({ status: 'success', message: 'Order approved successfully' });
});

exports.getCategories = catchAsync(async (req, res, next) => {
    const [categories] = await db.execute('SELECT * FROM categories');
    res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
});

exports.createCategory = catchAsync(async (req, res, next) => {
    const { name, description } = req.body;
    if (!name) return next(new AppError('Please provide a category name', 400));
    await db.execute('INSERT INTO categories (name, description) VALUES (?, ?)', [name.trim(), description?.trim() || null]);
    res.status(201).json({ status: 'success', message: 'Category created successfully' });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const [[usage]] = await db.execute('SELECT COUNT(*) AS product_count FROM products WHERE category_id=?', [req.params.categoryId]);
    if (Number(usage.product_count) > 0) {
        return next(new AppError(`This category cannot be removed because ${usage.product_count} product(s) use it`, 409));
    }
    const [result] = await db.execute('DELETE FROM categories WHERE id=?', [req.params.categoryId]);
    if (!result.affectedRows) return next(new AppError('Category not found', 404));
    res.status(200).json({ status:'success', message:'Category removed successfully' });
});

exports.getUsers = catchAsync(async (req, res, next) => {
    const [users] = await db.execute('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});
