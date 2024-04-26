const mongoose = require("mongoose");
const Course = require("./course");
const User = require("./user");

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [
    {
      question: String,
      answers: [String],
      correctAnswerIndex: Number, // Index of the correct answer in the answers array
    },
  ],
  grades: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      score: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  duration: {
    type: Date,
    default: function () {
      // Calculate the end time based on the start time and duration
      return new Date(this.createdAt.getTime() + this.duration * 60000); // Multiply by 60000 to convert minutes to milliseconds
    },
  },
  courseId: [{ type: String, ref: "Course", required: true }],
});

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
