const express = require("express");
const router = new express.Router();
const Course = require("../models/courses");
const multer = require("multer");

//create course

router.post("/course", async (req, res) => {
  const course = new Course(req.body);
  try {
    await course.save();
    res.status(201).send(course);
  } catch (e) {
    res.status(400).send(e);
  }
});

/// get Teacher

router.get("/course/getTeacher/:_id", async (req, res) => {
  const _id = req.params._id;

  try {
    // Find the course document by ID
    const course = await Course.findOne({ _id }).populate("teacherId");

    if (course) {
      if (course.teacherId && course.teacherId.length > 0) {
        // Extract course names from the retrieved course
        const TeacherName = course.teacherId.map((course) => course.name);
        res.json({ TeacherName });
      } else {
        res.status(404).json({ message: "No teacher found for this course" });
      }
    } else {
      res.status(404).json({ message: "Teacher not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//add files(pdfs and words)

const uploadFiles = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (
      !file.originalname.endsWith(".pdf") &&
      !file.originalname.endsWith(".doc") &&
      !file.originalname.endsWith(".docx")
    ) {
      return cb(new Error("upload a pdf or word  please"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/course/files/:_id",
  uploadFiles.single("files"),
  async (req, res) => {
    const _id = req.params._id;
    try {
      const course = await Course.findById(_id);
      if (!course) {
        return res.status(404).send("Course not found");
      }

      course.files.push({
        data: req.file.buffer,
        filename: req.file.originalname,
      });
      await course.save();
      res.send("File uploaded successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//get file
router.get("/course/getFiles/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const file = course.files.find((file) => file._id.toString() === _id);

    if (!file) {
      return res.status(404).send("File not found");
    }

    let contentType;
    if (file.filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (
      file.filename.endsWith(".doc") ||
      file.filename.endsWith(".docx")
    ) {
      contentType = "application/msword";
    } else {
      contentType = "application/octet-stream";
    }

    res.set("Content-type", contentType);
    res.send(file.data);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//delete file
router.delete("/course/deleteFiles/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const fileIndex = course.files.findIndex(
      (file) => file._id.toString() === _id
    );
    if (fileIndex === -1) {
      return res.status(404).send("File not found");
    }

    course.files.splice(fileIndex, 1);

    await course.save();

    res.status(200).send("File deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//add assignments(pdfs and words)

const uploadAssignments = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
      return cb(new Error("Upload a pdf or word only please"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/course/assignments/:_id",
  uploadAssignments.single("assignments"),
  async (req, res) => {
    const _id = req.params._id;
    try {
      const course = await Course.findById(_id);
      if (!course) {
        return res.status(400).send("Course not Found");
      }

      course.assignments.push({
        data: req.file.buffer,
        filename: req.file.originalname,
      });
      await course.save();
      res.send("File Uploaded sucessfully");
    } catch (e) {
      console.error(e);
      res.status(500).send("Internal Server error");
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//get assignments
router.get("/course/getAssignments/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const assignments = course.assignments.find(
      (assignments) => assignments._id.toString() === _id
    );

    if (!assignments) {
      return res.status(404).send("Assignment not found");
    }

    let contentType;
    if (assignments.filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (
      assignments.filename.endsWith(".doc") ||
      assignments.filename.endsWith(".docx")
    ) {
      contentType = "application/msword";
    } else {
      contentType = "application/octet-stream";
    }

    res.set("Content-type", contentType);
    res.send(assignments.data);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//delete assignments
router.delete("/course/deleteAssignments/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const assignmentsIndex = course.assignments.findIndex(
      (assignments) => assignments._id.toString() === _id
    );
    if (assignmentsIndex === -1) {
      return res.status(404).send("assignment not found");
    }

    course.assignments.splice(assignmentsIndex, 1);

    await course.save();

    res.status(200).send("assignment deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//add projects(pdfs and words)

const uploadprojects = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
      return cb(new Error("upload a pdf or word  please"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/course/projects/:_id",
  uploadprojects.single("projects"),
  async (req, res) => {
    const _id = req.params._id;
    try {
      const course = await Course.findById(_id);
      if (!course) {
        return res.status(404).send("Course not found");
      }

      course.projects.push({
        data: req.file.buffer,
        filename: req.file.originalname,
      });
      await course.save();
      res.send("File uploaded successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//get projects
router.get("/course/getProjects/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const projects = course.projects.find(
      (projects) => projects._id.toString() === _id
    );

    if (!projects) {
      return res.status(404).send("project not found");
    }

    let contentType;
    if (projects.filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (
      projects.filename.endsWith(".doc") ||
      projects.filename.endsWith(".docx")
    ) {
      contentType = "application/msword";
    } else {
      contentType = "application/octet-stream";
    }

    res.set("Content-type", contentType);
    res.send(projects.data);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//delete projects
router.delete("/course/deleteProjects/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const projectsIndex = course.projects.findIndex(
      (projects) => projects._id.toString() === _id
    );
    if (projectsIndex === -1) {
      return res.status(404).send("project not found");
    }

    course.projects.splice(projectsIndex, 1);

    await course.save();

    res.status(200).send("project deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//add Videos

const uploadVideos = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.endsWith(".mp4")) {
      return cb(new Error("upload Video  please"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/course/videos/:_id",
  uploadVideos.single("videos"),
  async (req, res) => {
    const _id = req.params._id;
    try {
      const course = await Course.findById(_id);
      if (!course) {
        return res.status(404).send("Course not found");
      }

      course.videos.push({
        data: req.file.buffer,
        filename: req.file.originalname,
      });
      await course.save();
      res.send("Video uploaded successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//get videos
router.get("/course/getVideos/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const videos = course.videos.find(
      (videos) => videos._id.toString() === _id
    );

    if (!videos) {
      return res.status(404).send("video not found");
    }

    res.set("Content-type", "application/mp4");
    res.send(videos.data);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//delete videos
router.delete("/course/deleteVideos/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const videosIndex = course.videos.findIndex(
      (videos) => videos._id.toString() === _id
    );
    if (videosIndex === -1) {
      return res.status(404).send("video not found");
    }

    course.videos.splice(videosIndex, 1);

    await course.save();

    res.status(200).send("video deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
