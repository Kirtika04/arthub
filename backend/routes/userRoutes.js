const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const user = require('../controllers/userController');
const router = express.Router();
router.use(protect);
router.route('/me').get(user.getMe).patch(user.updateMe);
router.route('/me/addresses').get(user.getAddresses).post(user.createAddress);
router.route('/me/addresses/:id').patch(user.updateAddress).delete(user.deleteAddress);
module.exports = router;
