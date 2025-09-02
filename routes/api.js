// routes/api.js (MongoDB version)
const express = require('express');
const path = require('path');
const multer = require('multer');
const Book = require('../models/book');
const User = require('../models/user');
const Pickup = require('../models/pickup');
const Rating = require('../models/rating');
const Message = require('../models/message');
const Notification = require('../models/notification');
const Achievement = require('../models/achievement');
const emailService = require('../utils/emailService');
const achievementService = require('../utils/achievementService');
const bookImageService = require('../utils/bookImageService');

const router = express.Router();

// ========== MULTER SETUP FOR IMAGE UPLOAD ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './public/uploads'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Note: Main login handler is in server.js at /login
// This API route is removed to prevent conflicts

// ==========================
// 📚 POST /api/add-book
// ==========================
router.post('/add-book', upload.single('image'), async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).redirect('/login');
    }

    const bookData = {
      bookId: req.body.bookId || `BOOK-${Date.now()}`,
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      condition: req.body.condition,
      type: req.body.type,
      location: req.body.location,
      contact: req.body.contact,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      userId: userId // Associate book with current user
    };

    const newBook = new Book(bookData);
    await newBook.save();
    
    // Update user's book count
    if (req.body.type === 'donate') {
      await User.findByIdAndUpdate(userId, { $inc: { totalBooksDonated: 1 } });
    } else {
      await User.findByIdAndUpdate(userId, { $inc: { totalBooksShared: 1 } });
    }
    
    console.log(`✅ Book added: ${bookData.title} by user ${userId}`);
    res.redirect('/gallery');
  } catch (err) {
    console.error('❌ Error adding book:', err.message);
    res.status(500).send('Server error adding book.');
  }
});

// ==========================
// 📚 GET /api/books
// ==========================
router.get('/books', async (req, res) => {
  try {
    const { genre, condition, type } = req.query;
    
    // Build filter object - remove status filter for now
    let filter = {};
    
    if (genre) filter.genre = new RegExp(genre, 'i'); // Case insensitive
    if (condition) filter.condition = new RegExp(condition, 'i');
    if (type) filter.type = new RegExp(type, 'i');
    
    console.log('🔍 Searching books with filter:', filter);
    
    const books = await Book.find(filter)
      .populate('userId', 'username location')
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log(`📚 Found ${books.length} books in database`);
    
    // Log first book for debugging
    if (books.length > 0) {
      console.log('Sample book:', JSON.stringify(books[0], null, 2));
    }
    
    res.json({ 
      success: true, 
      books,
      count: books.length 
    });
  } catch (err) {
    console.error('❌ Error fetching books:', err);
    console.error('❌ Full error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching books',
      error: err.message 
    });
  }
});

// ===============================
// 🚚 POST /api/pickup-request
// ===============================
router.post('/pickup-request', async (req, res) => {
  const { userName, bookTitle, email, pickupAddress } = req.body;

  if (!userName || !bookTitle || !email || !pickupAddress) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newPickup = new Pickup({
      name: userName,
      book: bookTitle,
      email,
      address: pickupAddress,
      timestamp: new Date()
    });

    await newPickup.save();
    console.log(`📦 Pickup request submitted for "${bookTitle}" by ${userName}`);
    return res.status(200).json({ message: '✅ Pickup request submitted successfully!' });
  } catch (err) {
    console.error('❌ Error submitting pickup:', err.message);
    res.status(500).json({ error: 'Server error processing pickup data.' });
  }
});

// ===============================
// ⭐ POST /api/books/:id/rate - Rate a book
// ===============================
router.post('/books/:id/rate', async (req, res) => {
  try {
    const { rating, review } = req.body;
    const bookId = req.params.id;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Please log in to rate books.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Update or create rating
    const existingRating = await Rating.findOne({ bookId, userId });
    
    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review || '';
      await existingRating.save();
    } else {
      const newRating = new Rating({ bookId, userId, rating, review });
      await newRating.save();
      
      // Update user's total reviews count
      await User.findByIdAndUpdate(userId, { $inc: { totalReviews: 1 } });
    }

    // Update book's average rating
    const ratings = await Rating.find({ bookId });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    await Book.findByIdAndUpdate(bookId, {
      averageRating: avgRating,
      totalRatings: ratings.length
    });

    // Check for achievements
    await achievementService.checkUserAchievements(userId);

    res.json({ success: true, message: 'Rating submitted successfully!' });
  } catch (err) {
    console.error('❌ Error rating book:', err);
    res.status(500).json({ error: 'Server error submitting rating.' });
  }
});

