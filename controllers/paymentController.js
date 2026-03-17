const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/create-intent
exports.createPaymentIntent = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Stripe expects amount in Cents (NPR * 100)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalPrice * 100,
      currency: "npr",
      metadata: { bookingId: booking._id.toString() },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm Payment Success
// @route   POST /api/payments/confirm
exports.confirmPayment = async (req, res) => {
  const { bookingId, paymentId } = req.body;

  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: "Paid",
        status: "Confirmed",
        paymentId: paymentId,
        paymentDate: Date.now()
      },
      { new: true }
    );

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking status" });
  }
};