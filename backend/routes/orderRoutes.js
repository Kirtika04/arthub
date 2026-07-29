const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/')
    .post(orderController.createOrder)
    .get(orderController.getUserOrders); // ADD THIS ROUTE

router.post('/:id/items/:itemId/return', orderController.requestReturn);

router.route('/:id')
    .get(orderController.getOrderDetails); // ADD THIS ROUTE

module.exports = router;
