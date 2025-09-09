// models/pickup.js - Enhanced pickup model with tracking
const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  // Basic pickup information
  name: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name must not exceed 50 characters'],
    validate: [
      {
        validator: function(v) {
          return /^[A-Za-z\s.-]+$/.test(v);
        },
        message: 'Name can only contain letters, spaces, dots, and hyphens'
      },
      {
        validator: function(v) {
          return !/\s{2,}/.test(v) && !/[.-]{2,}/.test(v);
        },
        message: 'Name cannot contain consecutive spaces or special characters'
      }
    ]
  },
  book: { 
    type: String, 
    required: [true, 'Book title is required'],
    trim: true,
    minlength: [2, 'Book title must be at least 2 characters long'],
    maxlength: [1000, 'Book titles list is too long (max 1000 characters)'],
    validate: {
      validator: function(v) {
        // For multiple books, validate each line
        const books = v.split('\n').filter(book => book.trim());
        
        if (books.length > 20) {
          return false;
        }
        
        // Validate each book title
        for (let book of books) {
          const trimmedBook = book.trim();
          if (trimmedBook.length < 2 || trimmedBook.length > 100) {
            return false;
          }
        }
        
        return true;
      },
      message: 'Invalid book titles. Each title must be 2-100 characters, max 20 books allowed.'
    }
  },
  email: { 
    type: String, 
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    maxlength: [254, 'Email address is too long'],
    validate: {
      validator: function(v) {
        // Comprehensive email validation regex
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: [
      {
        validator: function(v) {
          const cleanNumber = v.replace(/[^\d+]/g, '');
          // Multiple international number patterns
          const patterns = [
            /^\+91[6-9]\d{9}$/, // Indian mobile with +91
            /^[6-9]\d{9}$/, // Indian mobile without country code
            /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US mobile
            /^\+44[1-9]\d{8,9}$/, // UK mobile
            /^\+\d{1,3}[1-9]\d{6,14}$/ // International format
          ];
          return patterns.some(pattern => pattern.test(cleanNumber));
        },
        message: 'Please enter a valid mobile number (10-15 digits)'
      }
    ],
    // Clean the mobile number before saving
    set: function(v) {
      return v ? v.replace(/[^\d+]/g, '') : v;
    }
  },
  address: { 
    type: String, 
    required: [true, 'Pickup address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters long'],
    maxlength: [500, 'Address must not exceed 500 characters'],
    validate: {
      validator: function(v) {
        // Check for meaningful content (not just spaces or repeated characters)
        return /[a-zA-Z]{3,}.*[a-zA-Z]{3,}/.test(v);
      },
      message: 'Please provide a complete address with street, area, and city'
    }
  },
  
  // Enhanced pickup details
  pickupType: {
    type: String,
    required: [true, 'Please select a pickup type'],
    enum: {
      values: ['single', 'multiple', 'donation', 'swap'],
      message: 'Please select a valid pickup type'
    }
  },
  preferredDate: {
    type: Date,
    required: [true, 'Pickup date is required'],
    validate: [
      {
        validator: function(v) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return v >= today;
        },
        message: 'Pickup date cannot be in the past'
      },
      {
        validator: function(v) {
          const maxDate = new Date();
          maxDate.setDate(maxDate.getDate() + 30);
          maxDate.setHours(23, 59, 59, 999);
          return v <= maxDate;
        },
        message: 'Pickup date cannot be more than 30 days from today'
      }
    ]
  },
  preferredTime: {
    type: String,
    required: [true, 'Pickup time slot is required'],
    enum: {
      values: ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'],
      message: 'Please select a valid time slot'
    }
  },
  specialInstructions: {
    type: String,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  
  // Tracking and status management
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingId: {
    type: String,
    unique: true,
    default: function() {
      return 'PU' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
  },
  
  // Book and user references
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bookOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tracking timeline
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
    updatedBy: String
  }],
  
  // Communication preferences
  notificationPreferences: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  
  // Pickup verification
  isVerified: { type: Boolean, default: false },
  verificationCode: {
    type: String,
    default: function() {
      return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    }
  },
  verificationCodeExpiry: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
  },
  
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for efficient queries
pickupSchema.index({ trackingId: 1 });
pickupSchema.index({ requesterId: 1, status: 1 });
pickupSchema.index({ bookOwnerId: 1, status: 1 });
pickupSchema.index({ preferredDate: 1, status: 1 });

// Custom validation for pickup type and book title alignment
pickupSchema.path('book').validate(function(bookTitle) {
  if (this.pickupType === 'multiple') {
    const books = bookTitle.split('\n').filter(book => book.trim());
    if (books.length < 2) {
      throw new Error('For multiple book pickup, please enter at least 2 books (one per line)');
    }
  }
  return true;
}, 'Multiple book pickup requires at least 2 books');

// Add status change to history before saving
pickupSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`,
      updatedBy: 'system'
    });
  }
  next();
});

// Instance method to update status
pickupSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = 'system') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes,
    updatedBy
  });
  return this.save();
};

// Instance method to generate new verification code
pickupSchema.methods.generateVerificationCode = function() {
  this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
  return this.save();
};

// Instance method to verify code
pickupSchema.methods.verifyCode = function(code) {
  if (this.verificationCodeExpiry < new Date()) {
    return { success: false, message: 'Verification code has expired' };
  }
  
  if (this.verificationCode === code) {
    this.isVerified = true;
    this.verificationCode = undefined;
    this.verificationCodeExpiry = undefined;
    return { success: true, message: 'Verification successful' };
  }
  
  return { success: false, message: 'Invalid verification code' };
};

module.exports = mongoose.model('Pickup', pickupSchema);
