const Booking = require("../models/Booking");
const User = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    PHASE 1: AUTHORIZATION & CRYPTOGRAPHIC HANDSHAKE
 * @route   POST /api/payments/create-intent
 * @logic   Validates dynamic pricing and checks virtual wallet liquidity.
 */
exports.createPaymentIntent = async (req, res) => {
  const { bookingId } = req.body;

  try {
    // 1. Fetch the booking context and the user's current ledger
    const booking = await Booking.findById(bookingId).populate('user');
    const user = await User.findById(req.user.id);

    if (!booking || !user) {
      return res.status(404).json({ 
        success: false, 
        message: "Transaction context missing. Re-initiate from showroom." 
      });
    }

    // 🚨 DYNAMIC PRICE VALIDATION & SAFETY GUARD
    // Prevents Stripe 400 errors and ensures financial integrity
    if (!booking.totalPrice || booking.totalPrice <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid Amount: Price must be > 0. Check your booking telemetry." 
      });
    }

    // 💰 PREMIUM BANKING LOGIC: Base + 2% Dynamic Service Fee
    const serviceFee = Math.round(booking.totalPrice * 0.02);
    const totalDeduction = booking.totalPrice + serviceFee;

    // 🏦 WALLET AUTHENTICATION: Check for sufficient virtual funds
    if (user.balance < totalDeduction) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient Funds. Wallet: Rs. ${user.balance.toLocaleString()}, Required: Rs. ${totalDeduction.toLocaleString()}` 
      });
    }

    // 2. Prepare Stripe Intent with robust Metadata for your Dashboard
    const amountInCents = Math.round(totalDeduction * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd", // Standard for Stripe test keys
      metadata: { 
        bookingId: booking._id.toString(),
        userId: user._id.toString(),
        basePrice: booking.totalPrice.toString(),
        visaFee: serviceFee.toString()
      },
      receipt_email: user.email,
      description: `Ride N Roar Digital Settlement: ${booking.bookingType}`,
    });

    // 3. Return Telemetry to Frontend for the Visa Card UI
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      baseAmount: booking.totalPrice,
      serviceFee: serviceFee,
      totalAmount: totalDeduction,
      currentBalance: user.balance
    });

  } catch (error) {
    console.error("🚨 GATEWAY_INTENT_ERROR:", error.message);
    res.status(500).json({ success: false, message: "Stripe handshake failed." });
  }
};

/**
 * @desc    PHASE 2: WALLET SETTLEMENT & LEDGER RECONCILIATION
 * @route   POST /api/payments/confirm
 * @logic   Atomic deduction from wallet and status flip to 'Paid'.
 */
exports.confirmPayment = async (req, res) => {
  const { bookingId, paymentId } = req.body;

  try {
    // 4. Secure Price Re-calculation: Guards against frontend DOM manipulation
    const bookingCheck = await Booking.findById(bookingId);
    if (!bookingCheck) return res.status(404).json({ success: false, message: "Booking sync lost." });

    const serviceFee = Math.round(bookingCheck.totalPrice * 0.02);
    const totalDeduction = bookingCheck.totalPrice + serviceFee;

    // 🏦 5. ATOMIC UPDATE: Deduct funds and finalize booking in one operation
    // Using $inc with a negative value prevents "race conditions"
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balance: -totalDeduction } }, 
      { new: true }
    );

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        $set: {
          paymentStatus: "Paid", 
          status: "Confirmed", 
          paymentId: paymentId,
          paymentDate: Date.now() 
        }
      },
      { new: true, runValidators: true }
    ).populate('bikes user tour'); 

    // System Log for the Hub Administrator
    console.log(`-------------------------------------------`);
    console.log(`📡 BANKING SYNC: SETTLEMENT_SUCCESS`);
    console.log(`👤 CLIENT: ${updatedUser.name}`);
    console.log(`💸 DEDUCTED: Rs. ${totalDeduction}`);
    console.log(`💰 NEW_LEDGER_BALANCE: Rs. ${updatedUser.balance}`);
    console.log(`-------------------------------------------`);

    res.status(200).json({ 
      success: true, 
      message: "Transaction Settled. Ledger Updated Successfully.", 
      booking: updatedBooking,
      newBalance: updatedUser.balance
    });

  } catch (error) {
    console.error("🚨 CRITICAL_SETTLEMENT_FAILURE:", error.message);
    res.status(500).json({ success: false, message: "Internal Financial Protocol Error" });
  }
};