const Booking = require("../models/Booking");
const dotenv = require("dotenv");

dotenv.config();

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

exports.createPaymentIntent = async (req, res) => {
  const { bookingId } = req.body;

  try {
    if (!stripe) {
      return res.status(500).json({ success: false, message: "Stripe not configured." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // ✅ Safety check for amount
    const amount = Math.round(booking.totalPrice * 100);
    if (isNaN(amount) || amount <= 0) {
       return res.status(400).json({ success: false, message: "Invalid booking amount." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "npr",
      metadata: { bookingId: booking._id.toString(), userId: req.user.id },
      description: `Ride N Roar: ${bookingId.slice(-6)}`
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: booking.totalPrice
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  const { bookingId, paymentId } = req.body;
  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "Paid", status: "Confirmed", paymentId, paymentDate: Date.now() },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Payment confirmed.", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sync Error" });
  }
};