const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

// 1. Initialize
dotenv.config();
connectDB();

const app = express();

// 2. Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Route Imports (Ensure these files use module.exports = router)
const userRoutes = require('./routes/userRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const ownerRoutes = require('./routes/ownerRoutes'); 
const tourRoutes = require('./routes/tourRoutes');
const blogRoutes = require('./routes/blogRoutes');

// 4. Route Mounting
app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api/owner", ownerRoutes); 
app.use("/api/tours", tourRoutes);
app.use("/api/blog", blogRoutes);

// 5. Static Folders
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/images', express.static(path.join(__dirname, '/public/images')));

// 6. Base Health Check
app.get("/", (req, res) => {
    res.json({ 
        success: true,
        message: "Ride N Roar API is running successfully!",
        systemTime: new Date().toLocaleString()
    });
});

// 7. Error Handling
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// 8. Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server Roaring on Port ${PORT}`);
});