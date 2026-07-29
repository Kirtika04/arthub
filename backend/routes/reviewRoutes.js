const express = require('express');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true }); // Allows access to productId from parent router

router.route('/')
    .get(reviewController.getProductReviews)
    .post(authMiddleware.protect, reviewController.createReview);

module.exports = router;
