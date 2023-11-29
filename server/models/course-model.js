const mongoose = require("mongoose");

//講師新增課程
const courseSchema = new mongoose.Schema({
  id: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  students: { type: [String], default: [] },
});

const Course = mongoose.model("Course ", courseSchema);
module.exports = Course;
