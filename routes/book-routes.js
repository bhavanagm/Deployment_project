// routes/book-routes.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const Book = require('../models/book');
const User = require('../models/user');

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

// ==========================
// 📚 POST /api/books - Add a new book
// ==========================
router.post('/', upload.single('image'), async (req, res) => {
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
// 📚 GET /api/books - Get books with filtering
// ==========================
router.get('/', async (req, res) => {
  try {
    const { genre, condition, type, showAll, search } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Only filter by available status if not showing all books
    if (!showAll) {
      filter.isAvailable = { $ne: false }; // Show available books
    }
    
    if (genre && genre !== '') filter.genre = new RegExp(genre, 'i'); // Case insensitive
    if (condition && condition !== '') filter.condition = new RegExp(condition, 'i');
    if (type && type !== '') filter.type = new RegExp(type, 'i');
    
    // Add search functionality
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { genre: searchRegex }
      ];
    }
    
    console.log('🔍 Searching books with filter:', filter);
    
    const books = await Book.find(filter)
      .populate('userId', 'username location email')
      .sort({ createdAt: -1 })
      .limit(100);
    
    console.log(`📚 Found ${books.length} books in database`);
    
    // Log sample books for debugging
    if (books.length > 0) {
      console.log('Sample books:');
      books.slice(0, 3).forEach((book, index) => {
        console.log(`${index + 1}. "${book.title}" by ${book.author} (${book.type}) - User: ${book.userId?.username || 'Unknown'}`);
      });
    } else {
      console.log('⚠️ No books found in database');
    }
    
    res.json({ 
      success: true, 
      books,
      count: books.length,
      filter: filter // Return applied filter for debugging
    });
  } catch (err) {
    console.error('❌ Error fetching books:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching books',
      error: err.message 
    });
  }
});

// ==========================
// 📚 GET /api/books/:id - Get a single book
// ==========================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findById(id)
      .populate('userId', 'username location email');
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }
    
    res.json({ 
      success: true, 
      book 
    });
  } catch (err) {
    console.error('❌ Error fetching book:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching book',
      error: err.message 
    });
  }
});

// ==========================
// 📚 PUT /api/books/:id - Update a book
// ==========================
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to update books.' });
    }

    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }
    
    // Check if user owns the book
    if (book.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own books' 
      });
    }
    
    const updateData = {
      title: req.body.title || book.title,
      author: req.body.author || book.author,
      genre: req.body.genre || book.genre,
      condition: req.body.condition || book.condition,
      type: req.body.type || book.type,
      location: req.body.location || book.location,
      contact: req.body.contact || book.contact
    };
    
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });
    
    console.log(`✅ Book updated: ${updatedBook.title} by user ${userId}`);
    res.json({ 
      success: true, 
      message: 'Book updated successfully',
      book: updatedBook 
    });
  } catch (err) {
    console.error('❌ Error updating book:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating book',
      error: err.message 
    });
  }
});

// ==========================
// 📚 DELETE /api/books/:id - Delete a book
// ==========================
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to delete books.' });
    }

    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }
    
    // Check if user owns the book
    if (book.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own books' 
      });
    }
    
    await Book.findByIdAndDelete(id);
    
    console.log(`🗑️ Book deleted: ${book.title} by user ${userId}`);
    res.json({ 
      success: true, 
      message: 'Book deleted successfully' 
    });
  } catch (err) {
    console.error('❌ Error deleting book:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting book',
      error: err.message 
    });
  }
});

module.exports = router;
