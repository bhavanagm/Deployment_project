// models/pickup.js
const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  book: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pickup', pickupSchema);
