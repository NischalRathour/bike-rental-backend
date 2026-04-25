const mongoose = require("mongoose");

/**
 * 🏁 RIDE N ROAR - ENTERPRISE BOOKING MODEL
 * Logic: Synchronized for Custom String IDs and Atomic Financial Ledger.
 */
const bookingSchema = new mongoose.Schema(
  {
    // 👤 THE CLIENT
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User reference is mandatory."] 
    },

    // 🗺️ EXPEDITION CONTEXT
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: false 
    },

    /**
     * 🏍️ THE MACHINES
     * 🚨 SYNC FIX: Changed from ObjectId to String to accept custom IDs.
     */
    bikes: [{ 
      type: String, 
      ref: "Bike", 
      required: [true, "At least one machine is required."] 
    }], 

    // 📅 EXPEDITION TIMELINE
    startDate: { 
      type: Date, 
      required: [true, "Start date required."] 
    },
    endDate: { 
      type: Date, 
      required: [true, "End date required."] 
    },

    // 💰 FINANCIAL LEDGER
    totalPrice: { 
      type: Number, 
      required: [true, "Total price is mandatory."],
      min: [1, "Price must be greater than 0."]
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
    
    // 🏦 STRIPE METADATA
    paymentId: { type: String, trim: true },
    paymentDate: { type: Date }, 
    
    // 🌿 ECO-TELEMETRY
    co2Saved: { type: Number, default: 0 }, 
    rewardPoints: { type: Number, default: 0 }
  },
  { timestamps: true }
);

/**
 * 🛡️ SECURITY HOOK: FINANCIAL INTEGRITY
 * Prevents saving bookings with invalid amounts.
 */
bookingSchema.pre("save", function (next) {
  if (this.totalPrice <= 0) {
    return next(new Error("INTERNAL_FINANCE_ERROR: Price cannot be 0"));
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);