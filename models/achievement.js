// models/achievement.js
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  badge: { 
    type: String, 
    required: true,
    enum: [
      'first-book', 'bookworm', 'generous-donor', 'active-swapper',
      'reviewer', 'community-helper', 'book-collector', 'veteran'
    ]
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    required: true 
  },
  points: { 
    type: Number, 
    default: 10 
  },
  unlockedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Ensure one achievement per badge per user
achievementSchema.index({ userId: 1, badge: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
