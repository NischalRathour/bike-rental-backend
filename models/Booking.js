const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // ✅ Tour Reference (New)
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: false
    },

    // 🏍️ Bikes (Now optional so Tours can be booked without bikes)
    bikes: [{ 
      type: String, 
      ref: "Bike", 
      required: false 
    }], 

    startDate: { type: Date, required: false }, // Optional for tours as they have fixed dates
    endDate: { type: Date, required: false },
    totalPrice: { type: Number, required: true },
    
    bookingType: { 
      type: String, 
      enum: ["Solo", "Group", "Tour"], // Added "Tour"
      default: "Solo" 
    },

    groupSize: { type: String }, // Added to store tour group info
    
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
    
    paymentId: { type: String },
    
    // 🌿 Eco-Tracking
    co2Saved: { type: Number, default: 0 }, 
    rewardPoints: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);