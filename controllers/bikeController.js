const Bike = require("../models/Bike");
const mongoose = require("mongoose");

// PUBLIC – anyone can see all bikes
exports.getAllBikes = async (req, res) => {
  try {
    const bikes = await Bike.find().populate("owner", "name email");
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUBLIC – get bike by ID
exports.getBikeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bike ID" });
    }

    const bike = await Bike.findById(req.params.id).populate(
      "owner",
      "name email"
    );

    if (!bike) {
      return res.status(404).json({ message: "Bike not found" });
    }

    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OWNER – add bike
exports.addBike = async (req, res) => {
  try {
    const bike = await Bike.create({
      name: req.body.name,
      price: req.body.price,
      brand: req.body.brand,
      available: req.body.available ?? true,
      owner: req.user._id,
    });

    res.status(201).json(bike);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// OWNER – view own bikes
exports.getOwnerBikes = async (req, res) => {
  try {
    const bikes = await Bike.find({ owner: req.user._id });
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OWNER – update bike
exports.updateBike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bike ID" });
    }

    const bike = await Bike.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!bike) {
      return res
        .status(404)
        .json({ message: "Bike not found or not yours" });
    }

    Object.assign(bike, req.body);
    await bike.save();

    res.json(bike);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// OWNER – delete bike
exports.deleteBike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bike ID" });
    }

    const bike = await Bike.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!bike) {
      return res
        .status(404)
        .json({ message: "Bike not found or not yours" });
    }

    await bike.deleteOne();
    res.json({ message: "Bike deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};