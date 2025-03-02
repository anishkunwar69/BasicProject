const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Auth routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);

module.exports = router; 