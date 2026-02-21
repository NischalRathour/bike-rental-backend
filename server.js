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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
const ownerRoutes = require('./routes/ownerRoutes'); // ✅ Added Owner Routes

// 4. Mount Routes
app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ Mount consolidated Admin routes under one namespace
app.use("/api/admin", adminRoutes); 

// ✅ Mount Owner routes under the /api/owner namespace
app.use("/api/owner", ownerRoutes); 

// 5. Static Folder for Images
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// 6. Base Health Check
app.get("/", (req, res) => {
    res.json({ message: "Ride N Roar API is running successfully!" });
});

// 7. Global 404 & Error Handlers
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message,
    });
});

// 8. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server Roaring on port ${PORT}`);
});