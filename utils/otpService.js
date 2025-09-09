// utils/otpService.js - OTP verification service
const nodemailer = require('nodemailer');

class OTPService {
  constructor() {
    this.otpStore = new Map(); // In production, use Redis
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // SMS service would use Twilio or similar
    this.smsConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };
  }

  // Generate OTP code
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  }

  // Store OTP with expiry
  storeOTP(identifier, otp, type = 'email') {
    this.otpStore.set(identifier, {
      otp,
      type,
      createdAt: Date.now(),
      expiryAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    });
  }

  // Send OTP via email
  async sendEmailOTP(email, purpose = 'verification') {
    try {
      const otp = this.generateOTP();
      this.storeOTP(email, otp, 'email');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@bookswap.com',
        to: email,
        subject: `BookSwap - Your Verification Code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">📚 BookSwap Verification</h2>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h3 style="margin: 0; font-size: 24px;">🔐 Your Verification Code</h3>
                <h1 style="margin: 15px 0; font-size: 36px; font-family: monospace; letter-spacing: 8px;">${otp}</h1>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">This code expires in 15 minutes</p>
              </div>
              
              <p>Hello,</p>
              <p>We received a request for ${purpose} verification. Please use the code above to complete your request.</p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Security Notice:</strong></p>
                <ul style="color: #856404; margin: 10px 0;">
                  <li>Never share this code with anyone</li>
                  <li>BookSwap team will never ask for this code</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>Thank you for using BookSwap!</p>
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
                This is an automated message from BookSwap Platform.
              </p>
            </div>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to email: ${email}`);
      return { success: true, message: 'OTP sent successfully' };

    } catch (error) {
      console.error('❌ Error sending email OTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  // Send OTP via SMS (requires Twilio setup)
  async sendSMSOTP(phoneNumber, purpose = 'verification') {
    try {
      const otp = this.generateOTP();
      this.storeOTP(phoneNumber, otp, 'sms');

      // Mock SMS sending for development
      // In production, integrate with Twilio:
      /*
      const twilio = require('twilio');
      const client = twilio(this.smsConfig.accountSid, this.smsConfig.authToken);
      
      await client.messages.create({
        body: `BookSwap Verification Code: ${otp}. Valid for 15 minutes. Don't share this code.`,
        from: this.smsConfig.phoneNumber,
        to: phoneNumber
      });
      */

      console.log(`✅ SMS OTP would be sent to: ${phoneNumber} - Code: ${otp}`);
      return { success: true, message: 'OTP sent successfully', devOTP: otp };

    } catch (error) {
      console.error('❌ Error sending SMS OTP:', error);
      return { success: false, message: 'Failed to send SMS OTP' };
    }
  }

  // Verify OTP
  verifyOTP(identifier, providedOTP) {
    const stored = this.otpStore.get(identifier);
    
    if (!stored) {
      return { success: false, message: 'No OTP found for this identifier' };
    }

    if (Date.now() > stored.expiryAt) {
      this.otpStore.delete(identifier);
      return { success: false, message: 'OTP has expired' };
    }

    if (stored.otp === providedOTP) {
      this.otpStore.delete(identifier);
      return { success: true, message: 'OTP verified successfully' };
    }

    return { success: false, message: 'Invalid OTP' };
  }

  // Clean up expired OTPs
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [key, value] of this.otpStore.entries()) {
      if (now > value.expiryAt) {
        this.otpStore.delete(key);
      }
    }
  }

  // Get OTP status (for debugging)
  getOTPStatus(identifier) {
    const stored = this.otpStore.get(identifier);
    if (!stored) return { exists: false };

    return {
      exists: true,
      type: stored.type,
      createdAt: new Date(stored.createdAt),
      expiryAt: new Date(stored.expiryAt),
      isExpired: Date.now() > stored.expiryAt
    };
  }
}

module.exports = new OTPService();
