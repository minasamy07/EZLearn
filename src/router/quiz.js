const express = require("express");
const router = new express.Router();
const auth = require("../middleware/user-auth");
const Quiz = require("../models/quiz");

//create quia QA

// Create a quiz
router.post("/quiz", auth, async (req, res) => {
  const { title, questions, duration, courseId } = req.body;
  try {
    const quiz = await Quiz.create({ title, questions, duration, courseId });
    return res.status(201).json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get quiz by course ID
router.get("/quiz/:courseId", auth, async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(404).json({ message: "No course found !!" });
  }
  try {
    const quiz = await Quiz.find({ courseId });
    if (!quiz || quiz.length === 0) {
      return res.status(404).json({ message: "No quiz found for this course" });
    }
    return res.json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update a quiz
router.patch("/quiz/:_id", auth, async (req, res) => {
  const _id = req.params._id;
  const { title, questions, duration, courseId } = req.body;
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      _id,
      { title, questions, duration, courseId },
      { new: true }
    );
    return res.json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete a quiz
router.delete("/quiz/:_id", auth, async (req, res) => {
  const _id = req.params._id;
  try {
    await Quiz.findByIdAndDelete(_id);
    return res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Submit a quiz by a student
router.post("/quiz/submit/:_id", auth, async (req, res) => {
  studentId = req.user._id;
  const { _id } = req.params;
  const { answers } = req.body;
  try {
    const quiz = await Quiz.findById(_id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Assuming answers is an array of objects containing question index and student's answer
    // Example: answers = [{ questionIndex: 0, answerIndex: 1 }, { questionIndex: 1, answerIndex: 2 }, ...]

    // Calculate the score
    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswerIndex) {
        score++;
      }
    });

    // Save the student's grade
    quiz.grades.push({ studentId, score });
    await quiz.save();

    return res.json({
      message: "Quiz submitted successfully",
      score,
      studentId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Calculate grades for a quiz
router.get("/quiz/grades/:_id", auth, async (req, res) => {
  const studentId = req.user._id; // Get the authenticated user's ID
  const { _id } = req.params;
  try {
    const quiz = await Quiz.findById(_id).populate("grades.studentId", "name"); // Populate student names
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Find the grade for the authenticated user
    const userGrade = quiz.grades.find(
      (grade) => grade.studentId && grade.studentId.equals(studentId)
    );
    if (!userGrade) {
      return res.status(404).json({ message: "User grade not found" });
    }

    // Return the score for the authenticated user
    return res.json({ score: userGrade.score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;