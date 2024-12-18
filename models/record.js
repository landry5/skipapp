const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  name: String,
  description: String,
  level: String,
  location: String,
  images: [String], // Store the image URLs
});

const Record = mongoose.model('Record', recordSchema);
