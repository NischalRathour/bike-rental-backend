const Razorpay = require("razorpay");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // Your Razorpay key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET // Your Razorpay secret
});

module.exports = instance;
