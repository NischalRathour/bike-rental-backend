const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

// 1. INITIALIZE ENGINE
dotenv.config();

// Connect to Database with a safety check
connectDB().catch(err => {
    console.error("❌ Database Connection Failed. Critical Error.");
    process.exit(1);
});

const app = express();

// 2. SECURITY & MIDDLEWARE
// Helmet secures your Express app by setting various HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: false, // Required to allow images to be served to the frontend
    contentSecurityPolicy: false      // Required if you use external CDNs for styles/scripts
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Standard body parsers with increased limits for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. ROUTE IMPORTS
const userRoutes = require('./routes/userRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const ownerRoutes = require('./routes/ownerRoutes'); 
const tourRoutes = require('./routes/tourRoutes');
const blogRoutes = require('./routes/blogRoutes');

// 4. ROUTE MOUNTING
app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api/owner", ownerRoutes); 
app.use("/api/tours", tourRoutes);
app.use("/api/blog", blogRoutes);

// 5. STATIC ASSETS
// Serving images and uploads with absolute paths for reliability
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// 6. SYSTEM HEALTH CHECK
app.get("/", (req, res) => {
    res.json({ 
        success: true,
        status: "Live",
        service: "Ride N Roar Marketplace API",
        systemTime: new Date().toLocaleString()
    });
});

// 7. 404 HANDLING
app.use((req, res, next) => {
    const error = new Error(`Route Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// 8. GLOBAL ERROR INTELLIGENCE (Premium Standard)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log error internally for debugging
    console.error(`🚨 [SERVER ERROR]: ${err.message}`);

    res.status(statusCode).json({
      success: false,
      message: err.message,
      // Stack trace hidden in production for security
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// 9. START SERVER
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    🏁 RIDE N ROAR MARKETPLACE IS ONLINE
    📡 LISTENING ON PORT: ${PORT}
    🛠️  MODE: ${process.env.NODE_ENV || 'development'}
    -------------------------------------------
    `);
});

// 10. UNHANDLED REJECTION PROTECTION (The "Anti-Crash" Guard)
process.on("unhandledRejection", (err) => {
    console.log(`⚠️  CRITICAL ERROR: Unhandled Rejection. Shutting down...`);
    console.log(err.name, err.message);
    server.close(() => process.exit(1));
});