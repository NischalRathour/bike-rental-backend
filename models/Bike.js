const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
  {
    // Custom String ID (e.g., "b1", "B-9923")
    _id: { type: String, required: true }, 
    
    name: { type: String, required: [true, "Bike name is required"], trim: true },
    brand: { type: String, required: [true, "Brand is required"], trim: true },
    price: { type: Number, required: [true, "Bike price is required"], min: 0 },
    cc: { type: String, default: "150cc" },
    
    type: { 
      type: String, 
      enum: ["Commuter", "Adventure", "Sport", "Cruiser", "Scooter", "Dirt"], 
      default: "Commuter" 
    },
    
    images: { type: [String], default: ["/images/default-bike.jpg"] },
    
    // Linked to the User who owns the bike
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: false // Set to false so Admin/System bikes can exist without a specific owner
    },
    
    available: { type: Boolean, default: true },
    co2SavedPerKm: { type: Number, default: 0.15 },
    
    // Optional: Added for better Customer UI
    description: { type: String, trim: true, default: "Premium rental bike in Kathmandu." }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bike", bikeSchema);