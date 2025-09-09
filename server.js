// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const User = require('./models/user');
const Book = require('./models/book');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://mongodb-service:27017/donatebooks";
    console.log('🔄 Attempting MongoDB connection to:', mongoURI.replace(/:\/\/.*@/, '://***:***@'));
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('❌ Full error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'bookSwapSecretKey',
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: http:; connect-src 'self';");
  next();
});

// ✅ Static file serving
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ API routes
app.use('/api', apiRoutes);

// 🤖 Chatbot API route
app.use('/api/chatbot', require('./utils/chatbot'));

// 🤖 Backup chatbot endpoint (if utils/chatbot fails)
app.post('/api/chatbot-backup', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const msg = message.toLowerCase();
  let reply = "I'm here to help! Try asking about book recommendations, donations, swaps, or pickups.";
  
  // Book recommendations
  if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('book recommendation')) {
    reply = "Sure! What genre are you interested in? I can suggest:\n🔮 Fiction\n🔬 Science\n📚 Self-Help\n🏛️ History\n💕 Romance\n🔍 Mystery";
  } else if (msg.includes('fiction')) {
    reply = "📖 Great fiction books available:\n• The Alchemist by Paulo Coelho\n• To Kill a Mockingbird by Harper Lee\n• 1984 by George Orwell\n• Pride and Prejudice by Jane Austen";
  } else if (msg.includes('science')) {
    reply = "🔬 Recommended science books:\n• A Brief History of Time by Stephen Hawking\n• The Selfish Gene by Richard Dawkins\n• Cosmos by Carl Sagan\n• The Origin of Species by Charles Darwin";
  } else if (msg.includes('self-help') || msg.includes('self help')) {
    reply = "🎯 Popular self-help books:\n• Atomic Habits by James Clear\n• The Power of Now by Eckhart Tolle\n• Think and Grow Rich by Napoleon Hill\n• 7 Habits of Highly Effective People by Stephen Covey";
  } 
  // Platform guidance
  else if (msg.includes('how to donate') || msg.includes('donate book') || msg.includes('donation')) {
    reply = "📚 To donate a book:\n1. Go to 'Add Book' page\n2. Fill in book details\n3. Select 'Donate' as book type\n4. Upload a photo\n5. Submit the form\n\nYour book will be available for others to request!";
  } else if (msg.includes('how to swap') || msg.includes('swap book') || msg.includes('book swap')) {
    reply = "🔄 To swap books:\n1. Browse the Gallery\n2. Look for books marked as 'Swap'\n3. Contact the book owner\n4. Arrange the exchange\n\nMake sure you have books to offer in return!";
  } else if (msg.includes('pickup') || msg.includes('collect')) {
    reply = "🚚 For book pickup:\n1. Go to 'Pickup Request' page\n2. Enter your details\n3. Specify pickup address\n4. Submit the request\n\nThe book owner will be notified and will contact you!";
  } else if (msg.includes('profile') || msg.includes('account')) {
    reply = "👤 Your profile contains:\n• Your book collection\n• Achievements and badges\n• Reading statistics\n• Message history\n\nUpdate your profile to connect with more book lovers!";
  } else if (msg.includes('achievement') || msg.includes('badge') || msg.includes('level')) {
    reply = "🏆 Earn achievements by:\n• Sharing your first book 📚\n• Donating 5+ books 💝\n• Completing book swaps 🔄\n• Writing reviews ⭐\n• Being an active member 🤝\n\nCheck your dashboard for current achievements!";
  } else if (msg.includes('message') || msg.includes('chat') || msg.includes('contact')) {
    reply = "💬 To message other users:\n1. Find a book in the Gallery\n2. Click 'Contact Owner'\n3. Send your message\n4. Check your profile for replies\n\nBe friendly and respectful in your conversations!";
  } 
  // Greetings
  else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    reply = "👋 Hello! I'm Elina, your BookSwap assistant! I can help you with:\n\n📚 Book recommendations\n🎁 Donation process\n🔄 Book swapping\n🚚 Pickup arrangements\n👤 Account help\n\nWhat would you like to know about?";
  } else if (msg.includes('thank') || msg.includes('thanks')) {
    reply = "😊 You're welcome! Happy reading and book sharing! Feel free to ask me anything else about BookSwap.";
  } else if (msg.includes('bye') || msg.includes('goodbye')) {
    reply = "👋 Goodbye! Come back anytime you need help with BookSwap. Happy reading!";
  }
  
  res.json({ reply, timestamp: new Date().toISOString() });
});

// ✅ Page routes
// ✅ Page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/home');
});

app.get('/index', (req, res) => {
  if (req.session.user) {
    // Read the HTML file and inject user data
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
    
    // Inject user data into the page
    const userScript = `
      <script>
        window.currentUser = {
          id: '${req.session.user.id}',
          username: '${req.session.user.username}',
          email: '${req.session.user.email}'
        };
        window.currentUserId = '${req.session.user.id}';
      </script>
    `;
    
    html = html.replace('</head>', `${userScript}</head>`);
    res.send(html);
  } else {
    res.redirect('/login');
  }
});

