const mongoose = require('mongoose');
const Book = require('../models/book');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Database')
  .then(() => console.log('✅ Connected to MongoDB database: Database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Diverse books collection covering all genres
const diverseBooks = [
  // FICTION - Popular classics and modern fiction
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Fiction",
    condition: "Good",
    type: "donate",
    location: "Seattle, WA",
    contact: "classics@bookswap.com",
    description: "A gripping tale of racial injustice and childhood innocence in the American South.",
    isbn: "9780060935467",
    publishYear: 1960,
    language: "English",
    pages: 384,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "1984",
    author: "George Orwell",
    genre: "Fiction",
    condition: "New",
    type: "swap",
    location: "Portland, OR",
    contact: "dystopia@reads.com",
    description: "A dystopian social science fiction novel about totalitarian control.",
    isbn: "9780452284234",
    publishYear: 1949,
    language: "English",
    pages: 328,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Fiction",
    condition: "Fair",
    type: "donate",
    location: "Los Angeles, CA",
    contact: "jazz@age.com",
    description: "The story of Jay Gatsby and his pursuit of the American Dream during the Jazz Age.",
    isbn: "9780743273565",
    publishYear: 1925,
    language: "English",
    pages: 180,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Fiction",
    condition: "Good",
    type: "swap",
    location: "Miami, FL",
    contact: "dreams@pursuit.org",
    description: "A philosophical novel about a shepherd boy's journey to find treasure.",
    isbn: "9780062315007",
    publishYear: 1988,
    language: "English",
    pages: 163,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Fiction",
    condition: "New",
    type: "donate",
    location: "Boston, MA",
    contact: "regency@romance.com",
    description: "A romantic novel about manners, upbringing, and moral development.",
    isbn: "9780141439518",
    publishYear: 1813,
    language: "English",
    pages: 432,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },

  // SCIENCE - Popular science books
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    genre: "Science",
    condition: "Good",
    type: "swap",
    location: "Chicago, IL",
    contact: "cosmos@physics.edu",
    description: "Accessible explanation of cosmology, black holes, and the nature of time.",
    isbn: "9780553380163",
    publishYear: 1988,
    language: "English",
    pages: 256,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "The Selfish Gene",
    author: "Richard Dawkins",
    genre: "Science",
    condition: "Fair",
    type: "donate",
    location: "San Francisco, CA",
    contact: "evolution@biology.net",
    description: "Groundbreaking book explaining evolution from the gene's perspective.",
    isbn: "9780199291151",
    publishYear: 1976,
    language: "English",
    pages: 360,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    genre: "Science",
    condition: "New",
    type: "swap",
    location: "Austin, TX",
    contact: "space@astronomy.org",
    description: "Journey through space and time exploring the universe and our place in it.",
    isbn: "9780345331359",
    publishYear: 1980,
    language: "English",
    pages: 365,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "The Origin of Species",
    author: "Charles Darwin",
    genre: "Science",
    condition: "Good",
    type: "donate",
    location: "Denver, CO",
    contact: "natural@selection.com",
    description: "Darwin's revolutionary work on the theory of evolution by natural selection.",
    isbn: "9780451529060",
    publishYear: 1859,
    language: "English",
    pages: 496,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },

  // SELF-HELP - Popular self-improvement books
  {
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-help",
    condition: "New",
    type: "swap",
    location: "Nashville, TN",
    contact: "habits@improvement.com",
    description: "Proven strategies for building good habits and breaking bad ones.",
    isbn: "9780735211292",
    publishYear: 2018,
    language: "English",
    pages: 320,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "The Power of Now",
    author: "Eckhart Tolle",
    genre: "Self-help",
    condition: "Good",
    type: "donate",
    location: "San Diego, CA",
    contact: "mindfulness@present.org",
    description: "Spiritual guide to finding enlightenment through living in the present moment.",
    isbn: "9781577314806",
    publishYear: 1997,
    language: "English",
    pages: 236,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    genre: "Self-help",
    condition: "Fair",
    type: "swap",
    location: "Phoenix, AZ",
    contact: "wealth@mindset.biz",
    description: "Classic guide to achieving financial success through positive thinking.",
    isbn: "9781585424337",
    publishYear: 1937,
    language: "English",
    pages: 320,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    genre: "Self-help",
    condition: "Good",
    type: "donate",
    location: "Salt Lake City, UT",
    contact: "leadership@effective.org",
    description: "Timeless principles for personal and professional effectiveness.",
    isbn: "9780743269513",
    publishYear: 1989,
    language: "English",
    pages: 384,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },

  // BIOGRAPHY - Famous personalities
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    genre: "Biography",
    condition: "New",
    type: "swap",
    location: "Cupertino, CA",
    contact: "tech@innovation.com",
    description: "Definitive biography of Apple's co-founder and technology visionary.",
    isbn: "9781451648539",
    publishYear: 2011,
    language: "English",
    pages: 656,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "Long Walk to Freedom",
    author: "Nelson Mandela",
    genre: "Biography",
    condition: "Good",
    type: "donate",
    location: "Atlanta, GA",
    contact: "freedom@democracy.org",
    description: "Autobiography of South Africa's first democratically elected president.",
    isbn: "9780316548182",
    publishYear: 1994,
    language: "English",
    pages: 656,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Einstein: His Life and Universe",
    author: "Walter Isaacson",
    genre: "Biography",
    condition: "Fair",
    type: "swap",
    location: "Princeton, NJ",
    contact: "genius@relativity.edu",
    description: "Comprehensive biography of the greatest scientist of the modern era.",
    isbn: "9780743264747",
    publishYear: 2007,
    language: "English",
    pages: 704,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Biography",
    condition: "New",
    type: "donate",
    location: "Washington, DC",
    contact: "hope@inspire.gov",
    description: "Intimate memoir of the former First Lady's journey from Chicago to the White House.",
    isbn: "9781524763138",
    publishYear: 2018,
    language: "English",
    pages: 448,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },

  // HISTORY - Important historical works
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    genre: "History",
    condition: "Good",
    type: "swap",
    location: "Philadelphia, PA",
    contact: "humanity@evolution.org",
    description: "Fascinating exploration of how Homo sapiens came to dominate Earth.",
    isbn: "9780062316097",
    publishYear: 2011,
    language: "English",
    pages: 443,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "The Guns of August",
    author: "Barbara Tuchman",
    genre: "History",
    condition: "Fair",
    type: "donate",
    location: "Richmond, VA",
    contact: "wwi@military.edu",
    description: "Pulitzer Prize-winning account of the first month of World War I.",
    isbn: "9780345476098",
    publishYear: 1962,
    language: "English",
    pages: 511,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "1776",
    author: "David McCullough",
    genre: "History",
    condition: "New",
    type: "swap",
    location: "Boston, MA",
    contact: "revolution@american.org",
    description: "Vivid account of the pivotal year in American independence.",
    isbn: "9780743226721",
    publishYear: 2005,
    language: "English",
    pages: 386,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },

  // ROMANCE - Popular romance novels
  {
    title: "The Notebook",
    author: "Nicholas Sparks",
    genre: "Romance",
    condition: "Good",
    type: "donate",
    location: "Charleston, SC",
    contact: "love@forever.com",
    description: "Heartwarming tale of enduring love between Noah and Allie.",
    isbn: "9780446605236",
    publishYear: 1996,
    language: "English",
    pages: 214,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "Me Before You",
    author: "Jojo Moyes",
    genre: "Romance",
    condition: "New",
    type: "swap",
    location: "Portland, ME",
    contact: "choices@life.org",
    description: "Emotional story of Louisa and Will, exploring love, life, and difficult choices.",
    isbn: "9780143124542",
    publishYear: 2012,
    language: "English",
    pages: 369,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "The Time Traveler's Wife",
    author: "Audrey Niffenegger",
    genre: "Romance",
    condition: "Fair",
    type: "donate",
    location: "Milwaukee, WI",
    contact: "time@love.net",
    description: "Unique love story between Henry and Clare across different times.",
    isbn: "9780156029431",
    publishYear: 2003,
    language: "English",
    pages: 546,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },

  // MYSTERY - Popular mystery novels
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    genre: "Mystery",
    condition: "Good",
    type: "swap",
    location: "Kansas City, MO",
    contact: "disappear@mystery.com",
    description: "Psychological thriller about a marriage gone terribly wrong.",
    isbn: "9780307588364",
    publishYear: 2012,
    language: "English",
    pages: 419,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    genre: "Mystery",
    condition: "New",
    type: "donate",
    location: "Minneapolis, MN",
    contact: "nordic@noir.se",
    description: "Swedish crime novel featuring journalist Mikael Blomkvist and hacker Lisbeth Salander.",
    isbn: "9780307949486",
    publishYear: 2005,
    language: "English",
    pages: 590,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "The Da Vinci Code",
    author: "Dan Brown",
    genre: "Mystery",
    condition: "Fair",
    type: "swap",
    location: "Providence, RI",
    contact: "symbols@conspiracy.org",
    description: "Thriller following symbologist Robert Langdon's quest to solve a murder at the Louvre.",
    isbn: "9780307474278",
    publishYear: 2003,
    language: "English",
    pages: 597,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },

  // FANTASY - Popular fantasy novels
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    condition: "Good",
    type: "donate",
    location: "Eugene, OR",
    contact: "middle@earth.com",
    description: "Classic fantasy adventure of Bilbo Baggins and his unexpected journey.",
    isbn: "9780547928227",
    publishYear: 1937,
    language: "English",
    pages: 366,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    genre: "Fantasy",
    condition: "New",
    type: "swap",
    location: "Orlando, FL",
    contact: "magic@hogwarts.edu",
    description: "The beginning of Harry Potter's magical journey at Hogwarts School.",
    isbn: "9780439708180",
    publishYear: 1997,
    language: "English",
    pages: 309,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "Game of Thrones",
    author: "George R.R. Martin",
    genre: "Fantasy",
    condition: "Fair",
    type: "donate",
    location: "Albuquerque, NM",
    contact: "winter@westeros.org",
    description: "Epic fantasy of political intrigue and war in the Seven Kingdoms.",
    isbn: "9780553103540",
    publishYear: 1996,
    language: "English",
    pages: 694,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },

  // TRAVEL - Travel guides and narratives
  {
    title: "A Walk in the Woods",
    author: "Bill Bryson",
    genre: "Travel",
    condition: "Good",
    type: "swap",
    location: "Appalachian Trail, VA",
    contact: "hiking@trails.org",
    description: "Humorous account of hiking the Appalachian Trail.",
    isbn: "9780767902847",
    publishYear: 1998,
    language: "English",
    pages: 397,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "Eat, Pray, Love",
    author: "Elizabeth Gilbert",
    genre: "Travel",
    condition: "New",
    type: "donate",
    location: "Santa Fe, NM",
    contact: "journey@discovery.com",
    description: "One woman's journey of self-discovery through Italy, India, and Indonesia.",
    isbn: "9780143038412",
    publishYear: 2006,
    language: "English",
    pages: 352,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Into the Wild",
    author: "Jon Krakauer",
    genre: "Travel",
    condition: "Fair",
    type: "swap",
    location: "Anchorage, AK",
    contact: "wilderness@adventure.net",
    description: "True story of Christopher McCandless's journey into the Alaskan wilderness.",
    isbn: "9780385486804",
    publishYear: 1996,
    language: "English",
    pages: 207,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },

  // ART - Art history and criticism
  {
    title: "The Story of Art",
    author: "E.H. Gombrich",
    genre: "Art",
    condition: "Good",
    type: "donate",
    location: "Santa Barbara, CA",
    contact: "museum@art.edu",
    description: "Classic introduction to art history from cave paintings to modern art.",
    isbn: "9780714832470",
    publishYear: 1950,
    language: "English",
    pages: 688,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "Ways of Seeing",
    author: "John Berger",
    genre: "Art",
    condition: "New",
    type: "swap",
    location: "Savannah, GA",
    contact: "vision@perspective.org",
    description: "Influential book on how we look at and interpret visual culture.",
    isbn: "9780140135152",
    publishYear: 1972,
    language: "English",
    pages: 176,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },

  // COOKING - Popular cookbooks
  {
    title: "Salt, Fat, Acid, Heat",
    author: "Samin Nosrat",
    genre: "Cooking",
    condition: "New",
    type: "donate",
    location: "Berkeley, CA",
    contact: "flavor@kitchen.com",
    description: "Master the four fundamental elements of good cooking.",
    isbn: "9781476753836",
    publishYear: 2017,
    language: "English",
    pages: 480,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "The Joy of Cooking",
    author: "Irma S. Rombauer",
    genre: "Cooking",
    condition: "Good",
    type: "swap",
    location: "St. Louis, MO",
    contact: "recipes@classic.com",
    description: "America's most trusted cookbook for over 90 years.",
    isbn: "9780743246262",
    publishYear: 1931,
    language: "English",
    pages: 1152,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },
  {
    title: "Kitchen Confidential",
    author: "Anthony Bourdain",
    genre: "Cooking",
    condition: "Fair",
    type: "donate",
    location: "New Orleans, LA",
    contact: "chef@behind.scenes",
    description: "Insider's look at the restaurant industry and culinary world.",
    isbn: "9780060899226",
    publishYear: 2000,
    language: "English",
    pages: 312,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },

  // BUSINESS - Popular business books
  {
    title: "Good to Great",
    author: "Jim Collins",
    genre: "Business",
    condition: "New",
    type: "swap",
    location: "Boulder, CO",
    contact: "excellence@leadership.biz",
    description: "Research-based insights on what makes companies transition from good to great.",
    isbn: "9780066620992",
    publishYear: 2001,
    language: "English",
    pages: 320,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "The Lean Startup",
    author: "Eric Ries",
    genre: "Business",
    condition: "Good",
    type: "donate",
    location: "Palo Alto, CA",
    contact: "startup@innovation.com",
    description: "How today's entrepreneurs use continuous innovation to create radically successful businesses.",
    isbn: "9780307887894",
    publishYear: 2011,
    language: "English",
    pages: 336,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  },
  {
    title: "Freakonomics",
    author: "Steven D. Levitt",
    genre: "Business",
    condition: "Fair",
    type: "swap",
    location: "Chicago, IL",
    contact: "economics@freaky.edu",
    description: "Exploring the hidden side of everything through economic analysis.",
    isbn: "9780060731335",
    publishYear: 2005,
    language: "English",
    pages: 352,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
  },

  // POETRY - Classic and modern poetry
  {
    title: "Leaves of Grass",
    author: "Walt Whitman",
    genre: "Poetry",
    condition: "Good",
    type: "donate",
    location: "Camden, NJ",
    contact: "america@poetry.org",
    description: "Classic collection of American poetry celebrating democracy and the individual.",
    isbn: "9780486456768",
    publishYear: 1855,
    language: "English",
    pages: 464,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
  },
  {
    title: "The Complete Poems of Maya Angelou",
    author: "Maya Angelou",
    genre: "Poetry",
    condition: "New",
    type: "swap",
    location: "Winston-Salem, NC",
    contact: "voice@hope.org",
    description: "Complete collection of poetry from one of America's most beloved writers.",
    isbn: "9780679428954",
    publishYear: 1994,
    language: "English",
    pages: 305,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
  },
  {
    title: "Milk and Honey",
    author: "Rupi Kaur",
    genre: "Poetry",
    condition: "Fair",
    type: "donate",
    location: "Toronto, ON",
    contact: "modern@verse.ca",
    description: "Contemporary poetry collection about survival, healing, and love.",
    isbn: "9781449474256",
    publishYear: 2014,
    language: "English",
    pages: 204,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
  }
];

