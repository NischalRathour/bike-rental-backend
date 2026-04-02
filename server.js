require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// ✅ 1. DATABASE INITIALIZATION
connectDB().catch(err => {
    console.error("❌ Database Connection Failed.");
    process.exit(1);
});

const app = express();

// ✅ 2. API RATE LIMITER
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, // Increased for development/testing
    message: { success: false, message: "Too many requests, please try again later." }
});

// ✅ 3. GLOBAL MIDDLEWARE
app.use(helmet({
    crossOriginResourcePolicy: false, 
    contentSecurityPolicy: false      
}));

// 🛡️ CORS CONFIGURATION (Fixes net::ERR_FAILED)
app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan("dev")); 
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Rate Limiter
app.use("/api/", limiter);

// ✅ 4. ROUTE MOUNTING
app.use("/api/users", require('./routes/userRoutes'));
app.use("/api/bikes", require('./routes/bikeRoutes'));
app.use("/api/bookings", require('./routes/bookingRoutes'));
app.use("/api/payments", require('./routes/paymentRoutes'));
app.use("/api/admin", require('./routes/adminRoutes')); 
app.use("/api/owner", require('./routes/ownerRoutes')); 
app.use("/api/tours", require('./routes/tourRoutes'));
app.use("/api/blog", require('./routes/blogRoutes'));

// 🚀 ADDED THIS LINE TO FIX YOUR 404 ERROR
app.use("/api/contact", require('./routes/contactRoutes'));

// ✅ 5. STATIC ASSETS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ✅ 6. SYSTEM HEALTH CHECK
app.get("/", (req, res) => {
    res.json({ 
        success: true, 
        status: "Live", 
        service: "Ride N Roar Marketplace API",
        time: new Date().toLocaleTimeString()
    });
});

// ✅ 7. GLOBAL ERROR HANDLING
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`🚨 [SERVER ERROR]: ${err.message}`);
    res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// ✅ 8. START SERVER
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    🏁 RIDE N ROAR BACKEND IS ONLINE
    📡 LISTENING ON PORT: ${PORT}
    🛠️  ENVIRONMENT: ${process.env.NODE_ENV || 'development'}
    -------------------------------------------
    `);
});

process.on("unhandledRejection", (err) => {
    console.log(`⚠️ CRITICAL FAILURE: ${err.message}`);
    server.close(() => process.exit(1));
});