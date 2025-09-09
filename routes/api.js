// routes/api.js - Main API router with modular routes
const express = require('express');
const User = require('../models/user');
const Book = require('../models/book');
const Pickup = require('../models/pickup');
const Notification = require('../models/notification');
const otpService = require('../utils/otpService');

// Import route modules
const bookRoutes = require('./book-routes');
const pickupRoutes = require('./pickup-routes');

const router = express.Router();

// Use modular routes
router.use('/books', bookRoutes);
router.use('/pickup', pickupRoutes);

// Legacy routes for backward compatibility
router.post('/add-book', (req, res, next) => {
  req.url = '/';
  bookRoutes(req, res, next);
});

router.post('/pickup-request', (req, res, next) => {
  req.url = '/';
  pickupRoutes(req, res, next);
});

// ===============================
// 👤 GET /api/current-user - Get current user session
// ===============================
router.get('/current-user', (req, res) => {
  if (req.session.user) {
    res.json({ 
      success: true, 
      user: req.session.user 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'User not logged in' 
    });
  }
});

// ===============================
// 📧 POST /api/send-otp - Send OTP for verification
// ===============================
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await otpService.sendOTP(email);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully to your email'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to send OTP'
      });
    }
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending OTP'
    });
  }
});

// ===============================
// ✅ POST /api/verify-otp - Verify OTP
// ===============================
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const result = await otpService.verifyOTP(email, otp);
    
    if (result.success) {
      // Mark email as verified in session
      if (req.session.tempUser) {
        req.session.tempUser.emailVerified = true;
      }
      
      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Invalid OTP'
      });
    }
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying OTP'
    });
  }
});

// ===============================
// 📊 GET /api/dashboard - Get dashboard data
// ===============================
router.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'User not logged in'
      });
    }

    const userId = req.session.user.id;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's books count
    const myBooksCount = await Book.countDocuments({ userId: userId });
    
    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({ 
      userId: userId, 
      isRead: false 
    });
    
    // Get total reviews (this would need a reviews model, using placeholder)
    const totalReviews = 0; // Placeholder since we don't have reviews model yet
    
    // Get recent books (last 5 books from all users)
    const recentBooks = await Book.find()
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Calculate user level based on books shared (simple calculation)
    const userLevel = Math.floor(myBooksCount / 5) + 1;
    const totalPoints = myBooksCount * 10 + totalReviews * 5;
    
    // Get achievements count (placeholder since we don't have achievements model)
    const totalAchievements = Math.min(Math.floor(myBooksCount / 2) + Math.floor(totalReviews / 3), 10);

    const dashboardData = {
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          level: userLevel,
          totalPoints: totalPoints,
          totalReviews: totalReviews
        },
        stats: {
          myBooks: myBooksCount,
          unreadNotifications: unreadNotifications,
          totalAchievements: totalAchievements
        },
        recentBooks: recentBooks
      }
    };

    res.json(dashboardData);
    
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading dashboard data',
      error: error.message
    });
  }
});

// ===============================
// 🏆 GET /api/achievements - Get user achievements
// ===============================
router.get('/achievements', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'User not logged in'
      });
    }

    const userId = req.session.user.id;
    const myBooksCount = await Book.countDocuments({ userId: userId });
    
    // Generate sample achievements based on user activity
    const achievements = [
      {
        _id: '1',
        name: 'First Book Shared',
        description: 'Share your very first book',
        type: 'first_book',
        points: 10,
        isUnlocked: myBooksCount >= 1,
        dateEarned: myBooksCount >= 1 ? new Date() : null
      },
      {
        _id: '2',
        name: 'Book Sharer',
        description: 'Share 5 books with the community',
        type: 'book_sharer',
        points: 25,
        isUnlocked: myBooksCount >= 5,
        dateEarned: myBooksCount >= 5 ? new Date() : null
      },
      {
        _id: '3',
        name: 'Community Helper',
        description: 'Help 10 fellow readers',
        type: 'community_helper',
        points: 50,
        isUnlocked: myBooksCount >= 10,
        dateEarned: myBooksCount >= 10 ? new Date() : null
      },
      {
        _id: '4',
        name: 'Book Collector',
        description: 'Share 20 books',
        type: 'book_lover',
        points: 100,
        isUnlocked: myBooksCount >= 20,
        dateEarned: myBooksCount >= 20 ? new Date() : null
      }
    ];

    res.json({
      success: true,
      achievements: achievements
    });
    
  } catch (error) {
    console.error('❌ Error loading achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading achievements',
      error: error.message
    });
  }
});

// ===============================
// 🏅 GET /api/leaderboard - Get community leaderboard
// ===============================
router.get('/leaderboard', async (req, res) => {
  try {
    // Get users with book counts
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'userId',
          as: 'books'
        }
      },
      {
        $addFields: {
          totalBooksShared: { $size: '$books' },
          totalPoints: { $multiply: [{ $size: '$books' }, 10] },
          level: { $add: [{ $floor: { $divide: [{ $size: '$books' }, 5] } }, 1] }
        }
      },
      {
        $sort: { totalPoints: -1, totalBooksShared: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          username: 1,
          totalBooksShared: 1,
          totalPoints: 1,
          level: 1
        }
      }
    ]);

    res.json({
      success: true,
      leaderboard: users
    });
    
  } catch (error) {
    console.error('❌ Error loading leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading leaderboard',
      error: error.message
    });
  }
});

module.exports = router;
