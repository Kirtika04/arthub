const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const restrictTo = require('../middlewares/roleMiddleware');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Mount review router under products (e.g., /api/v1/products/:productId/reviews)
router.use('/:productId/reviews', reviewRouter);

// Public routes
router.route('/')
    .get(productController.getAllProducts)
    .post(authController.protect, restrictTo('admin', 'seller'), productController.createProduct);

router.route('/categories')
    .get(productController.getCategories);

router.route('/:id')
    .get(productController.getProductById)
    .delete(authController.protect, restrictTo('admin'), productController.deleteProduct);

module.exports = router;
