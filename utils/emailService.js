// utils/emailService.js
const nodemailer = require('nodemailer');

// Email service configuration
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your preferred email service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  // Send email notification when someone requests a book pickup
  async sendPickupNotification(bookOwner, requester, bookTitle) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@bookswap.com',
      to: bookOwner.email,
      subject: `📚 Pickup Request for "${bookTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4b6cb7;">🚚 New Pickup Request!</h2>
          <p>Hello <strong>${bookOwner.username}</strong>,</p>
          <p>Great news! Someone is interested in your book "<strong>${bookTitle}</strong>".</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Request Details:</h3>
            <ul>
              <li><strong>Requester:</strong> ${requester.name}</li>
              <li><strong>Email:</strong> ${requester.email}</li>
              <li><strong>Book:</strong> ${bookTitle}</li>
              <li><strong>Pickup Address:</strong> ${requester.address}</li>
            </ul>
          </div>
          
          <p>Please contact the requester to arrange the pickup!</p>
          <p style="color: #666; font-size: 14px;">
            This email was sent from BookSwap Platform. 
            <a href="http://localhost:3000">Visit our platform</a>
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Pickup notification email sent successfully');
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@bookswap.com',
      to: user.email,
      subject: '🎉 Welcome to BookSwap Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4b6cb7;">📚 Welcome to BookSwap!</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>Welcome to the BookSwap community! We're excited to have you on board.</p>
          
          <div style="background: linear-gradient(45deg, #4b6cb7, #182848); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3>🚀 Get Started:</h3>
            <p>✅ Add your first book to share<br>
            ✅ Browse available books<br>
            ✅ Connect with other book lovers</p>
          </div>
          
          <p>Ready to start swapping? <a href="http://localhost:3000/add-book" style="color: #4b6cb7;">Add your first book!</a></p>
          
          <p>Happy reading!<br>The BookSwap Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully');
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
    }
  }

  // Send book availability notification
  async sendBookAvailableNotification(user, book) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@bookswap.com',
      to: user.email,
      subject: `📖 New Book Available: "${book.title}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4b6cb7;">📚 New Book Alert!</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>A book you might be interested in is now available:</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>📖 "${book.title}"</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Genre:</strong> ${book.genre}</p>
            <p><strong>Condition:</strong> ${book.condition}</p>
            <p><strong>Type:</strong> ${book.type}</p>
            <p><strong>Location:</strong> ${book.location}</p>
          </div>
          
          <p><a href="http://localhost:3000/gallery" style="background: #4b6cb7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Book</a></p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Book availability notification sent');
    } catch (error) {
      console.error('❌ Error sending book notification:', error);
    }
  }
}

module.exports = new EmailService();
