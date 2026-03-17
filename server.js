const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

// 1. Load Environment Variables & Connect to MongoDB
dotenv.config();
connectDB();

const app = express();

// 2. Middleware Configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Import Route Files
const userRoutes = require('./routes/userRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const ownerRoutes = require('./routes/ownerRoutes'); 
const tourRoutes = require('./routes/tourRoutes');
const blogRoutes = require('./routes/blogRoutes'); // ✅ Added

// 4. Mount Routes
app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api/owner", ownerRoutes); 
app.use("/api/tours", tourRoutes);
app.use("/api/blog", blogRoutes); // ✅ Mounted at /api/blog

// 5. Static Folders for Images
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/images', express.static(path.join(__dirname, '/public/images')));

// 6. Base Health Check
app.get("/", (req, res) => {
    res.json({ 
        success: true,
        message: "Ride N Roar API is running successfully!",
        systemTime: new Date().toLocaleString(),
        location: "Kathmandu, Nepal"
    });
});

// 7. Global 404 Handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
    if (req.originalUrl.includes('hot-update.json')) {
        return res.status(404).json({ ignored: true });
    }
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`❌ [Backend Error]: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// 9. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log(`🚀 Ride N Roar Server Roaring on Port ${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
    console.log("-----------------------------------------");
});