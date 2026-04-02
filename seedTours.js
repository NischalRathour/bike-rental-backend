const mongoose = require('mongoose');
const Tour = require('./models/Tour');
const dotenv = require('dotenv');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const tours = [
  {
    name: "Upper Mustang Expedition",
    price: 45000,
    duration: "12 Days",
    difficulty: "Challenging",
    nextDate: "April 15, 2026",
    description: "Experience the forbidden kingdom of Mustang on two wheels. High-altitude desert landscapes and ancient monasteries.",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc",
    location: "Mustang, Nepal"
  },
  {
    name: "Manang Loop Adventure",
    price: 32000,
    duration: "8 Days",
    difficulty: "Moderate",
    nextDate: "May 10, 2026",
    description: "The Marsyangdi valley and high mountain lakes. Perfect for intermediate riders.",
    image: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f",
    location: "Manang, Nepal"
  }
];

const seedDB = async () => {
  await Tour.deleteMany({});
  await Tour.insertMany(tours);
  console.log("Database Seeded with Tours!");
  process.exit();
};

seedDB();