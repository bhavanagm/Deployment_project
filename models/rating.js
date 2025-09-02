// models/rating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  bookId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  review: { 
    type: String, 
    maxlength: 500 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Ensure one rating per user per book
ratingSchema.index({ bookId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
