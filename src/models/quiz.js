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
  startTime: { type: Date }, // Quiz start time
  duration: { type: Number }, // Duration of the quiz in minutes
  courseId: [{ type: String, ref: "Course", required: true }],
});

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
