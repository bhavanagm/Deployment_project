const mongoose = require('mongoose');
const Book = require('../models/book');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Database')
  .then(() => console.log('✅ Connected to MongoDB database: Database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Better book cover placeholder images using multiple services
const bookCoverImages = [
  'https://picsum.photos/300/400?random=1',
  'https://picsum.photos/300/400?random=2', 
  'https://picsum.photos/300/400?random=3',
  'https://picsum.photos/300/400?random=4',
  'https://picsum.photos/300/400?random=5',
  'https://picsum.photos/300/400?random=6',
  'https://picsum.photos/300/400?random=7',
  'https://picsum.photos/300/400?random=8',
  'https://picsum.photos/300/400?random=9',
  'https://picsum.photos/300/400?random=10',
  'https://picsum.photos/300/400?random=11',
  'https://picsum.photos/300/400?random=12',
  'https://picsum.photos/300/400?random=13',
  'https://picsum.photos/300/400?random=14',
  'https://picsum.photos/300/400?random=15',
  'https://picsum.photos/300/400?random=16',
  'https://picsum.photos/300/400?random=17',
  'https://picsum.photos/300/400?random=18',
  'https://picsum.photos/300/400?random=19',
  'https://picsum.photos/300/400?random=20',
  'https://picsum.photos/300/400?random=21',
  'https://picsum.photos/300/400?random=22'
];

// Book-specific placeholder images (more thematic)
const genreSpecificImages = {
  'Fiction': [
    'https://via.placeholder.com/300x400/4a90e2/ffffff?text=FICTION',
    'https://via.placeholder.com/300x400/7ed321/ffffff?text=NOVEL',
    'https://via.placeholder.com/300x400/bd10e0/ffffff?text=STORY'
  ],
  'Biography': [
    'https://via.placeholder.com/300x400/f5a623/ffffff?text=BIOGRAPHY',
    'https://via.placeholder.com/300x400/d0021b/ffffff?text=MEMOIR',
    'https://via.placeholder.com/300x400/417505/ffffff?text=LIFE+STORY'
  ],
  'Science': [
    'https://via.placeholder.com/300x400/9013fe/ffffff?text=SCIENCE',
    'https://via.placeholder.com/300x400/50e3c2/ffffff?text=RESEARCH',
    'https://via.placeholder.com/300x400/b8e986/ffffff?text=STUDY'
  ],
  'Self-help': [
    'https://via.placeholder.com/300x400/4bd863/ffffff?text=SELF+HELP',
    'https://via.placeholder.com/300x400/f8e71c/ffffff?text=GUIDE',
    'https://via.placeholder.com/300x400/e67e22/ffffff?text=HOW+TO'
  ],
  'Art': [
    'https://via.placeholder.com/300x400/e74c3c/ffffff?text=ART',
    'https://via.placeholder.com/300x400/9b59b6/ffffff?text=VISUAL+ART'
  ],
  'Architecture': [
    'https://via.placeholder.com/300x400/34495e/ffffff?text=ARCHITECTURE'
  ],
  'Cooking': [
    'https://via.placeholder.com/300x400/e67e22/ffffff?text=COOKING',
    'https://via.placeholder.com/300x400/d35400/ffffff?text=RECIPES'
  ],
  'Travel': [
    'https://via.placeholder.com/300x400/3498db/ffffff?text=TRAVEL',
    'https://via.placeholder.com/300x400/2980b9/ffffff?text=GUIDE'
  ],
  'Business': [
    'https://via.placeholder.com/300x400/2c3e50/ffffff?text=BUSINESS'
  ]
};

async function fixBookImages() {
  try {
    console.log('🖼️  Starting to fix book images...');
    
    // Get all books (focus on NYC books first)
    const books = await Book.find().sort({ createdAt: -1 });
    console.log(`📚 Found ${books.length} books to update`);

    let updatedCount = 0;
    
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      let newImageUrl = '';
      
      // Check if book has a working image
      const needsNewImage = !book.image || 
                           book.image.includes('unsplash.com') || 
                           book.image.includes('via.placeholder.com/200x300');

      if (needsNewImage) {
        // Try to get genre-specific image first
        if (book.genre && genreSpecificImages[book.genre]) {
          const genreImages = genreSpecificImages[book.genre];
          const randomIndex = Math.floor(Math.random() * genreImages.length);
          newImageUrl = genreImages[randomIndex];
        } else {
          // Use general book cover placeholder
          newImageUrl = bookCoverImages[i % bookCoverImages.length];
        }

        // Update the book
        await Book.findByIdAndUpdate(book._id, { image: newImageUrl });
        
        console.log(`✅ Updated "${book.title}" with new image: ${newImageUrl}`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped "${book.title}" - already has valid image`);
      }
    }

    console.log('\n🎉 Image update complete!');
    console.log(`📊 Updated: ${updatedCount} books`);
    console.log(`⏭️  Skipped: ${books.length - updatedCount} books`);

  } catch (error) {
    console.error('❌ Error updating book images:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
fixBookImages();
