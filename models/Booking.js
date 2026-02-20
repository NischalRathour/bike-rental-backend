const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bike",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      // ✅ Capitalized to match our new Controller logic
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    // ✅ Added these fields so they actually save to the database
    paymentId: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    paymentAmount: {
      type: Number,
    }
  },
  { 
    timestamps: true,
    // This ensures that when we convert to JSON, virtuals are included
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Optional: Virtual field to calculate duration in days
bookingSchema.virtual('durationDays').get(function() {
  const diff = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model("Booking", bookingSchema);