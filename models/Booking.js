const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bike: {
      type: String, // ✅ Changed from ObjectId to String to support "b1", "b2"
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
    days: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    paymentId: { type: String },
    paymentDate: { type: Date },
    paymentAmount: { type: Number }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Calculate duration in days
bookingSchema.virtual('durationDays').get(function() {
  const diff = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model("Booking", bookingSchema);