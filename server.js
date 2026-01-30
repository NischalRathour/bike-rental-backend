const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

// ✅ STEP 1: Load environment variables FIRST
dotenv.config();

// ✅ STEP 2: DEBUG - Check if Stripe key is loaded (IMPORTANT!)
console.log("\n" + "=".repeat(60));
console.log("🔍 ENVIRONMENT VARIABLES DEBUG");
console.log("=".repeat(60));

// Check all critical environment variables
const envVars = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
};

console.log("\n✅ CHECKING LOADED VARIABLES:");
Object.keys(envVars).forEach(key => {
  const value = envVars[key];
  if (value) {
    if (key === "STRIPE_SECRET_KEY") {
      console.log(`   ${key}: ✓ LOADED (${value.length} chars)`);
      console.log(`      Starts with: ${value.substring(0, 20)}...`);
      console.log(`      Key type: ${value.startsWith("sk_") ? "✓ Secret Key" : "✗ Wrong type!"}`);
    } else if (key === "MONGO_URI") {
      console.log(`   ${key}: ✓ LOADED`);
    } else {
      console.log(`   ${key}: ✓ LOADED (${value.substring(0, 10)}...)`);
    }
  } else {
    if (key === "STRIPE_SECRET_KEY") {
      console.log(`   ${key}: ✗✗✗ MISSING - PAYMENTS WILL FAIL!`);
    } else {
      console.log(`   ${key}: ✗ NOT LOADED`);
    }
  }
});

// CRITICAL: Show error if Stripe key is missing
if (!process.env.STRIPE_SECRET_KEY) {
  console.log("\n🚨 CRITICAL ERROR: STRIPE_SECRET_KEY is not loaded!");
  console.log("   Check: F:\\bike-rental-mern\\backend\\.env");
  console.log("   Make sure the file contains: STRIPE_SECRET_KEY=sk_test_...");
} else if (!process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
  console.log("\n🚨 CRITICAL ERROR: Wrong key type!");
  console.log("   Your key starts with:", process.env.STRIPE_SECRET_KEY.substring(0, 3));
  console.log("   Backend needs: sk_test_... (Secret Key)");
  console.log("   Frontend needs: pk_test_... (Publishable Key)");
} else {
  console.log("\n✅ STRIPE IS PROPERLY CONFIGURED!");
}

console.log("=".repeat(60) + "\n");

const app = express();

// ✅ FIXED: PROPER CORS CONFIGURATION
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());

// Test endpoint for Stripe
app.get("/api/check-stripe", (req, res) => {
  res.json({
    status: "Server is running",
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    keyType: process.env.STRIPE_SECRET_KEY ? 
      (process.env.STRIPE_SECRET_KEY.startsWith("sk_") ? "Secret Key" : 
       process.env.STRIPE_SECRET_KEY.startsWith("pk_") ? "Public Key (WRONG!)" : 
       "Unknown") : 
      "Not loaded",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/bikes", require("./routes/bikeRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// Test payment endpoint (for debugging)
app.post("/api/test-payment", (req, res) => {
  console.log("✅ Test payment endpoint hit!");
  console.log("Request body:", req.body);
  res.json({
    success: true,
    message: "Test endpoint working",
    clientSecret: "test_secret_" + Date.now(),
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Bike Rental API",
    endpoints: {
      users: "/api/users",
      bikes: "/api/bikes",
      bookings: "/api/bookings",
      payments: "/api/payments",
      stripeCheck: "/api/check-stripe",
      testPayment: "POST /api/test-payment"
    },
    stripe: process.env.STRIPE_SECRET_KEY ? "Configured" : "Not configured",
    cors: {
      allowedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
  });
});

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`💳 Test Stripe: http://localhost:${PORT}/api/check-stripe`);
  console.log(`💸 Create Payment: POST http://localhost:${PORT}/api/payments/create-payment-intent`);
  console.log(`🧪 Test Endpoint: POST http://localhost:${PORT}/api/test-payment`);
  console.log(`🔧 CORS Enabled for: http://localhost:3000`);
});