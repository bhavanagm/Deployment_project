// Script to add sample books to the database for testing
require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');

// Sample books data
const sampleBooks = [
  {
    title: "Atomic Habits",
    author: "James Clear", 
    genre: "Self-help",
    condition: "New",
    type: "donate",
    location: "Mumbai, India",
    contact: "sample@bookswap.com",
    description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
    isbn: "9780735211292",
    publishYear: 2018,
    language: "English",
    pages: 320
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Fiction", 
    condition: "Good",
    type: "swap",
    location: "Delhi, India",
    contact: "reader@bookswap.com",
    description: "A timeless tale about following your dreams",
    isbn: "9780061120084",
    publishYear: 1988,
    language: "English", 
    pages: 163
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    genre: "Business",
    condition: "Good",
    type: "donate",
    location: "Bangalore, India",
    contact: "finance@bookswap.com",
    description: "What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!",
    isbn: "9781612680194",
    publishYear: 1997,
    language: "English",
    pages: 336
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "History",
    condition: "New",
    type: "swap",
    location: "Chennai, India", 
    contact: "history@bookswap.com",
    description: "A Brief History of Humankind",
    isbn: "9780062316097",
    publishYear: 2014,
    language: "English",
    pages: 464
  },
  {
    title: "The Power of Now",
    author: "Eckhart Tolle",
    genre: "Self-help",
    condition: "Fair",
    type: "donate",
    location: "Pune, India",
    contact: "spiritual@bookswap.com", 
    description: "A Guide to Spiritual Enlightenment",
    isbn: "9781577314806",
    publishYear: 1997,
    language: "English",
    pages: 236
  },
  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    genre: "Business",
    condition: "Good",
    type: "swap",
    location: "Hyderabad, India",
    contact: "success@bookswap.com",
    description: "The Landmark Bestseller Now Revised and Updated for the 21st Century",
    isbn: "9781585424337",
    publishYear: 1937,
    language: "English",
    pages: 238
  },
  {
    title: "1984",
    author: "George Orwell",
    genre: "Fiction",
    condition: "Good", 
    type: "donate",
    location: "Kolkata, India",
    contact: "classics@bookswap.com",
    description: "A dystopian social science fiction novel and cautionary tale",
    isbn: "9780451524935",
    publishYear: 1949,
    language: "English",
    pages: 328
  },
  {
    title: "You Can Win",
    author: "Shiv Khera",
    genre: "Self-help",
    condition: "New",
    type: "swap",
    location: "Jaipur, India",
    contact: "motivation@bookswap.com",
    description: "A Step by Step Tool for Top Achievers",
    isbn: "9788172234997",
    publishYear: 1998,
    language: "English",
    pages: 256
  }
];

async function addSampleBooks() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/donatebooks';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if books already exist
    const existingBooksCount = await Book.countDocuments();
    console.log(`📚 Current books in database: ${existingBooksCount}`);

    if (existingBooksCount > 0) {
      console.log('⚠️ Books already exist in database. Skipping sample data insertion.');
      console.log('💡 To reset and add sample books, delete existing books first.');
      return;
    }

    // Find or create a sample user to associate with books
    let sampleUser = await User.findOne({ email: 'sample@bookswap.com' });
    
    if (!sampleUser) {
      sampleUser = new User({
        username: 'sampleuser',
        email: 'sample@bookswap.com', 
        password: 'password123',
        location: 'Mumbai, India',
        firstName: 'Sample',
        lastName: 'User',
        bio: 'A sample user for testing the BookSwap platform'
      });
      await sampleUser.save();
      console.log('✅ Created sample user');
    }

    // Add sample books
    console.log('📖 Adding sample books...');
    
    for (const bookData of sampleBooks) {
      const book = new Book({
        ...bookData,
        userId: sampleUser._id,
        status: 'available',
        isAvailable: true,
        averageRating: Math.random() * 2 + 3, // Random rating between 3-5
        totalRatings: Math.floor(Math.random() * 10) + 1,
        totalViews: Math.floor(Math.random() * 100) + 10
      });
      
      await book.save();
      console.log(`✅ Added: "${book.title}" by ${book.author}`);
    }

    // Update user's book counts
    await User.findByIdAndUpdate(sampleUser._id, {
      totalBooksShared: sampleBooks.length,
      totalBooksDonated: sampleBooks.filter(b => b.type === 'donate').length,
      totalPoints: sampleBooks.length * 10
    });

    console.log('\n🎉 Sample books added successfully!');
    console.log(`📊 Total books added: ${sampleBooks.length}`);
    console.log(`👤 Associated with user: ${sampleUser.username}`);
    console.log('\n💡 You can now test the gallery and pickup functionality!');

  } catch (error) {
    console.error('❌ Error adding sample books:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addSampleBooks();
}

module.exports = { addSampleBooks, sampleBooks };
