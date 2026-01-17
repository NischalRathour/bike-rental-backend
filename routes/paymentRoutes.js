const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Booking = require("../models/Booking");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-payment-intent", async (req, res) => {
  const { bookingId, amount } = req.body;

  try {
    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in paisa
      currency: "npr",
      automatic_payment_methods: { enabled: true },
    });

    // Update Booking: mark as pending payment
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: "pending",
      stripePaymentId: paymentIntent.id,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