// ===============================
// ⭐ GET /api/books/:id/ratings - Get book ratings
// ===============================
router.get('/books/:id/ratings', async (req, res) => {
  try {
    const bookId = req.params.id;
    const ratings = await Rating.find({ bookId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    res.json({ success: true, ratings });
  } catch (err) {
    console.error('❌ Error fetching ratings:', err);
    res.status(500).json({ error: 'Server error fetching ratings.' });
  }
});

// ===============================
// 💬 POST /api/messages - Send message
// ===============================
router.post('/messages', async (req, res) => {
  try {
    const { receiverId, message, bookId, messageType = 'text' } = req.body;
    const senderId = req.session.user?.id;

    if (!senderId) {
      return res.status(401).json({ error: 'Please log in to send messages.' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      bookId,
      message,
      messageType
    });

    await newMessage.save();

    // Create notification for receiver
    const notification = new Notification({
      userId: receiverId,
      type: 'message',
      title: 'New Message',
      message: `You have a new message`,
      relatedId: newMessage._id,
      relatedModel: 'Message'
    });
    await notification.save();

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ Error sending message:', err);
    res.status(500).json({ error: 'Server error sending message.' });
  }
});

// ===============================
// 💬 GET /api/messages/conversations - Get user's conversations list
// ===============================
router.get('/messages/conversations', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to view conversations.' });
    }

    // Get all messages where user is sender or receiver, grouped by conversation partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiverId', 
          foreignField: '_id',
          as: 'receiverInfo'
        }
      },
      {
        $addFields: {
          otherUserId: {
            $cond: {
              if: { $eq: ['$senderId', userId] },
              then: '$receiverId',
              else: '$senderId'
            }
          },
          otherUserInfo: {
            $cond: {
              if: { $eq: ['$senderId', userId] },
              then: { $arrayElemAt: ['$receiverInfo', 0] },
              else: { $arrayElemAt: ['$senderInfo', 0] }
            }
          }
        }
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $last: '$message' },
          lastMessageTime: { $last: '$createdAt' },
          username: { $last: '$otherUserInfo.username' },
          unreadCount: {
            $sum: {
              $cond: {
                if: { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    const conversationsList = conversations.map(conv => ({
      userId: conv._id,
      username: conv.username || 'Unknown User',
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount
    }));

    res.json({ success: true, conversations: conversationsList });
  } catch (err) {
    console.error('❌ Error fetching conversations:', err);
    res.status(500).json({ error: 'Server error fetching conversations.' });
  }
});

// ===============================
// 💬 GET /api/messages/:userId - Get conversation
// ===============================
router.get('/messages/:userId', async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.session.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Please log in to view messages.' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    })
    .populate('senderId', 'username')
    .populate('receiverId', 'username')
    .populate('bookId', 'title')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Server error fetching messages.' });
  }
});

// ===============================
// 🔔 GET /api/notifications - Get user notifications
// ===============================
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to view notifications.' });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error fetching notifications.' });
  }
});

// ===============================
// 🔔 PUT /api/notifications/:id/read - Mark notification as read
// ===============================
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session.user?.id;

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true }
    );

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('❌ Error updating notification:', err);
    res.status(500).json({ error: 'Server error updating notification.' });
  }
});

// ===============================
// 🏆 GET /api/achievements - Get user achievements
// ===============================
router.get('/achievements', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to view achievements.' });
    }

    const achievements = await achievementService.getUserAchievements(userId);
    const user = await User.findById(userId).select('totalPoints level badges');

    // Add sample achievements if user has none yet
    const sampleAchievements = [
      {
        badge: 'first-book',
        title: 'First Book Shared',
        description: 'Welcome to BookSwap! You shared your first book.',
        icon: '📚',
        points: 10,
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        badge: 'community-helper',
        title: 'Community Helper',
        description: 'You\'ve been helping fellow book lovers!',
        icon: '🤝',
        points: 60,
        unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        badge: 'reviewer',
        title: 'Book Reviewer',
        description: 'Thanks for your thoughtful book reviews.',
        icon: '⭐',
        points: 25,
        unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    const finalAchievements = achievements.length > 0 ? achievements : sampleAchievements;

    res.json({ 
      success: true, 
      achievements: finalAchievements, 
      totalPoints: user?.totalPoints || 95,
      level: user?.level || 3,
      badges: user?.badges || ['first-book', 'community-helper', 'reviewer']
    });
  } catch (err) {
    console.error('❌ Error fetching achievements:', err);
    res.status(500).json({ error: 'Server error fetching achievements.' });
  }
});

