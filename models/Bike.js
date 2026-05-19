const mongoose = require("mongoose");

/**
 * 🏍️ RIDE N ROAR BIKE MODEL (ENTERPRISE EDITION)
 * Core Logic: Every bike must be securely tethered to a verified multi-vendor Owner.
 * Synchronized with high-fidelity frontend showcase filters and search components.
 */
const bikeSchema = new mongoose.Schema(
  {
    // Custom String ID primary key override (e.g., "b1", "B-9923")
    _id: { 
      type: String, 
      required: [true, "Unique Fleet Machine ID string is mandatory"] 
    }, 
    
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
     * Explicitly mapped as a Number to optimize search filter sliders and logic blocks.
     */
    cc: { 
      type: Number, 
      required: [true, "Engine CC is required for technical specs"],
      default: 150 
    },
    
    /**
     * 🏷️ CATEGORY CLASSIFICATION
     * Aligned directly with the frontend filter navigation pills.
     */
    type: { 
      type: String, 
      enum: ["Commuter", "Adventure", "Sport", "Cruiser", "Scooter", "Dirt"], 
      default: "Commuter" 
    },

    /**
     * 🚀 PREMIUM FEATURES (The Showroom Upgrade)
     * Array of tracking tokens storing specific bike configurations (e.g., "ABS", "Dual-Channel", "LED").
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
     * 🛡️ OWNER LINKAGE (The Dynamic multi-vendor Multi-Owner Anchor)
     * Maps the specific asset to an individual, authenticated vendor record inside the User Collection.
     * Prevents cross-contamination where Owner A might manipulate Owner B's assets.
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
     * Synchronized with "Fleet Command" to track real-time machine availability.
     */
    status: {
      type: String,
      enum: ["Ready", "Rented", "Maintenance"],
      default: "Ready"
    },

    co2SavedPerKm: { 
      type: Number, 
      default: 0.15 // Standard baseline offset multiplier metric vs fuel vehicles
    },
    
    description: { 
      type: String, 
      trim: true, 
      default: "Premium rental bike in Kathmandu hub." 
    }
  },
  { 
    timestamps: true,
    // Triggers execution pipelines to serialize virtual tracking calculations automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * 🔍 HIGH-PERFORMANCE SEARCH CARDS INDEXING
 * Optimized execution engine matching search parameters inside Bikes.jsx storefront text search bar.
 */
bikeSchema.index({ name: 'text', brand: 'text' });

/**
 * 🟢 GREEN IT MATHEMATICAL TELEMETRY VIRTUAL
 * Computes an estimate of carbon savings over an arbitrary 100km standard benchmark trip.
 * This runs on the database layer and instantly streams to your UI without manual collection writes.
 */
bikeSchema.virtual("estimatedTripCarbonSavings").get(function () {
  // co2SavedPerKm (0.15) * 100km baseline trip = 15kg saved average
  return Number((this.co2SavedPerKm * 100).toFixed(2));
});

module.exports = mongoose.model("Bike", bikeSchema);