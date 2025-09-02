const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  
  // Profile enhancements
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  bio: { type: String, maxlength: 300 },
  profilePicture: { type: String }, // Path to profile image
  phone: { type: String },
  
  // User statistics
  totalBooksShared: { type: Number, default: 0 },
  totalBooksDonated: { type: Number, default: 0 },
  totalBooksSwapped: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  
  // Achievement system
  totalPoints: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }], // Array of earned badge names
  
  // User preferences
  favoriteGenres: [{ type: String }],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    pickup: { type: Boolean, default: true },
    messages: { type: Boolean, default: true }
  },
  
  // Account status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  
  // Social features
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ location: 1 }); // Location-based searches
userSchema.index({ totalPoints: -1, level: -1 }); // Leaderboard
userSchema.index({ favoriteGenres: 1 }); // Genre preferences
userSchema.index({ isActive: 1, lastLoginAt: -1 }); // Active users

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Virtual for user level calculation
userSchema.virtual('currentLevel').get(function() {
  return Math.floor(this.totalPoints / 100) + 1; // Level up every 100 points
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
