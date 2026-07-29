const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');
const router = express.Router();
router.use(protect);
router.route('/').get(cartController.getCart).post(cartController.addToCart);
router.delete('/:inventoryId', cartController.removeFromCart);
module.exports = router;
