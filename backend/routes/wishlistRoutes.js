const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(wishlistController.getWishlist)
    .post(wishlistController.addToWishlist);

router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;
