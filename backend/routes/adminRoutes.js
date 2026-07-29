const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Restrict all routes below to admin role only
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/sellers', adminController.getSellers);
router.patch('/sellers/:sellerId/toggle', adminController.toggleSellerApproval);
router.get('/orders', adminController.getOrders);
router.patch('/orders/:orderId/approve', adminController.approveOrder);

router.route('/categories')
    .get(adminController.getCategories)
    .post(adminController.createCategory);
router.delete('/categories/:categoryId', adminController.deleteCategory);

router.get('/users', adminController.getUsers);

module.exports = router;
