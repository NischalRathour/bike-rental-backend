const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");

// ✅ GET: Retrieve comments for a specific blog
router.get("/:blogId/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.blogId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ POST: Create a new comment
router.post("/:blogId/comments", async (req, res) => {
  try {
    const { userName, text } = req.body;
    if (!userName || !text) {
      return res.status(400).json({ success: false, message: "Name and comment are required" });
    }

    const newComment = await Comment.create({
      blogId: req.params.blogId,
      userName,
      text
    });
    res.status(201).json(newComment);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;