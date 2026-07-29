const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes below
router.use(authMiddleware.protect);
router.get('/me', authController.getMe);

module.exports = router;
