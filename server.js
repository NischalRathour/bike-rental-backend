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
    // ✅ FIXED: Added 'PATCH' to the allowed methods list
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

// 4. Mount Routes
app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ Mount consolidated Admin routes
app.use("/api/admin", adminRoutes); 

// ✅ Mount Owner routes
app.use("/api/owner", ownerRoutes); 

// 5. Static Folder for Images
// Ensure the 'uploads' folder actually exists in your root directory
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

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
    res.status(404).json({ success: false, message: "Requested Endpoint Not Found" });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`[Error Log]: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        message: err.message,
        // Stack trace only shown in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// 9. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server Roaring on port ${PORT}`);
    console.log(`📡 Local Access: http://localhost:${PORT}`);
});