const express = require("express");
const router = new express.Router();
const auth = require("../middleware/user-auth");
const Quiz = require("../models/quiz");
const Notification = require("../models/notification");
const User = require("../models/user");
const Course = require("../models/course");
const moment = require("moment-timezone");

const links = "https://thankful-ample-shrimp.ngrok-free.app/";

// Utility function to format timestamps to Cairo timezone
const formatTimestampsToLocal = (quiz) => {
  quiz.startTime = moment(quiz.startTime).tz("Africa/Cairo").format();
  return quiz;
};

// Create a quiz
router.post("/quiz", auth, async (req, res) => {
  const { title, questions, startTime, duration, courseId } = req.body;
  try {
    const startTimeLocal = moment.tz(startTime, "Africa/Cairo").format();

    const quiz = await Quiz.create({
      title,
      questions,
      startTime: startTimeLocal,
      duration,
      courseId,
    });
    // Find the course name to include in the notification message

    const course = await Course.findById(courseId);

    // Create a notification for all students in the course

    // Find all students in the course
    const students = await User.find({ courseId });
    const studentIds = students.map((student) => student._id);

    const notification = new Notification({
      userId: studentIds,
      type: "quiz",
      message: `New quiz "${quiz.title}" uploaded to course "${course.name}".`,
      link: `${links}/quiz/${courseId}/${quiz._id}`,
    });
    await notification.save();

    // Emit the notification to the user
    const io = req.app.get("socketio");
    if (io) {
      studentIds.forEach((studentId) => {
        io.to(studentId.toString()).emit("notification", notification);
      });
    }
    return res
      .status(201)
      .send({ quiz: formatTimestampsToLocal(quiz.toObject()) });
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

//get all quiz
router.get("/quiz/getAll", async (req, res) => {
  const quiz = await Quiz.find({}).select("title startTime duration courseId");
  res.status(200).json(quiz);
});

// Get quiz by course ID
router.get("/quiz/:courseId", auth, async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(404).json({ message: "No course found !!" });
  }
  try {
    let quizzes = await Quiz.find({ courseId });
    if (!quizzes || quizzes.length === 0) {
      return res.status(404).json({ message: "No quiz found for this course" });
    }
    quizzes = quizzes.map((quiz) => formatTimestampsToLocal(quiz.toObject()));
    return res.send({ quizzes });
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
    const startTimeLocal = moment.tz(startTime, "Africa/Cairo").format();
    const quiz = await Quiz.findByIdAndUpdate(
      _id,
      { title, questions, startTime: startTimeLocal, duration, courseId },
      { new: true }
    );
    return res.send({ quiz: formatTimestampsToLocal(quiz.toObject()) });
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
  const studentId = req.user._id;
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
  const studentId = req.user._id;
  const { _id } = req.params;
  try {
    const quiz = await Quiz.findById(_id).populate("grades.studentId", "name");
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
