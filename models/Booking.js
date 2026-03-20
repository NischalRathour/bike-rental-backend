const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bike: { type: String, required: true }, // Supporting "b1", "b2" or ObjectId
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    days: { type: Number, default: 1 },
    status: { type: String, enum: ["Pending", "Confirmed", "Cancelled", "Completed"], default: "Pending" },
    paymentStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    paymentId: { type: String },
    // 🌿 NEW ECO-TRACKING FIELDS
    co2Saved: { type: Number, default: 0 }, 
    rewardPoints: { type: Number, default: 0 }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

bookingSchema.virtual('durationDays').get(function() {
  const diff = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model("Booking", bookingSchema);