// ===============================
// 🏆 GET /api/leaderboard - Get leaderboard
// ===============================
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await achievementService.getLeaderboard(10);
    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('❌ Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Server error fetching leaderboard.' });
  }
});

// ===============================
// 📊 GET /api/dashboard - Get user dashboard data
// ===============================
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to view dashboard.' });
    }

    console.log('📊 Dashboard request for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get counts with proper error handling
    const myBooks = await Book.countDocuments({ userId }).catch(() => 0);
    const recentBooks = await Book.find()
      .populate('userId', 'username location')
      .sort({ createdAt: -1 })
      .limit(5)
      .catch(() => []);
    
    const notifications = await Notification.countDocuments({ userId, isRead: false }).catch(() => 0);
    const achievements = await Achievement.countDocuments({ userId }).catch(() => 0);
    const totalReviews = await Rating.countDocuments({ userId }).catch(() => 0);

    const dashboardData = {
      user: {
        username: user.username || 'Unknown User',
        totalPoints: user.totalPoints || 0,
        level: user.level || 1,
        badges: user.badges || [],
        totalBooksShared: user.totalBooksShared || 0,
        totalBooksDonated: user.totalBooksDonated || 0,
        totalBooksSwapped: user.totalBooksSwapped || 0,
        totalReviews: user.totalReviews || totalReviews
      },
      stats: {
        myBooks,
        unreadNotifications: notifications,
        totalAchievements: achievements,
        totalReviews
      },
      recentBooks
    };

    console.log('📊 Dashboard data prepared:', {
      userId,
      username: user.username,
      booksCount: myBooks,
      notificationsCount: notifications,
      achievementsCount: achievements
    });

    res.json({ success: true, data: dashboardData });
  } catch (err) {
    console.error('❌ Error fetching dashboard:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching dashboard.',
      message: err.message 
    });
  }
});

