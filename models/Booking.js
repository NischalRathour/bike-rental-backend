const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // 🏍️ FIXED: Changed from ObjectId to String to match your Bike _id format
    // This allows the "Cast to ObjectId" error to disappear
    bikes: [{ 
      type: String, 
      ref: "Bike", 
      required: true 
    }], 

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    
    bookingType: { 
      type: String, 
      enum: ["Solo", "Group"], 
      default: "Solo" 
    },
    
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
    
    // 🌿 BUSINESS LOGIC: Eco-Tracking
    co2Saved: { type: Number, default: 0 }, 
    rewardPoints: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);