require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Uncaught Exception Handler with full stack trace to pinpoint errors
process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.stack);
    process.exit(1);
});

// Import DB (executes the connection test)
require('./config/db');

// Import Error Middleware & Custom Error
const globalErrorHandler = require('./middlewares/errorMiddleware');
const AppError = require('./utils/appError');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const sellerRoutes = require('./routes/sellerRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Global Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // HTTP request logger
}

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/seller', sellerRoutes); 
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/users', userRoutes);

// Handle Unhandled Routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});

// Unhandled Rejection Handler (Promises)
process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
