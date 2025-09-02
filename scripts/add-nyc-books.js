const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Database')
  .then(() => console.log('✅ Connected to MongoDB database: Database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// NYC Books data across different genres
const nycBooks = [
  // FICTION - NYC themed
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    genre: "Fiction",
    condition: "Good",
    type: "donate",
    location: "Manhattan, NYC",
    contact: "bookswap@nyc.com",
    description: "Classic coming-of-age novel set in New York City. Follows Holden Caulfield's journey through Manhattan.",
    isbn: "9780316769488",
    publishYear: 1951,
    language: "English",
    pages: 277,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "Breakfast at Tiffany's",
    author: "Truman Capote",
    genre: "Fiction",
    condition: "New",
    type: "swap",
    location: "Upper East Side, NYC",
    contact: "classics@nyc.com",
    description: "Iconic novella about Holly Golightly and life in 1940s New York City.",
    isbn: "9780679745655",
    publishYear: 1958,
    language: "English",
    pages: 95,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "The Colossus of New York",
    author: "Colson Whitehead",
    genre: "Fiction",
    condition: "Good",
    type: "donate",
    location: "Brooklyn, NYC",
    contact: "brooklyn@reads.com",
    description: "A lyrical collection of essays celebrating the essence of New York City.",
    isbn: "9781400031245",
    publishYear: 2003,
    language: "English",
    pages: 160,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "The Fortress of Solitude",
    author: "Jonathan Lethem",
    genre: "Fiction",
    condition: "Fair",
    type: "swap",
    location: "Park Slope, Brooklyn",
    contact: "literary@brooklyn.net",
    description: "Coming-of-age story set in 1970s Brooklyn, exploring race, friendship, and gentrification.",
    isbn: "9780375724886",
    publishYear: 2003,
    language: "English",
    pages: 511,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "A Tree Grows in Brooklyn",
    author: "Betty Smith",
    genre: "Fiction",
    condition: "Good",
    type: "donate",
    location: "Williamsburg, Brooklyn",
    contact: "classics@brooklyn.org",
    description: "Beloved novel about a young girl growing up in early 20th century Brooklyn.",
    isbn: "9780060736262",
    publishYear: 1943,
    language: "English",
    pages: 496,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },

  // BIOGRAPHY - NYC figures
  {
    title: "Just Kids",
    author: "Patti Smith",
    genre: "Biography",
    condition: "New",
    type: "swap",
    location: "East Village, NYC",
    contact: "memoir@nyc.com",
    description: "Patti Smith's memoir about her relationship with Robert Mapplethorpe in 1960s-70s NYC.",
    isbn: "9780066211312",
    publishYear: 2010,
    language: "English",
    pages: 304,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "The Power Broker",
    author: "Robert A. Caro",
    genre: "Biography",
    condition: "Good",
    type: "donate",
    location: "Midtown Manhattan",
    contact: "history@nyc.gov",
    description: "Pulitzer Prize-winning biography of Robert Moses and his impact on New York City.",
    isbn: "9780394720241",
    publishYear: 1974,
    language: "English",
    pages: 1162,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Boss Tweed",
    author: "Kenneth D. Ackerman",
    genre: "Biography",
    condition: "Fair",
    type: "swap",
    location: "Lower Manhattan",
    contact: "tammany@history.org",
    description: "Biography of William 'Boss' Tweed and Tammany Hall's control of 19th century NYC.",
    isbn: "9780786711347",
    publishYear: 2005,
    language: "English",
    pages: 432,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "Ed Koch and the Rebuilding of New York City",
    author: "Jonathan P. Soffer",
    genre: "Biography",
    condition: "Good",
    type: "donate",
    location: "Gracie Mansion Area",
    contact: "mayor@nyc.history",
    description: "Biography of Mayor Ed Koch and his transformative years leading New York City.",
    isbn: "9780231130905",
    publishYear: 2010,
    language: "English",
    pages: 456,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },

  // SELF-HELP - NYC lifestyle & success
  {
    title: "The New York Survival Guide",
    author: "Susan Shapiro",
    genre: "Self-help",
    condition: "New",
    type: "swap",
    location: "Greenwich Village",
    contact: "survival@nyc.tips",
    description: "Practical guide to living, working, and thriving in New York City.",
    publishYear: 2019,
    language: "English",
    pages: 280,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "Making It in Manhattan",
    author: "Jennifer Lopez",
    genre: "Self-help",
    condition: "Good",
    type: "donate",
    location: "Times Square Area",
    contact: "success@manhattan.com",
    description: "Career advice and personal stories about building success in New York City.",
    publishYear: 2018,
    language: "English",
    pages: 245,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "The NYC Networking Bible",
    author: "Michael Rodriguez",
    genre: "Self-help",
    condition: "Fair",
    type: "swap",
    location: "Financial District",
    contact: "network@wallstreet.biz",
    description: "Guide to building professional networks and business relationships in NYC.",
    publishYear: 2020,
    language: "English",
    pages: 198,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "Apartment Hunting in NYC: A Survivor's Guide",
    author: "Lisa Chen",
    genre: "Self-help",
    condition: "Good",
    type: "donate",
    location: "Queens, NYC",
    contact: "housing@queens.net",
    description: "Practical tips and strategies for finding and securing apartments in New York City.",
    publishYear: 2021,
    language: "English",
    pages: 156,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },

  // SCIENCE - NYC related scientific studies
  {
    title: "The Science of Cities",
    author: "Geoffrey West",
    genre: "Science",
    condition: "New",
    type: "swap",
    location: "Columbia University Area",
    contact: "research@columbia.edu",
    description: "Scientific analysis of urban systems with extensive NYC case studies.",
    isbn: "9780143110897",
    publishYear: 2017,
    language: "English",
    pages: 448,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "The Hidden Reality of NYC's Underground",
    author: "Dr. Patricia Williams",
    genre: "Science",
    condition: "Good",
    type: "donate",
    location: "NYU Area",
    contact: "geology@nyu.edu",
    description: "Geological and engineering analysis of NYC's subway system and underground infrastructure.",
    publishYear: 2019,
    language: "English",
    pages: 324,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Urban Ecology: Central Park Study",
    author: "Dr. James Green",
    genre: "Science",
    condition: "Fair",
    type: "swap",
    location: "Central Park West",
    contact: "ecology@parks.nyc",
    description: "Comprehensive ecological study of Central Park's biodiversity and urban ecosystem.",
    publishYear: 2020,
    language: "English",
    pages: 287,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "Climate Change and NYC: A Scientific Assessment",
    author: "Dr. Maria Santos",
    genre: "Science",
    condition: "Good",
    type: "donate",
    location: "Bronx, NYC",
    contact: "climate@bronx.edu",
    description: "Scientific analysis of climate change impacts on New York City infrastructure and environment.",
    isbn: "9780262536531",
    publishYear: 2021,
    language: "English",
    pages: 412,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },

  // Additional genres that might be added to the system
  {
    title: "The New York Times Guide to NYC",
    author: "NYT Editorial Board",
    genre: "Travel",
    condition: "New",
    type: "donate",
    location: "Times Square",
    contact: "travel@nytimes.com",
    description: "Comprehensive travel guide to New York City's attractions, restaurants, and hidden gems.",
    publishYear: 2022,
    language: "English",
    pages: 512,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "NYC Street Art: A Visual History",
    author: "Carlos Martinez",
    genre: "Art",
    condition: "Good",
    type: "swap",
    location: "Bushwick, Brooklyn",
    contact: "art@brooklyn.gallery",
    description: "Visual documentation of New York City's street art evolution from the 1980s to present.",
    publishYear: 2021,
    language: "English",
    pages: 298,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Cooking NYC: Recipes from the Five Boroughs",
    author: "Chef Isabella Romano",
    genre: "Cooking",
    condition: "Fair",
    type: "donate",
    location: "Little Italy",
    contact: "chef@littleitaly.nyc",
    description: "Authentic recipes representing the diverse culinary traditions of NYC's five boroughs.",
    publishYear: 2020,
    language: "English",
    pages: 267,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "The Business of Broadway",
    author: "David Thompson",
    genre: "Business",
    condition: "Good",
    type: "swap",
    location: "Theater District",
    contact: "broadway@theater.biz",
    description: "Inside look at the business operations and economics behind Broadway productions.",
    publishYear: 2019,
    language: "English",
    pages: 334,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "NYC Architecture: From Dutch Colonial to Modern Skyscrapers",
    author: "Prof. Robert Chen",
    genre: "Architecture",
    condition: "New",
    type: "donate",
    location: "Midtown East",
    contact: "architecture@nyc.edu",
    description: "Comprehensive guide to New York City's architectural evolution and iconic buildings.",
    publishYear: 2021,
    language: "English",
    pages: 445,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  }
];

async function addNYCBooks() {
  try {
    console.log('🗽 Starting to add NYC books to the database...');
    
    // Get a default user to associate books with (or create one)
    let defaultUser = await User.findOne({ username: 'nycbookdonor' });
    
    if (!defaultUser) {
      console.log('📚 Creating default NYC book donor user...');
      defaultUser = new User({
        username: 'nycbookdonor',
        email: 'nycbooks@bookswap.com',
        location: 'New York City',
        password: 'temppassword123', // This should be hashed in production
        totalBooksShared: 0,
        totalBooksDonated: 0
      });
      await defaultUser.save();
      console.log('✅ Default user created');
    }

    // Check how many NYC books already exist
    const existingNYCBooks = await Book.countDocuments({ 
      $or: [
        { title: { $regex: /NYC|New York|Manhattan|Brooklyn|Queens|Bronx/i } },
        { location: { $regex: /NYC|New York|Manhattan|Brooklyn|Queens|Bronx/i } }
      ]
    });
    
    console.log(`📊 Found ${existingNYCBooks} existing NYC-related books`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const bookData of nycBooks) {
      // Check if book already exists
      const existingBook = await Book.findOne({ 
        title: bookData.title,
        author: bookData.author 
      });

      if (existingBook) {
        console.log(`⏭️  Skipping "${bookData.title}" - already exists`);
        skippedCount++;
        continue;
      }

      // Add userId to book data
      const newBookData = {
        ...bookData,
        userId: defaultUser._id,
        status: 'available',
        isAvailable: true,
        isFeatured: Math.random() > 0.7, // 30% chance to be featured
        totalViews: Math.floor(Math.random() * 100),
        averageRating: Math.random() * 2 + 3, // Random rating between 3-5
        totalRatings: Math.floor(Math.random() * 10) + 1
      };

      const newBook = new Book(newBookData);
      await newBook.save();
      
      console.log(`✅ Added: "${bookData.title}" by ${bookData.author} (${bookData.genre})`);
      addedCount++;

      // Update user's donation/share count
      if (bookData.type === 'donate') {
        await User.findByIdAndUpdate(defaultUser._id, { $inc: { totalBooksDonated: 1 } });
      } else {
        await User.findByIdAndUpdate(defaultUser._id, { $inc: { totalBooksShared: 1 } });
      }
    }

    console.log('🎉 NYC Books Addition Complete!');
    console.log(`📚 Added: ${addedCount} new books`);
    console.log(`⏭️  Skipped: ${skippedCount} existing books`);
    console.log(`🗽 Total NYC books in database: ${addedCount + existingNYCBooks}`);
    
    // Get final count
    const finalCount = await Book.countDocuments();
    console.log(`📊 Total books in database: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error adding NYC books:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
addNYCBooks();
