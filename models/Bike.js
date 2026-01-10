const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["Available", "Booked"], default: "Available" },
  images: [{ type: String }], // multiple images
  description: { type: String },
});

module.exports = mongoose.model("Bike", bikeSchema);