async function addDiverseBooks() {
  try {
    console.log('🌍 Starting to add diverse books to the database...');
    
    // Get a default user to associate books with (or create one)
    let defaultUser = await User.findOne({ username: 'bookswap_curator' });
    
    if (!defaultUser) {
      console.log('👤 Creating default curator user...');
      defaultUser = new User({
        username: 'bookswap_curator',
        email: 'curator@bookswap.com',
        location: 'BookSwap Community',
        password: 'temppassword123', // This should be hashed in production
        totalBooksShared: 0,
        totalBooksDonated: 0
      });
      await defaultUser.save();
      console.log('✅ Default curator user created');
    }

    // Check existing books count
    const existingBooksCount = await Book.countDocuments();
    console.log(`📊 Current books in database: ${existingBooksCount}`);

    let addedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const bookData of diverseBooks) {
      // Check if book already exists (by title and author)
      const existingBook = await Book.findOne({ 
        title: bookData.title,
        author: bookData.author 
      });

      if (existingBook) {
        // Update existing book with any missing fields
        const updateData = {};
        let hasUpdates = false;

        // Check and update missing fields
        if (!existingBook.isbn && bookData.isbn) {
          updateData.isbn = bookData.isbn;
          hasUpdates = true;
        }
        if (!existingBook.publishYear && bookData.publishYear) {
          updateData.publishYear = bookData.publishYear;
          hasUpdates = true;
        }
        if (!existingBook.description && bookData.description) {
          updateData.description = bookData.description;
          hasUpdates = true;
        }
        if (!existingBook.pages && bookData.pages) {
          updateData.pages = bookData.pages;
          hasUpdates = true;
        }

        if (hasUpdates) {
          await Book.findByIdAndUpdate(existingBook._id, updateData);
          console.log(`🔄 Updated: "${bookData.title}" with additional metadata`);
          updatedCount++;
        } else {
          console.log(`⏭️  Skipping: "${bookData.title}" - already exists with complete data`);
          skippedCount++;
        }
        continue;
      }

      // Add userId and additional fields to book data
      const newBookData = {
        ...bookData,
        userId: defaultUser._id,
        status: 'available',
        isAvailable: true,
        isFeatured: Math.random() > 0.8, // 20% chance to be featured
        totalViews: Math.floor(Math.random() * 150) + 5, // 5-155 views
        averageRating: Math.random() * 1.5 + 3.5, // Random rating between 3.5-5.0
        totalRatings: Math.floor(Math.random() * 25) + 1 // 1-25 ratings
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

    console.log('🎉 Diverse Books Addition Complete!');
    console.log(`📚 Added: ${addedCount} new books`);
    console.log(`🔄 Updated: ${updatedCount} existing books`);
    console.log(`⏭️  Skipped: ${skippedCount} existing books`);
    
    // Get final counts by genre
    const genreCounts = await Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Books by Genre:');
    genreCounts.forEach(genre => {
      console.log(`   ${genre._id}: ${genre.count} books`);
    });

    // Get final total count
    const finalCount = await Book.countDocuments();
    console.log(`\n📚 Total books in database: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error adding diverse books:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
addDiverseBooks();
