const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Bike name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Bike price is required"],
      min: [0, "Price cannot be negative"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    // 🌿 Eco-Tracking Field
    co2SavedPerKm: {
      type: Number,
      default: 0.15, // Default: 0.15kg saved per km compared to cars
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bike", bikeSchema);