app.get('/add-book', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'add-book.html'));
});

app.get('/gallery', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'views', 'gallery.html');
    console.log('📖 Gallery route accessed, file path:', filePath);
    
    // Check if file exists before sending
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.error('❌ Gallery file not found at:', filePath);
      return res.status(404).send('Gallery file not found');
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('❌ Error serving gallery:', error.message);
    res.status(500).send('Internal server error');
  }
});

app.get('/pickup-request', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pickup.html'));
});

// Redirect route for pickup (handles both /Pickup and /pickup)
app.get('/pickup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pickup.html'));
});

app.get('/Pickup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pickup.html'));
});

app.get('/pickup-track', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pickup-track.html'));
});

app.get('/otp-verification', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'otp-verification.html'));
});

app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'chatbot.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// ✅ Debug / Test routes
app.get('/test-pickup', (req, res) => {
  res.send("🚚 Test pickup route is working!");
});

// Serves files from /debug folder if it exists
app.use('/debug-files', express.static(path.join(__dirname, 'debug')));

// 📊 Dashboard Route
app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
  } else {
    res.redirect('/login');
  }
});

// Test route
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-register.html'));
});

// Removed obsolete test gallery routes

app.get('/test-image', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'test-image.html'));
});

app.get('/image-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'image-test.html'));
});

// Removed obsolete debug-gallery route

app.get('/test-image-urls', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-image-urls.html'));
});

// Debug route to check book image paths
app.get('/debug-books', async (req, res) => {
  try {
    const books = await Book.find().limit(10).select('title author genre image createdAt');
    const bookData = books.map(book => ({
      id: book._id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      image: book.image,
      imageExists: book.image ? require('fs').existsSync(path.join(__dirname, 'public', book.image)) : false,
      createdAt: book.createdAt
    }));
    
    res.json({
      success: true,
      count: books.length,
      books: bookData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ POST: User Registration
app.post('/register', async (req, res) => {
  console.log('🔄 Raw request body:', req.body);
  console.log('🔄 Request headers:', req.headers);
  
  const { username, email, location, password } = req.body;
  console.log('📝 Registration attempt:', { username, email, location, hasPassword: !!password });
  
  // Determine response format (JSON vs redirect)
  const isJsonRequest = req.headers['content-type'] && req.headers['content-type'].includes('application/json');
  
  try {
    // Input validation
    if (!username || !email || !location || !password) {
      const message = 'All fields are required.';
      if (isJsonRequest) {
        return res.status(400).json({ success: false, message });
      }
      return res.redirect(`/register?error=validation&message=${encodeURIComponent(message)}`);
    }

    if (username.length < 3) {
      const message = 'Username must be at least 3 characters long.';
      if (isJsonRequest) {
        return res.status(400).json({ success: false, message });
      }
      return res.redirect(`/register?error=validation&message=${encodeURIComponent(message)}`);
    }

    if (password.length < 6) {
      const message = 'Password must be at least 6 characters long.';
      if (isJsonRequest) {
        return res.status(400).json({ success: false, message });
      }
      return res.redirect(`/register?error=validation&message=${encodeURIComponent(message)}`);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      const message = existingUser.username === username ? 
        'Username already exists. Please choose a different username.' : 
        'Email already exists. Please use a different email address.';
      
      if (isJsonRequest) {
        return res.status(400).json({ success: false, message });
      }
      return res.redirect(`/register?error=exists&message=${encodeURIComponent(message)}`);
    }

    // Create new user
    const user = new User({ 
      username: username.trim(), 
      email: email.trim().toLowerCase(),
      location: location.trim(),
      password 
    });
    
    await user.save();
    
    console.log(`✅ New user registered: ${username} (${email})`);
    
    if (isJsonRequest) {
      return res.status(201).json({ 
        success: true, 
        message: 'Account created successfully!' 
      });
    }
    
    // Redirect to login with success message
    res.redirect('/login?success=registered');
    
  } catch (err) {
    console.error('❌ Registration error:', err);
    console.error('❌ Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    let message = 'Server error. Please try again later.';
    if (err.name === 'ValidationError') {
      message = `Validation error: ${err.message}`;
    } else if (err.code === 11000) {
      message = 'Username or email already exists.';
    }
    
    if (isJsonRequest) {
      return res.status(500).json({ success: false, message, error: err.message });
    }
    
    res.redirect(`/register?error=server&message=${encodeURIComponent(message)}`);
  }
});

// Simple rate limiting storage (in production, use Redis or proper solution)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// ✅ POST: User Login
app.post('/login', async (req, res) => {
  console.log('🔍 Login request received');
  console.log('📋 Request headers:', req.headers);
  console.log('📦 Request body:', req.body);
  
  const { username, password } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  const attemptKey = `${clientIP}:${username}`;
  
  console.log(`🔄 Login attempt for: ${username}`);
  console.log(`📍 Extracted values - Username: ${username}, Password: ${password ? '[PROVIDED]' : '[MISSING]'}`);
  
  try {
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    // Check rate limiting
    const attempts = loginAttempts.get(attemptKey);
    if (attempts && attempts.count >= MAX_ATTEMPTS) {
      const timeLeft = LOCKOUT_TIME - (Date.now() - attempts.firstAttempt);
      if (timeLeft > 0) {
        console.log(`🚫 Rate limited login attempt from ${clientIP} for user: ${username}`);
        return res.status(429).send(`Too many failed attempts. Try again in ${Math.ceil(timeLeft / 60000)} minutes.`);
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(attemptKey);
      }
    }

    // Find user by username or email
    console.log(`🔍 Looking for user: ${username}`);
    const user = await User.findOne({ 
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
    });
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
    } else {
      console.log(`✅ User found: ${user.username}, password type: ${user.password.startsWith('$2b$') ? 'hashed' : 'plain'}`);
    }
    
    // Check if user exists and password is correct
    let passwordMatches = false;
    if (user) {
      try {
        // Handle both hashed and plain text passwords for backward compatibility
        if (user.password.startsWith('$2b$')) {
          // Hashed password - use bcrypt
          console.log('🔐 Using bcrypt comparison');
          if (typeof user.comparePassword === 'function') {
            passwordMatches = await user.comparePassword(password);
          } else {
            // Fallback to direct bcrypt comparison
            const bcrypt = require('bcrypt');
            passwordMatches = await bcrypt.compare(password, user.password);
          }
        } else {
          // Plain text password - direct comparison (temporary)
          console.log('📝 Using plain text comparison');
          passwordMatches = user.password === password;
        }
        console.log(`🔍 Password match result: ${passwordMatches}`);
      } catch (bcryptError) {
        console.error('❌ Bcrypt comparison error:', bcryptError.message);
        passwordMatches = false;
      }
    }
    
    if (!user || !passwordMatches) {
      // Record failed attempt
      const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, firstAttempt: Date.now() };
      currentAttempts.count++;
      if (currentAttempts.count === 1) {
        currentAttempts.firstAttempt = Date.now();
      }
      loginAttempts.set(attemptKey, currentAttempts);
      
      console.log(`❌ Failed login attempt for: ${username} (${clientIP}) - Attempt ${currentAttempts.count}/${MAX_ATTEMPTS}`);
      return res.status(401).send('Invalid username/email or password');
    }
    
    // Successful login - clear any failed attempts
    loginAttempts.delete(attemptKey);
    
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      location: user.location
    };
    
    console.log(`✅ User logged in: ${user.username} (${clientIP})`);
    res.redirect('/index');
    
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).send('Server error. Please try again.');
  }
});

// 🧪 GET: Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    // Test database connection
    const dbState = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    // Test collection access
    const userCount = await User.countDocuments();
    
    res.json({ 
      success: true, 
      database: 'Database',
      connectionState: states[dbState],
      userCount,
      message: 'Database connection working!' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: err.message 
    });
  }
});

