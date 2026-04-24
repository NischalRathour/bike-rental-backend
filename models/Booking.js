const mongoose = require("mongoose");

/**
 * 🏁 RIDE N ROAR DYNAMIC BOOKING MODEL
 * Logic: Handles Solo, Group, and Tour reservations with integrated 
 * financial validation and green-tech telemetry.
 */
const bookingSchema = new mongoose.Schema(
  {
    // 👤 THE CLIENT
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "A user reference is mandatory for the ledger."] 
    },

    // 🗺️ EXPEDITION CONTEXT
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: false // Only required if bookingType is "Tour"
    },

    // 🏍️ THE MACHINES (Supports multiple for Group Orchestration)
    bikes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Bike", 
      required: false 
    }], 

    // 📅 DYNAMIC TIMELINE
    // Required: true ensures calculateDays() in the controller never fails
    startDate: { 
      type: Date, 
      required: [true, "Selection phase requires a start date."] 
    },
    endDate: { 
      type: Date, 
      required: [true, "Selection phase requires an end date."] 
    },

    // 💰 THE LEDGER (Financial Core)
    totalPrice: { 
      type: Number, 
      required: [true, "Total price must be finalized before saving."],
      min: [1, "Financial sync failed: Price cannot be 0 for Stripe intent."]
    },
    
    bookingType: { 
      type: String, 
      enum: ["Solo", "Group", "Tour"],
      default: "Solo" 
    },

    groupSize: { 
      type: String,
      default: "1" 
    },
    
    // 🚦 SYSTEM STATES
    status: { 
      type: String, 
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"], 
      default: "Pending" 
    },
    
    paymentStatus: { 
      type: String, 
      enum: ["Unpaid", "Paid"], 
      default: "Unpaid" 
    },
    
    // 🏦 SETTLEMENT METADATA
    paymentId: { 
      type: String,
      trim: true 
    },
    paymentDate: { 
      type: Date 
    }, 
    
    // 🌿 ECO-TELEMETRY & GAMIFICATION
    co2Saved: { 
      type: Number, 
      default: 0 
    }, 
    rewardPoints: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true // Automatically generates createdAt and updatedAt
  }
);

/**
 * 🛡️ SECURITY HOOK: PRE-SAVE VALIDATION
 * Logic: Blocks any attempt to save a booking with a zero-value price,
 * protecting the Stripe API from 400 Bad Request errors.
 */
bookingSchema.pre("save", function (next) {
  if (this.totalPrice <= 0) {
    console.error(`🚨 SCHEMA_VIOLATION: Attempted to save Booking ID ${this._id} with Rs. 0`);
    return next(new Error("INTERNAL_FINANCE_ERROR: Transactions must have a value > 0"));
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);