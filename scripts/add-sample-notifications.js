// Add sample notifications to the database for testing
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const User = require('../models/user');

async function addSampleNotifications() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/bookswapDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find or create a sample user
    let sampleUser = await User.findOne({ username: 'sampleuser' });
    if (!sampleUser) {
      sampleUser = new User({
        username: 'sampleuser',
        email: 'sample@bookswap.com',
        location: 'New York',
        password: 'sample123'
      });
      await sampleUser.save();
      console.log('✅ Created sample user for notifications');
    }
    
    // Clear existing notifications for this user
    await Notification.deleteMany({ userId: sampleUser._id });
    console.log('🧹 Cleared existing notifications');
    
    // Sample notifications data
    const sampleNotifications = [
      {
        userId: sampleUser._id,
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from John about "The Great Gatsby"',
        priority: 'medium',
        isRead: false
      },
      {
        userId: sampleUser._id,
        type: 'pickup-request',
        title: 'Pickup Request',
        message: 'Someone requested to pickup your book "1984"',
        priority: 'high',
        isRead: false
      },
      {
        userId: sampleUser._id,
        type: 'book-available',
        title: 'Book Available',
        message: 'A new book "Atomic Habits" matching your interests is now available',
        priority: 'low',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        userId: sampleUser._id,
        type: 'achievement-unlocked',
        title: 'Achievement Unlocked!',
        message: 'Congratulations! You earned the "Book Lover" badge for sharing 5 books',
        priority: 'medium',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        userId: sampleUser._id,
        type: 'review-received',
        title: 'Review Received',
        message: 'Your book "The Alchemist" received a 5-star review!',
        priority: 'medium',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        userId: sampleUser._id,
        type: 'swap-completed',
        title: 'Swap Completed',
        message: 'Your book swap with Sarah has been completed successfully',
        priority: 'high',
        isRead: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      },
      {
        userId: sampleUser._id,
        type: 'book-donated',
        title: 'Book Donated',
        message: 'Thank you! Your donated book "Pride and Prejudice" has been given to someone in need',
        priority: 'medium',
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ];
    
    // Insert sample notifications
    for (const notificationData of sampleNotifications) {
      const notification = new Notification(notificationData);
      await notification.save();
      console.log(`✅ Added notification: ${notification.title}`);
    }
    
    console.log(`\n🎉 Successfully added ${sampleNotifications.length} sample notifications to the database!`);
    
    // Show stats
    const totalNotifications = await Notification.countDocuments({ userId: sampleUser._id });
    const unreadNotifications = await Notification.countDocuments({ userId: sampleUser._id, isRead: false });
    
    console.log(`📊 Total notifications for ${sampleUser.username}: ${totalNotifications}`);
    console.log(`📊 Unread notifications: ${unreadNotifications}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample notifications:', error);
    process.exit(1);
  }
}

// Run the function
addSampleNotifications();
