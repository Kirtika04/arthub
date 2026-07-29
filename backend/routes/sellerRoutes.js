const express = require('express');
const sellerController = require('../controllers/sellerController');
const upload = require('../middlewares/uploadMiddleware');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, restrictTo('seller', 'admin'));

router.post('/products', upload.array('images', 5), sellerController.createProduct);
router.get('/products', sellerController.getSellerProducts);
router.delete('/products/:productId', sellerController.deleteProduct);

module.exports = router;
