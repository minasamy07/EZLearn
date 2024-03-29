const mongoose = require("mongoose");
const Teacher = require("./teacher");
const Student = require("./student");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Teacher,
    },
  ],

  Student: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Student,
    },
  ],
});

const Course = mongoose.model("Course", courseSchema);

model.exports = Course;
