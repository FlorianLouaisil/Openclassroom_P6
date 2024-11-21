const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  author: { type: String, required: true },
  date: { type: Date, required: true },
  theme: { type: String, required: true },
  userId: { type: String, required: true }
});

// Export the model
module.exports = mongoose.model('Book', bookSchema);