// 🧪 GET: Check users (for testing)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email location createdAt').limit(10);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// 🧪 GET: Login attempt statistics (for debugging)
app.get('/api/login-stats', (req, res) => {
  const stats = [];
  loginAttempts.forEach((attempts, key) => {
    const [ip, username] = key.split(':');
    stats.push({
      ip,
      username,
      failedAttempts: attempts.count,
      firstAttempt: new Date(attempts.firstAttempt).toLocaleString(),
      timeUntilReset: Math.max(0, Math.ceil((LOCKOUT_TIME - (Date.now() - attempts.firstAttempt)) / 60000))
    });
  });
  
  res.json({ 
    success: true, 
    currentAttempts: stats,
    maxAttempts: MAX_ATTEMPTS,
    lockoutMinutes: LOCKOUT_TIME / 60000
  });
});

// 🧪 GET: Current user session data
app.get('/api/current-user', (req, res) => {
  if (req.session.user) {
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not logged in'
    });
  }
});

// 🧪 POST: Create test user (for development only)
app.post('/api/create-test-user', async (req, res) => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    
    if (existingUser) {
      return res.json({
        success: true,
        message: 'Test user already exists',
        credentials: {
          username: 'testuser',
          email: 'test@bookswap.com',
          password: 'test123'
        }
      });
    }
    
    // Create test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@bookswap.com',
      location: 'Test City',
      password: 'test123'
    });
    
    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    
    res.json({
      success: true,
      message: 'Test user created successfully!',
      credentials: {
        username: 'testuser',
        email: 'test@bookswap.com',
        password: 'test123'
      }
    });
  } catch (err) {
    console.error('❌ Error creating test user:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating test user',
      error: err.message
    });
  }
});

// ✅ Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
