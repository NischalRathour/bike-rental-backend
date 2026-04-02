const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  difficulty: { type: String, required: true },
  nextDate: { type: String, required: true },
  location: { type: String, default: "Nepal" },
  description: { type: String, required: true },
  image: { type: String, required: true }, 
  rating: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);