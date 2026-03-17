const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  blogId: { type: String, required: true }, // Links to the specific post
  userName: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);