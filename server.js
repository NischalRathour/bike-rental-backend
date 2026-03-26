require("dotenv").config(); // ✅ 1. Load variables first
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

// ✅ 2. INITIALIZE DATABASE
connectDB().catch(err => {
    console.error("❌ Database Connection Failed. Critical Error.");
    process.exit(1);
});

const app = express();

// ✅ 3. SECURITY & GLOBAL MIDDLEWARE
app.use(helmet({
    crossOriginResourcePolicy: false, // Allows images to be served to the frontend
    contentSecurityPolicy: false      // Allows external fonts/scripts if needed
}));

app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", process.env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Standard body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ 4. ROUTE MOUNTING (CLEAN IMPORTS)
app.use("/api/users", require('./routes/userRoutes'));
app.use("/api/bikes", require('./routes/bikeRoutes'));
app.use("/api/bookings", require('./routes/bookingRoutes'));
app.use("/api/payments", require('./routes/paymentRoutes'));
app.use("/api/admin", require('./routes/adminRoutes')); 
app.use("/api/owner", require('./routes/ownerRoutes')); 
app.use("/api/tours", require('./routes/tourRoutes'));
app.use("/api/blog", require('./routes/blogRoutes'));

// ✅ 5. STATIC ASSETS (Serving images from uploads folder)
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

// ✅ 7. 404 ROUTE NOT FOUND HANDLER
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `The route ${req.originalUrl} does not exist on this server.`
    });
});

// ✅ 8. GLOBAL ERROR INTELLIGENCE (Premium Standard)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Internal Log for Developer
    console.error(`🚨 [SERVER ERROR]: ${err.message}`);

    res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// ✅ 9. START SERVER
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

// ✅ 10. UNHANDLED REJECTION PROTECTION (The "Anti-Crash" Guard)
process.on("unhandledRejection", (err) => {
    console.log(`⚠️  CRITICAL FAILURE: ${err.message}`);
    console.log("Shutting down the server safely...");
    server.close(() => process.exit(1));
});