// ===============================
// 🔍 GET /api/search - Advanced book search
// ===============================
router.get('/search', async (req, res) => {
  try {
    const { q, genre, condition, type, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let filter = { isAvailable: true };
    
    // Text search
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Filters
    if (genre) filter.genre = { $regex: genre, $options: 'i' };
    if (condition) filter.condition = { $regex: condition, $options: 'i' };
    if (type) filter.type = { $regex: type, $options: 'i' };
    
    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    const books = await Book.find(filter)
      .populate('userId', 'username location averageRating')
      .sort(sortOptions)
      .limit(50);
    
    res.json({ success: true, books, count: books.length });
  } catch (err) {
    console.error('❌ Error searching books:', err);
    res.status(500).json({ error: 'Server error searching books.' });
  }
});

// ===============================
// 👤 GET /api/profile/:userId - Get user profile
// ===============================
router.get('/profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId)
      .select('-password')
      .populate('wishlist', 'title author')
      .populate('following', 'username')
      .populate('followers', 'username');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const userBooks = await Book.find({ userId }).limit(10);
    const achievements = await Achievement.find({ userId }).limit(5);
    
    res.json({ 
      success: true, 
      profile: user,
      books: userBooks,
      achievements
    });
  } catch (err) {
    console.error('❌ Error fetching profile:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// ===============================
// 📸 GET /api/book-image/:title - Get book cover image (with optional author)
// ===============================
router.get('/book-image/:title/:author', async (req, res) => {
  try {
    const { title, author } = req.params;
    
    if (!title) {
      return res.status(400).json({ error: 'Book title is required.' });
    }
    
    const decodedTitle = decodeURIComponent(title);
    const decodedAuthor = author ? decodeURIComponent(author) : '';
    
    console.log(`🔍 Fetching book cover for: "${decodedTitle}" by ${decodedAuthor || 'Unknown'}`);
    
    const imageUrl = await bookImageService.getBookCoverImage(decodedTitle, decodedAuthor);
    
    res.json({ 
      success: true, 
      imageUrl, 
      title: decodedTitle,
      author: decodedAuthor,
      cached: bookImageService.cache.has(`${decodedTitle}-${decodedAuthor}`.toLowerCase())
    });
  } catch (err) {
    console.error('❌ Error fetching book image:', err);
    res.status(500).json({ error: 'Server error fetching book image.' });
  }
});

// Alternative route without author parameter
router.get('/book-image/:title', async (req, res) => {
  try {
    const { title } = req.params;
    
    if (!title) {
      return res.status(400).json({ error: 'Book title is required.' });
    }
    
    const decodedTitle = decodeURIComponent(title);
    const decodedAuthor = ''; // No author for this route
    
    console.log(`🔍 Fetching book cover for: "${decodedTitle}" (no author)`);
    
    const imageUrl = await bookImageService.getBookCoverImage(decodedTitle, decodedAuthor);
    
    res.json({ 
      success: true, 
      imageUrl, 
      title: decodedTitle,
      author: decodedAuthor,
      cached: bookImageService.cache.has(`${decodedTitle}-${decodedAuthor}`.toLowerCase())
    });
  } catch (err) {
    console.error('❌ Error fetching book image:', err);
    res.status(500).json({ error: 'Server error fetching book image.' });
  }
});

// ===============================
// 🧹 POST /api/clear-image-cache - Clear book image cache (dev only)
// ===============================
router.post('/clear-image-cache', (req, res) => {
  try {
    bookImageService.clearCache();
    res.json({ success: true, message: 'Image cache cleared successfully.' });
  } catch (err) {
    console.error('❌ Error clearing cache:', err);
    res.status(500).json({ error: 'Server error clearing cache.' });
  }
});

// ===============================
// 📊 GET /api/image-cache-stats - Get image cache statistics
// ===============================
router.get('/image-cache-stats', (req, res) => {
  try {
    const stats = bookImageService.getCacheStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('❌ Error getting cache stats:', err);
    res.status(500).json({ error: 'Server error getting cache statistics.' });
  }
});

// ===============================
// 🔧 GET /api/test-book-image/:title/:author - Test book image fetching with author
// ===============================
router.get('/test-book-image/:title/:author', async (req, res) => {
  try {
    const { title, author } = req.params;
    
    console.log(`🧪 Testing image fetch for: "${title}" by "${author}"`); 
    
    const decodedTitle = decodeURIComponent(title);
    const decodedAuthor = decodeURIComponent(author);
    
    const imageUrl = await bookImageService.getBookCoverImage(decodedTitle, decodedAuthor);
    
    res.json({
      success: true,
      title: decodedTitle,
      author: decodedAuthor,
      imageUrl,
      timestamp: new Date(),
      cacheStats: bookImageService.getCacheStats()
    });
  } catch (err) {
    console.error('❌ Error in test endpoint:', err);
    res.status(500).json({ error: 'Server error testing image fetch.' });
  }
});

// ===============================
// 🔧 GET /api/test-book-image/:title - Test book image fetching without author
// ===============================
router.get('/test-book-image/:title', async (req, res) => {
  try {
    const { title } = req.params;
    
    console.log(`🧪 Testing image fetch for: "${title}" (no author)`); 
    
    const decodedTitle = decodeURIComponent(title);
    const decodedAuthor = '';
    
    const imageUrl = await bookImageService.getBookCoverImage(decodedTitle, decodedAuthor);
    
    res.json({
      success: true,
      title: decodedTitle,
      author: decodedAuthor,
      imageUrl,
      timestamp: new Date(),
      cacheStats: bookImageService.getCacheStats()
    });
  } catch (err) {
    console.error('❌ Error in test endpoint:', err);
    res.status(500).json({ error: 'Server error testing image fetch.' });
  }
});

// ===============================
// 📈 GET /api/analytics - Get platform analytics
// ===============================
router.get('/analytics', async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalSwaps = await Book.countDocuments({ status: 'swapped' });
    const totalDonations = await Book.countDocuments({ type: 'donate' });
    const activeUsers = await User.countDocuments({ 
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    const popularGenres = await Book.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({ 
      success: true, 
      analytics: {
        totalBooks,
        totalUsers,
        totalSwaps,
        totalDonations,
        activeUsers,
        popularGenres
      }
    });
  } catch (err) {
    console.error('❌ Error fetching analytics:', err);
    res.status(500).json({ error: 'Server error fetching analytics.' });
  }
});

module.exports = router;
