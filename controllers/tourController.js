const Tour = require('../models/Tour');

// Get all tours from database
exports.getTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.status(200).json({ success: true, tours });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tours: " + error.message });
  }
};

// Create a new tour (For you to add data)
exports.createTour = async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json({ success: true, tour });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};