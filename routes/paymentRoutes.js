const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Debug endpoint
router.get("/debug", (req, res) => {
  res.json({
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY ? 
        process.env.STRIPE_SECRET_KEY.substring(0, 20) + "..." : 
        "Not loaded"
    },
    cors: {
      origin: req.headers.origin,
      method: req.method,
      headers: req.headers
    }
  });
});

// Create payment intent
router.post("/create-payment-intent", async (req, res) => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("💰 PAYMENT REQUEST RECEIVED");
    console.log("=".repeat(50));
    
    console.log("Headers:", req.headers);
    console.log("Origin:", req.headers.origin);
    console.log("Body:", req.body);

    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: "Invalid amount",
        message: "Amount must be greater than 0" 
      });
    }

    console.log(`Creating payment intent for ₹${amount}`);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paisa
      currency: "inr",
      payment_method_types: ["card"],
      description: `Bike Rental - ₹${amount}`,
    });

    console.log("✅ Payment intent created:", paymentIntent.id);
    console.log("Client secret generated");
    console.log("=".repeat(50) + "\n");

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount
    });

  } catch (error) {
    console.error("\n❌ STRIPE ERROR DETAILS:");
    console.error("Message:", error.message);
    console.error("Type:", error.type);
    console.error("Code:", error.code);
    
    // Send appropriate error response
    let statusCode = 500;
    let errorMessage = "Payment processing failed";
    
    if (error.type === 'StripeInvalidRequestError') {
      statusCode = 400;
      errorMessage = "Invalid request to payment processor";
    } else if (error.code === 'resource_missing') {
      statusCode = 400;
      errorMessage = "Payment resource not found";
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

module.exports = router;