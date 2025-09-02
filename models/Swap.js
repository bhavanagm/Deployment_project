const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  swappedWith: String, // or user reference
  date: Date
});

module.exports = mongoose.model('Swap', swapSchema);
