const mongoose = require("mongoose");
const Teacher = require("./teacher");
const Student = require("./student");

const courseSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    trim: true,
    minlength: 4,
    maxlength: 4,
  },
  name: { type: String, required: true },

  // courseId: {
  //   type: String,
  //   required: true,
  //   trim: true,
  //   unique: true,
  //   minlength: 4,
  //   maxlength: 4,
  // },

  teacherId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Teacher,
    },
  ],

  videos: [{ data: Buffer, filename: String }],
  files: [{ data: Buffer, filename: String }],
  assignments: [{ data: Buffer, filename: String }],
  projects: [{ data: Buffer, filename: String }],
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
