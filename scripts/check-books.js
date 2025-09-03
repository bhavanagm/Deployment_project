const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Database')
  .then(() => console.log('✅ Connected to MongoDB database: Database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function checkBooks() {
  try {
    console.log('📚 Checking current books in the database...\n');
    
    // Get total count
    const totalBooks = await Book.countDocuments();
    console.log(`📊 Total books in database: ${totalBooks}\n`);
    
    // Get counts by genre
    const genreCounts = await Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📈 Books by Genre:');
    console.log('─'.repeat(30));
    
    if (genreCounts.length === 0) {
      console.log('   No books found in database');
    } else {
      genreCounts.forEach(genre => {
        console.log(`   ${(genre._id || 'Unknown').padEnd(15)} : ${genre.count.toString().padStart(3)} books`);
      });
    }
    
    console.log('─'.repeat(30));
    console.log(`   ${'TOTAL'.padEnd(15)} : ${totalBooks.toString().padStart(3)} books\n`);
    
    // Get counts by type
    const typeCounts = await Book.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📋 Books by Type:');
    console.log('─'.repeat(25));
    typeCounts.forEach(type => {
      console.log(`   ${(type._id || 'Unknown').padEnd(10)} : ${type.count.toString().padStart(3)} books`);
    });
    console.log('─'.repeat(25));
    
    // Get counts by condition
    const conditionCounts = await Book.aggregate([
      { $group: { _id: "$condition", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🏷️  Books by Condition:');
    console.log('─'.repeat(25));
    conditionCounts.forEach(condition => {
      console.log(`   ${(condition._id || 'Unknown').padEnd(10)} : ${condition.count.toString().padStart(3)} books`);
    });
    console.log('─'.repeat(25));
    
    // Sample some books
    const sampleBooks = await Book.find().limit(5).select('title author genre condition type');
    console.log('\n📖 Sample books in database:');
    console.log('─'.repeat(60));
    sampleBooks.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}" by ${book.author || 'Unknown'}`);
      console.log(`      Genre: ${book.genre || 'Unknown'} | Condition: ${book.condition || 'Unknown'} | Type: ${book.type || 'Unknown'}\n`);
    });
    
    // Check for missing genres from gallery filter
    const galleryGenres = [
      'Fiction', 'Science', 'Self-help', 'Biography', 'History', 
      'Romance', 'Mystery', 'Fantasy', 'Travel', 'Art', 'Cooking', 'Business', 'Poetry'
    ];
    
    const existingGenres = genreCounts.map(g => g._id).filter(g => g);
    const missingGenres = galleryGenres.filter(genre => !existingGenres.includes(genre));
    
    if (missingGenres.length > 0) {
      console.log('❌ Missing genres from gallery filters:');
      missingGenres.forEach(genre => {
        console.log(`   - ${genre}`);
      });
    } else {
      console.log('✅ All gallery genres are represented in the database!');
    }
    
    console.log('\n📊 Database Status Summary:');
    console.log('─'.repeat(35));
    console.log(`   Total Books: ${totalBooks}`);
    console.log(`   Genres: ${genreCounts.length}`);
    console.log(`   Types: ${typeCounts.length}`);
    console.log(`   Conditions: ${conditionCounts.length}`);
    console.log(`   Missing Genres: ${missingGenres.length}`);
    
  } catch (error) {
    console.error('❌ Error checking books:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkBooks();
