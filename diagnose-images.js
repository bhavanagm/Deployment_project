const mongoose = require('mongoose');
const Book = require('./models/book');
const fs = require('fs');
const path = require('path');

mongoose.connect('mongodb://localhost:27017/Database')
  .then(async () => {
    console.log('=== BOOK IMAGES DIAGNOSTIC ===\n');
    
    const books = await Book.find({}).limit(15);
    
    console.log(`Total books found: ${books.length}\n`);
    
    let localImages = 0;
    let externalImages = 0;
    let noImages = 0;
    let brokenLocal = 0;
    
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      console.log(`${i+1}. "${book.title}" by ${book.author}`);
      
      if (!book.image) {
        console.log('   📷 NO IMAGE');
        noImages++;
      } else if (book.image.startsWith('http')) {
        console.log(`   🌐 EXTERNAL: ${book.image}`);
        externalImages++;
      } else if (book.image.startsWith('/uploads')) {
        console.log(`   📁 LOCAL: ${book.image}`);
        localImages++;
        
        // Check if local file exists
        const filePath = path.join(__dirname, 'public', book.image);
        if (fs.existsSync(filePath)) {
          console.log('   ✅ File exists');
        } else {
          console.log('   ❌ File NOT FOUND');
          brokenLocal++;
        }
      } else {
        console.log(`   ❓ UNKNOWN FORMAT: ${book.image}`);
      }
      console.log('');
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Local images: ${localImages}`);
    console.log(`External images: ${externalImages}`);
    console.log(`No images: ${noImages}`);
    console.log(`Broken local images: ${brokenLocal}`);
    
    // Check uploads directory
    console.log('\n=== UPLOADS DIRECTORY ===');
    const uploadsPath = path.join(__dirname, 'public', 'uploads');
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      console.log(`Files in uploads directory: ${files.length}`);
      files.slice(0, 10).forEach(file => {
        console.log(`  - ${file}`);
      });
    } else {
      console.log('❌ Uploads directory does not exist!');
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
  });
