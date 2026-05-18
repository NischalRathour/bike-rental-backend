const mongoose = require("mongoose");

/**
 * 🏍️ RIDE N ROAR BIKE MODEL (ENTERPRISE EDITION)
 * Logic: Every bike must be linked to a verified Owner.
 * Synchronized with the high-fidelity showroom UI.
 */
const bikeSchema = new mongoose.Schema(
  {
    // Custom String ID (e.g., "b1", "B-9923")
    _id: { type: String, required: true }, 
    
    name: { 
      type: String, 
      required: [true, "Bike name is mandatory"], 
      trim: true 
    },
    brand: { 
      type: String, 
      required: [true, "Brand is mandatory"], 
      trim: true 
    },
    price: { 
      type: Number, 
      required: [true, "Daily rental price is mandatory"], 
      min: [0, "Price cannot be negative"] 
    },
    
    /**
     * ⚙️ ENGINE CAPACITY
     * Changed to Number for better filtering and comparison logic.
     */
    cc: { 
      type: Number, 
      required: [true, "Engine CC is required for technical specs"],
      default: 150 
    },
    
    /**
     * 🏷️ CATEGORY CLASSIFICATION
     * Aligned with the frontend filter pills.
     */
    type: { 
      type: String, 
      enum: ["Commuter", "Adventure", "Sport", "Cruiser", "Scooter", "Dirt"], 
      default: "Commuter" 
    },

    /**
     * 🚀 PREMIUM FEATURES (The Showroom Upgrade)
     * Array of strings to store specific bike attributes like "ABS", "LED", etc.
     */
    features: {
      type: [String],
      default: []
    },
    
    images: { 
      type: [String], 
      default: ["/images/default-bike.jpg"] 
    },
    
    /**
     * 🛡️ OWNER LINKAGE (The Anchor)
     * Links the machine to the verified 'Owner' account.
     */
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "Every bike must be associated with a verified Owner."] 
    },
    
    available: { 
      type: Boolean, 
      default: true 
    },

    /**
     * 🚦 STATUS TELEMETRY
     * Aligned with "Fleet Command" to track active rentals.
     */
    status: {
      type: String,
      enum: ["Ready", "Rented", "Maintenance"],
      default: "Ready"
    },

    co2SavedPerKm: { 
      type: Number, 
      default: 0.15 
    },
    
    description: { 
      type: String, 
      trim: true, 
      default: "Premium rental bike in Kathmandu hub." 
    }
  },
  { 
    timestamps: true,
    // Ensures virtuals are included when converting to JSON (useful for calculations)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * 🔍 INDEXING
 * Optimized for the search bar logic in Bikes.jsx
 */
bikeSchema.index({ name: 'text', brand: 'text' });

module.exports = mongoose.model("Bike", bikeSchema);