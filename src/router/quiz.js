const express = require("express");
const router = new express.Router();
const auth = require("../middleware/user-auth");
const Quiz = require("../models/quiz");
const Notification = require("../models/notification");
const User = require("../models/user");

//create quia QA

// Create a quiz
router.post("/quiz", auth, async (req, res) => {
  const { title, questions, startTime, duration, courseId } = req.body;
  try {
    const quiz = await Quiz.create({
      title,
      questions,
      startTime,
      duration,
      courseId,
    });
    // Create a notification for all students in the course
    const students = await User.find({ courseId }); // Adjust the query as needed to find students in the course
    students.forEach(async (student) => {
      const notification = new Notification({
        userId: students.map((student) => student._id),
        type: "quiz",
        message: `A new quiz titled "${quiz.title}" has been created.`,
        link: `/quiz/${quiz._id}`,
      });
      await notification.save();

      // Emit the notification to the user
      const io = req.app.get("socketio");
      io.to(student._id.toString()).emit("notification", notification);
    });
    return res.status(201).send({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Check Quiz Availability Route
router.get("/quiz/availability/:_id", async (req, res) => {
  const _id = req.params._id;
  try {
    const quiz = await Quiz.findById(_id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if quiz is available based on start time and duration
    const now = new Date();
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(startTime.getTime() + quiz.duration * 60000); // Multiply by 60000 to convert minutes to milliseconds

    if (now >= startTime && now <= endTime) {
      return res.send({ available: true });
    } else {
      return res.send({ available: false });
    }
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
    return res.send({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update a quiz
router.patch("/quiz/:_id", auth, async (req, res) => {
  const _id = req.params._id;
  const { title, questions, startTime, duration, courseId } = req.body;
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      _id,
      { title, questions, startTime, duration, courseId },
      { new: true }
    );
    return res.send({ quiz });
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
