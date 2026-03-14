const Bike = require("../models/Bike");
const mongoose = require("mongoose");

/** 🌍 PUBLIC: View all bikes */
exports.getAllBikes = async (req, res) => {
  try {
    const bikes = await Bike.find().populate("owner", "name email");
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 🔍 PUBLIC: View single bike by ID */
exports.getBikeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Vehicle Reference Format" });
    }
    const bike = await Bike.findById(id).populate("owner", "name email");
    if (!bike) {
      return res.status(404).json({ message: "Vehicle not found in Kathmandu database" });
    }
    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/** 🏗️ OWNER/ADMIN: Add bike */
exports.addBike = async (req, res) => {
  try {
    const bike = await Bike.create({
      ...req.body,
      owner: req.user._id,
    });
    res.status(201).json(bike);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/** 📋 OWNER/ADMIN: Get their own inventory */
exports.getOwnerBikes = async (req, res) => {
  try {
    // If Admin, they see everything; if Owner, they see their own
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const bikes = await Bike.find(query);
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 📝 OWNER/ADMIN: Update bike */
exports.updateBike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const bike = await Bike.findById(id);
    if (!bike) return res.status(404).json({ message: "Bike not found" });

    // Security check: Only owner or admin can update
    if (bike.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this unit" });
    }

    const updatedBike = await Bike.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedBike);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/** 🗑️ OWNER/ADMIN: Delete bike */
exports.deleteBike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const bike = await Bike.findById(id);
    if (!bike) return res.status(404).json({ message: "Bike not found" });

    if (bike.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to decommission this unit" });
    }

    await Bike.findByIdAndDelete(id);
    res.json({ message: "Bike deleted successfully from Kathmandu fleet" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};