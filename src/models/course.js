const mongoose = require("mongoose");
// const Teacher = require("./teacher");
// const Student = require("./student");
const User = require("./user");

const courseSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    trim: true,
    minlength: 4,
    maxlength: 4,
  },
  name: { type: String, required: true },
  path: { type: String, required: true, trim: true },

  // courseId: {
  //   type: String,
  //   required: true,
  //   trim: true,
  //   unique: true,
  //   minlength: 4,
  //   maxlength: 4,
  // },

  // Reference to teachers
  teacherId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      role: "teacher",
    },
  ],

  // Reference to students
  // studentsId: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: User,
  //     role: "student",
  //   },
  // ],

  videos: [{ data: Buffer, filename: String }],
  files: [{ data: Buffer, filename: String }],
  assignments: [
    {
      data: Buffer,
      filename: String,
      uploadtime: Date,
      deadline: Date,
      submitted: {
        type: String,
        enum: ["Submitted", "Not Submitted"],
        default: "Submitted",
      },
      solutions: [
        {
          studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            role: "student",
          },
          data: Buffer,
          filename: String,
          uploadtime: Date,
          deadline: Date,
          submitted: {
            type: String,
            enum: ["Submitted", "Not Submitted"],
            default: "Submitted",
          },
        },
      ],
    },
  ],
  projects: [
    {
      data: Buffer,
      filename: String,
      uploadtime: Date,
      deadline: Date,
      submitted: {
        type: String,
        enum: ["Submitted", "Not Submitted"],
        default: "Submitted",
      },
      solutions: [
        {
          studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            role: "student",
          },
          data: Buffer,
          filename: String,
          uploadtime: Date,
          deadline: Date,
          submitted: {
            type: String,
            enum: ["Submitted", "Not Submitted"],
            default: "Submitted",
          },
        },
      ],
    },
  ],
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
