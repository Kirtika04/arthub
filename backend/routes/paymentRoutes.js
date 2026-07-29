const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect, restrictTo('buyer'));
router.post('/orders/:orderId', paymentController.createOrder);
router.post('/orders/:orderId/cod', paymentController.createCodOrder);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
