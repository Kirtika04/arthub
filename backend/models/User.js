const db = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(userData) {
        const { name, email, password, role, phone, store_name } = userData;
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Insert into users table
            const [userResult] = await connection.execute(
                'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
                [name, email, password, role, phone || null]
            );

            const userId = userResult.insertId;

            // Insert into role-specific tables
            if (role === 'buyer') {
                await connection.execute('INSERT INTO buyers (user_id) VALUES (?)', [userId]);
            } else if (role === 'seller') {
                await connection.execute(
                    'INSERT INTO sellers (user_id, store_name, is_approved) VALUES (?, ?, ?)',
                    [userId, store_name, false] // Sellers need admin approval
                );
            }

            await connection.commit();
            return userId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = User;
