// Add sample books to the database
const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');

async function addSampleBooks() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/bookswapDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if we have any users, if not create a sample user
    let sampleUser = await User.findOne({ username: 'sampleuser' });
    if (!sampleUser) {
      sampleUser = new User({
        username: 'sampleuser',
        email: 'sample@bookswap.com',
        location: 'New York',
        password: 'sample123'
      });
      await sampleUser.save();
      console.log('✅ Created sample user');
    }
    
    // Clear existing books if any
    await Book.deleteMany({});
    console.log('🧹 Cleared existing books');
    
    // Sample books data
    const sampleBooks = [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        condition: "Good",
        type: "Donate",
        location: "New York, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A classic American novel about the Jazz Age and the American Dream.",
        averageRating: 4.2,
        totalRatings: 15,
        publishYear: 1925
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Fiction",
        condition: "New",
        type: "Swap",
        location: "Brooklyn, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A gripping tale of racial injustice and childhood innocence.",
        averageRating: 4.5,
        totalRatings: 23,
        publishYear: 1960
      },
      {
        title: "1984",
        author: "George Orwell",
        genre: "Fiction",
        condition: "Used",
        type: "Donate",
        location: "Manhattan, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A dystopian social science fiction novel and cautionary tale.",
        averageRating: 4.7,
        totalRatings: 31,
        publishYear: 1949
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Romance",
        condition: "Good",
        type: "Swap",
        location: "Queens, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A romantic novel of manners written by Jane Austen.",
        averageRating: 4.3,
        totalRatings: 18,
        publishYear: 1813
      },
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        genre: "Fiction",
        condition: "Fair",
        type: "Donate",
        location: "Bronx, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A controversial novel originally published for adults.",
        averageRating: 3.8,
        totalRatings: 12,
        publishYear: 1951
      },
      {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        genre: "Science",
        condition: "New",
        type: "Swap",
        location: "Staten Island, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A popular science book on cosmology by Stephen Hawking.",
        averageRating: 4.1,
        totalRatings: 9,
        publishYear: 1988
      },
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        genre: "Self-help",
        condition: "Good",
        type: "Donate",
        location: "Long Island, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A philosophical book about following your dreams.",
        averageRating: 4.0,
        totalRatings: 27,
        publishYear: 1988
      },
      {
        title: "Sapiens",
        author: "Yuval Noah Harari",
        genre: "History",
        condition: "New",
        type: "Swap",
        location: "Buffalo, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A brief history of humankind exploring human evolution.",
        averageRating: 4.4,
        totalRatings: 21,
        publishYear: 2011
      },
      {
        title: "The Da Vinci Code",
        author: "Dan Brown",
        genre: "Mystery",
        condition: "Used",
        type: "Donate",
        location: "Albany, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A mystery thriller novel exploring art, history, and religion.",
        averageRating: 3.9,
        totalRatings: 16,
        publishYear: 2003
      },
      {
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        genre: "Fantasy",
        condition: "Good",
        type: "Swap",
        location: "Rochester, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "The first book in the Harry Potter series.",
        averageRating: 4.6,
        totalRatings: 42,
        publishYear: 1997
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        genre: "Self-help",
        condition: "New",
        type: "Donate",
        location: "Syracuse, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "A practical guide to building good habits and breaking bad ones.",
        averageRating: 4.5,
        totalRatings: 19,
        publishYear: 2018
      },
      {
        title: "The Art of War",
        author: "Sun Tzu",
        genre: "Philosophy",
        condition: "Good",
        type: "Swap",
        location: "Ithaca, NY",
        contact: "sample@bookswap.com",
        userId: sampleUser._id,
        description: "An ancient Chinese military treatise and philosophy.",
        averageRating: 4.2,
        totalRatings: 14,
        publishYear: -500 // 5th century BC
      }
    ];
    
    // Insert sample books
    for (const bookData of sampleBooks) {
      const book = new Book(bookData);
      await book.save();
      console.log(`✅ Added book: ${book.title} by ${book.author}`);
    }
    
    console.log(`\n🎉 Successfully added ${sampleBooks.length} sample books to the database!`);
    
    // Verify the books were added
    const totalBooks = await Book.countDocuments();
    console.log(`📚 Total books in database: ${totalBooks}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample books:', error);
    process.exit(1);
  }
}

// Run the function
addSampleBooks();
