const db = require('../config/db');

class Product {
    static async findAll({ search, category_id, min_price, max_price }) {
        let query = `
            SELECT p.id, p.title, p.base_price, p.status, 
                   s.store_name, c.name as category_name,
                   (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image_url
            FROM products p
            JOIN sellers s ON p.seller_id = s.id
            JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'
        `;
        const params = [];

        if (search) {
            query += ` AND p.title LIKE ?`;
            params.push(`%${search}%`);
        }
        if (category_id) {
            query += ` AND p.category_id = ?`;
            params.push(category_id);
        }
        if (min_price) {
            query += ` AND p.base_price >= ?`;
            params.push(min_price);
        }
        if (max_price) {
            query += ` AND p.base_price <= ?`;
            params.push(max_price);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async findById(id) {
        // Fetch main product details
        const [productRows] = await db.execute(`
            SELECT p.id, p.title, p.description, p.base_price, p.status,
                   s.store_name, s.id as seller_id, c.name as category_name
            FROM products p
            JOIN sellers s ON p.seller_id = s.id
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.status = 'active'
        `, [id]);

        if (productRows.length === 0) return null;
        const product = productRows[0];

        // Fetch images
        const [imageRows] = await db.execute(`
            SELECT id, image_url, is_primary 
            FROM product_images 
            WHERE product_id = ?
            ORDER BY is_primary DESC
        `, [id]);
        product.images = imageRows;

        // Fetch inventory (variants and stock)
        const [inventoryRows] = await db.execute(`
            SELECT id, sku, variant_name, stock, price_modifier 
            FROM inventory 
            WHERE product_id = ?
        `, [id]);
        product.inventory = inventoryRows;

        return product;
    }

    static async getCategories() {
        const [rows] = await db.execute('SELECT id, name FROM categories ORDER BY name ASC');
        return rows;
    }
}

module.exports = Product;
