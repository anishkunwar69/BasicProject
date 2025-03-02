const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { generateOTP, sendOTPEmail } = require('../services/email.service');

// Register new user
exports.signup = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + parseInt(process.env.OTP_EXPIRY));

        // Create new user
        const user = new User({
            ...req.body,
            otp: {
                code: otp,
                expiresAt: otpExpiry
            }
        });

        // Save user
        await user.save();

        // Send verification email
        await sendOTPEmail(email, otp);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification OTP.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Verify email with OTP
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if OTP exists and is valid
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is expired
        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Verify OTP
        if (user.otp.code !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Update user verification status
        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: error.message
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + parseInt(process.env.OTP_EXPIRY));

        // Update user's OTP
        user.otp = {
            code: otp,
            expiresAt: otpExpiry
        };
        await user.save();

        // Send new verification email
        await sendOTPEmail(email, otp);

        res.json({
            success: true,
            message: 'New OTP sent successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message
        });
    }
}; 