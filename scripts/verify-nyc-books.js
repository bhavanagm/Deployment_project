const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Database')
  .then(() => console.log('✅ Connected to MongoDB database: Database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function verifyNYCBooks() {
  try {
    console.log('🔍 Verifying NYC books in the database...\n');
    
    // Get all NYC-related books
    const nycBooks = await Book.find({ 
      $or: [
        { title: { $regex: /NYC|New York|Manhattan|Brooklyn|Queens|Bronx/i } },
        { location: { $regex: /NYC|New York|Manhattan|Brooklyn|Queens|Bronx/i } },
        { description: { $regex: /NYC|New York|Manhattan|Brooklyn|Queens|Bronx/i } }
      ]
    }).populate('userId', 'username location').sort({ genre: 1, title: 1 });

    if (nycBooks.length === 0) {
      console.log('❌ No NYC books found in database');
      return;
    }

    console.log(`📚 Found ${nycBooks.length} NYC-related books:\n`);

    // Group books by genre
    const booksByGenre = nycBooks.reduce((acc, book) => {
      const genre = book.genre || 'Unknown';
      if (!acc[genre]) acc[genre] = [];
      acc[genre].push(book);
      return acc;
    }, {});

    // Display books organized by genre
    Object.keys(booksByGenre).sort().forEach(genre => {
      console.log(`📖 ${genre.toUpperCase()} (${booksByGenre[genre].length} books):`);
      console.log('=' + '='.repeat(genre.length + 20));
      
      booksByGenre[genre].forEach(book => {
        const rating = book.averageRating ? ` (⭐ ${book.averageRating.toFixed(1)}/5)` : ' (No ratings)';
        const type = book.type ? ` [${book.type.toUpperCase()}]` : '';
        const condition = book.condition ? ` - ${book.condition}` : '';
        
        console.log(`  📕 "${book.title}" by ${book.author}`);
        console.log(`     Location: ${book.location}${condition}${type}${rating}`);
        console.log(`     Owner: ${book.userId?.username || 'Unknown'}`);
        if (book.description) {
          console.log(`     Description: ${book.description.substring(0, 80)}${book.description.length > 80 ? '...' : ''}`);
        }
        console.log('');
      });
    });

    // Summary statistics
    console.log('📊 SUMMARY STATISTICS:');
    console.log('='.repeat(25));
    console.log(`Total NYC Books: ${nycBooks.length}`);
    
    const genreCounts = Object.keys(booksByGenre).map(genre => `${genre}: ${booksByGenre[genre].length}`);
    console.log(`Genres: ${genreCounts.join(', ')}`);
    
    const typeCount = nycBooks.reduce((acc, book) => {
      const type = book.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    console.log(`Types: ${Object.keys(typeCount).map(type => `${type}: ${typeCount[type]}`).join(', ')}`);
    
    const conditionCount = nycBooks.reduce((acc, book) => {
      const condition = book.condition || 'unknown';
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});
    console.log(`Conditions: ${Object.keys(conditionCount).map(condition => `${condition}: ${conditionCount[condition]}`).join(', ')}`);

    const avgRating = nycBooks.filter(book => book.averageRating).reduce((sum, book) => sum + book.averageRating, 0) / nycBooks.filter(book => book.averageRating).length;
    console.log(`Average Rating: ${avgRating ? avgRating.toFixed(2) : 'N/A'}/5`);

    console.log('\n🎉 NYC books verification complete!');

  } catch (error) {
    console.error('❌ Error verifying NYC books:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the verification
verifyNYCBooks();
