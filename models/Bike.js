const mongoose = require("mongoose");

/**
 * 🏍️ RIDE N ROAR BIKE MODEL
 * Logic: Every bike must be linked to a verified Owner.
 * This ensures the showroom only displays authentic, manageable machines.
 */
const bikeSchema = new mongoose.Schema(
  {
    // Custom String ID (e.g., "b1", "B-9923")
    _id: { type: String, required: true }, 
    
    name: { 
      type: String, 
      required: [true, "Bike name is required"], 
      trim: true 
    },
    brand: { 
      type: String, 
      required: [true, "Brand is required"], 
      trim: true 
    },
    price: { 
      type: Number, 
      required: [true, "Bike price is required"], 
      min: 0 
    },
    cc: { 
      type: String, 
      default: "150cc" 
    },
    
    type: { 
      type: String, 
      enum: ["Commuter", "Adventure", "Sport", "Cruiser", "Scooter", "Dirt"], 
      default: "Commuter" 
    },
    
    images: { 
      type: [String], 
      default: ["/images/default-bike.jpg"] 
    },
    
    /**
     * 🛡️ OWNER LINKAGE (The Anchor)
     * Changed to required: true to prevent "Ownerless" bikes from appearing.
     * This links the bike to the User ID of the 'Owner' actor.
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
  { timestamps: true }
);

module.exports = mongoose.model("Bike", bikeSchema);