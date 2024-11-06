// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', auth, authController.logout.bind(authController));
router.get('/profile', auth, authController.getProfile.bind(authController));

module.exports = router;