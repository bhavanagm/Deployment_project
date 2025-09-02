const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
  condition: String,
  type: String,
  location: String,
  contact: String,
  image: String,
  status: { type: String, default: 'available' }, // or swapped/donated
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Rating system fields
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  
  // Additional metadata
  isbn: { type: String }, // ISBN number if available
  publishYear: { type: Number },
  language: { type: String, default: 'English' },
  pages: { type: Number },
  description: { type: String, maxlength: 1000 },
  
  // Availability tracking
  isAvailable: { type: Boolean, default: true },
  availableUntil: { type: Date }, // Optional expiry date
  
  // Featured/promoted books
  isFeatured: { type: Boolean, default: false },
  featuredUntil: { type: Date }
}, { timestamps: true });

// Indexes for better performance
bookSchema.index({ title: 'text', author: 'text', genre: 'text' }); // Text search
bookSchema.index({ genre: 1, averageRating: -1 }); // Filter by genre, sort by rating
bookSchema.index({ userId: 1, status: 1 }); // User's books
bookSchema.index({ createdAt: -1 }); // Recently added
bookSchema.index({ isFeatured: 1, featuredUntil: 1 }); // Featured books

module.exports = mongoose.model('Book', bookSchema);
