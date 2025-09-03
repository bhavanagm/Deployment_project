const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');

// Connect to MongoDB with the same connection as the app
const connectDB = async () => {
  try {
    // Use the same connection logic as server.js
    const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Database";
    console.log('🔄 Connecting to MongoDB:', mongoURI);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

async function testGallery() {
  try {
    await connectDB();
    
    console.log('\n📚 Testing Gallery Data...\n');
    
    // Get total count
    const totalBooks = await Book.countDocuments();
    console.log(`📊 Total books in database: ${totalBooks}`);
    
    if (totalBooks === 0) {
      console.log('❌ No books found in database!');
      console.log('🔧 Please run the add-diverse-books.js script first');
      return;
    }
    
    // Get books with same query as API
    const books = await Book.find({})
      .populate('userId', 'username location')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`\n📖 Sample books from API query (first 10):`);
    console.log('─'.repeat(80));
    
    books.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}" by ${book.author || 'Unknown'}`);
      console.log(`   Genre: ${book.genre || 'N/A'} | Type: ${book.type || 'N/A'} | Condition: ${book.condition || 'N/A'}`);
      console.log(`   Image: ${book.image || 'No image'}`);
      console.log(`   Owner: ${book.userId?.username || 'No owner'}`);
      console.log(`   Rating: ${book.averageRating?.toFixed(1) || '0.0'}/5 (${book.totalRatings || 0} ratings)`);
      console.log('');
    });
    
    // Test books with uploaded images
    const booksWithImages = await Book.find({ 
      image: { $regex: '^/uploads/', $options: 'i' } 
    }).limit(5);
    
    console.log(`\n📸 Books with uploaded images (${booksWithImages.length} total):`);
    console.log('─'.repeat(80));
    
    booksWithImages.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}" by ${book.author || 'Unknown'}`);
      console.log(`   Image: ${book.image}`);
      console.log(`   Genre: ${book.genre} | Type: ${book.type}`);
      console.log('');
    });
    
    // Test by genre
    const genreCounts = await Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📈 Books by Genre:');
    console.log('─'.repeat(30));
    genreCounts.forEach(genre => {
      console.log(`   ${(genre._id || 'Unknown').padEnd(15)} : ${genre.count} books`);
    });
    
    console.log('\n✅ Database test completed successfully!');
    console.log('🌐 Your gallery should now show these books.');
    console.log('🔗 Visit: http://localhost:3000/gallery');
    
  } catch (error) {
    console.error('❌ Error testing gallery:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

// Run the test
testGallery();
