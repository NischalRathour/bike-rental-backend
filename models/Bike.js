const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Bike name is required"],
      trim: true,
    },
    // ✅ Added to match Frontend fleet.js
    _id: {
      type: String, // Allow "b1", "b2" for demo OR ObjectId for production
      required: true
    },
    price: {
      type: Number,
      required: [true, "Bike price is required"],
      min: [0, "Price cannot be negative"],
    },
    type: {
      type: String,
      enum: ["Commuter", "Adventure", "Sport", "Cruiser", "Scooter", "Dirt"],
      default: "Commuter"
    },
    cc: {
      type: String,
      default: "150cc"
    },
    images: {
      type: [String],
      default: ["/images/default-bike.jpg"]
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Set to false so "System" bikes don't need an owner ID
    },
    brand: {
      type: String,
      trim: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    co2SavedPerKm: {
      type: Number,
      default: 0.15,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bike", bikeSchema);