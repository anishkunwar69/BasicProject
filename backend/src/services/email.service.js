const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (to, otp) => {
    try {
        const msg = {
            to: to,
            from: process.env.SENDGRID_FROM_EMAIL, // Must be verified sender in SendGrid
            subject: 'Email Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Email Verification</h1>
                    <p style="font-size: 16px; color: #666;">Your OTP for email verification is:</p>
                    <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; padding: 10px; background: #f8f9fa; text-align: center; border-radius: 5px;">${otp}</h2>
                    <p style="font-size: 14px; color: #666;">This OTP will expire in ${process.env.OTP_EXPIRY} minutes.</p>
                    <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        await sgMail.send(msg);
        console.log('Email sent successfully');
        return true;
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response) {
            console.error('Error body:', error.response.body);
        }
        throw new Error('Failed to send verification email');
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail
}; 