const express = require("express");
const router = express.Router();
const { 
    createPaymentIntent, 
    confirmPayment 
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

// Route to initialize the Stripe Payment (gets the Client Secret)
router.post("/create-intent", protect, createPaymentIntent);

// Route to update the database after Stripe confirms the card is charged
router.post("/confirm", protect, confirmPayment);

module.exports = router;