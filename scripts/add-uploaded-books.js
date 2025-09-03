const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Database')
  .then(() => console.log('✅ Connected to MongoDB database: Database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Random data for books
const genres = [
  'Fiction', 'Science', 'Self-help', 'Biography', 'History', 
  'Romance', 'Mystery', 'Fantasy', 'Travel', 'Art', 'Cooking', 'Business', 'Poetry'
];

const conditions = ['New', 'Good', 'Fair', 'Used'];
const types = ['donate', 'swap'];
const locations = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'San Francisco, CA', 'Columbus, OH', 'Charlotte, NC',
  'Fort Worth, TX', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC'
];

// Random book titles and authors
const bookTitles = [
  'The Hidden Truth', 'Beyond the Horizon', 'Whispers of Tomorrow', 'The Last Journey',
  'Secrets of the Mind', 'Dancing with Shadows', 'The Golden Path', 'Echoes of Time',
  'The Silent Revolution', 'Dreams and Destiny', 'The Art of Living', 'Midnight Reflections',
  'The Perfect Storm', 'Tales from Yesterday', 'The Bright Future', 'Lost in Translation',
  'The Magic Within', 'Burning Bridges', 'The Long Road Home', 'Mysteries Unveiled',
  'The Inner Voice', 'Chasing Stars', 'The Final Chapter', 'New Beginnings',
  'The Power of Dreams', 'Silent Waters', 'The Forgotten Story', 'Rising Sun',
  'The Deep Ocean', 'Mountain Adventures', 'City of Dreams', 'The Great Discovery',
  'Love and Loss', 'The Creative Mind', 'Endless Possibilities', 'The Journey Within'
];

const authors = [
  'Sarah Johnson', 'Michael Chen', 'Emma Rodriguez', 'David Thompson', 'Lisa Williams',
  'James Anderson', 'Maria Garcia', 'Robert Brown', 'Jennifer Davis', 'Christopher Wilson',
  'Amanda Miller', 'Daniel Martinez', 'Jessica Taylor', 'Matthew Moore', 'Ashley Jackson',
  'Joshua White', 'Samantha Lee', 'Andrew Harris', 'Nicole Clark', 'Kevin Lewis',
  'Michelle Young', 'Brandon Hall', 'Stephanie Allen', 'Tyler King', 'Rachel Wright',
  'Justin Lopez', 'Megan Hill', 'Aaron Scott', 'Brittany Green', 'Nathan Adams',
  'Alexis Baker', 'Jordan Nelson', 'Taylor Carter', 'Morgan Mitchell', 'Casey Perez'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDescription() {
  const descriptions = [
    'A captivating tale that will keep you turning pages until the very end.',
    'An inspiring story about overcoming challenges and finding your true purpose.',
    'A thought-provoking exploration of human nature and society.',
    'A beautifully written book that touches the heart and soul.',
    'An engaging narrative filled with memorable characters and plot twists.',
    'A comprehensive guide that offers practical insights and advice.',
    'A fascinating journey through different cultures and perspectives.',
    'An emotional rollercoaster that explores love, loss, and redemption.',
    'A gripping story that combines mystery, adventure, and romance.',
    'An educational yet entertaining read that broadens your horizons.',
    'A timeless classic that continues to resonate with readers today.',
    'A modern masterpiece that challenges conventional thinking.',
    'An uplifting story about friendship, family, and personal growth.',
    'A well-researched work that provides deep insights into its subject.',
    'A creative and imaginative tale that transports you to another world.'
  ];
  return getRandomElement(descriptions);
}

async function addUploadedBooks() {
  try {
    console.log('📸 Adding books with uploaded images...');
    
    // Check uploads directory
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads directory not found');
      return;
    }
    
    // Get all image files
    const files = fs.readdirSync(uploadsDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      });
    
    console.log(`📁 Found ${files.length} image files in uploads`);
    
    if (files.length === 0) {
      console.log('❌ No image files found in uploads directory');
      return;
    }
    
    // Get or create default user
    let defaultUser = await User.findOne({ username: 'imageuploader' });
    
    if (!defaultUser) {
      console.log('👤 Creating image uploader user...');
      defaultUser = new User({
        username: 'imageuploader',
        email: 'imageuploader@bookswap.com',
        location: 'BookSwap Community',
        password: 'temppassword123',
        totalBooksShared: 0,
        totalBooksDonated: 0
      });
      await defaultUser.save();
      console.log('✅ Image uploader user created');
    }

    let addedCount = 0;
    let skippedCount = 0;

    // Create books for each uploaded image
    for (const filename of files) {
      try {
        // Check if book with this image already exists
        const existingBook = await Book.findOne({ image: `/uploads/${filename}` });
        
        if (existingBook) {
          console.log(`⏭️  Skipping ${filename} - book already exists`);
          skippedCount++;
          continue;
        }
        
        const bookData = {
          title: getRandomElement(bookTitles),
          author: getRandomElement(authors),
          genre: getRandomElement(genres),
          condition: getRandomElement(conditions),
          type: getRandomElement(types),
          location: getRandomElement(locations),
          contact: `${getRandomElement(['book', 'read', 'share', 'swap'])}@bookswap.com`,
          image: `/uploads/${filename}`,
          description: getRandomDescription(),
          userId: defaultUser._id,
          status: 'available',
          isAvailable: true,
          isFeatured: Math.random() > 0.7, // 30% chance to be featured
          totalViews: Math.floor(Math.random() * 200) + 10, // 10-210 views
          averageRating: Math.random() * 1.5 + 3.5, // Random rating between 3.5-5.0
          totalRatings: Math.floor(Math.random() * 50) + 1, // 1-50 ratings
          publishYear: Math.floor(Math.random() * 40) + 1985, // 1985-2024
          pages: Math.floor(Math.random() * 500) + 100, // 100-600 pages
          language: 'English'
        };
        
        const newBook = new Book(bookData);
        await newBook.save();
        
        console.log(`✅ Added: "${bookData.title}" by ${bookData.author} (${bookData.genre}) - ${filename}`);
        addedCount++;
        
        // Update user's book count
        if (bookData.type === 'donate') {
          await User.findByIdAndUpdate(defaultUser._id, { $inc: { totalBooksDonated: 1 } });
        } else {
          await User.findByIdAndUpdate(defaultUser._id, { $inc: { totalBooksShared: 1 } });
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
      }
    }

    console.log('\n🎉 Upload Books Addition Complete!');
    console.log(`📚 Added: ${addedCount} new books with uploaded images`);
    console.log(`⏭️  Skipped: ${skippedCount} existing books`);
    
    // Get final counts by genre
    const genreCounts = await Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Updated Books by Genre:');
    genreCounts.forEach(genre => {
      console.log(`   ${(genre._id || 'Unknown').padEnd(15)} : ${genre.count} books`);
    });

    // Get final total count
    const finalCount = await Book.countDocuments();
    console.log(`\n📚 Total books in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Error adding uploaded books:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
addUploadedBooks();
