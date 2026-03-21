const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");

exports.createPaymentIntent = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate('bikes');
    if (!booking) return res.status(404).json({ success: false, message: "Booking session expired." });

    // Stripe requires amount in Cents (NPR * 100)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: "npr",
      metadata: { bookingId: booking._id.toString(), user: req.user.id },
      description: `Ride N Roar Expedition: ${bookingId}`
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
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sync Error" });
  }
};