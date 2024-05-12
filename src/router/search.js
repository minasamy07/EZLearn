const express = require("express");
const auth = require("../middleware/user-auth");
const Course = require("../models/course");
const Quiz = require("../models/quiz");
const router = new express.Router();

// Search for courses, quizzes, materials, assignments, videos, and projects
router.get("/search", auth, async (req, res) => {
  try {
    const searchTerm = req.body.term;
    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }

    // Ensure searchTerm is a string
    const searchString = new RegExp(searchTerm, "i");

    // Search for courses by name
    const courses = await Course.find({ name: searchString });
    if (courses.length === 0) {
      return res.status(400).json({ message: "course not found " });
    }

    // // Search for quizzes by title
    // const quizzes = await Quiz.find({ title: searchString });

    // // Search for materials (assignments, projects, files, videos)
    // const materials = await Course.find({
    //   $or: [
    //     { "assignments.filename": searchString },
    //     { "projects.filename": searchString },
    //     { "files.filename": searchString },
    //     { "videos.filename": searchString },
    //   ],
    // });

    // // Combine the search results into one object
    // const searchResults = { courses, quizzes, materials };

    res.send(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
