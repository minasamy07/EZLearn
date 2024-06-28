const express = require("express");
const router = new express.Router();
const Course = require("../models/course");
const multer = require("multer");
const auth = require("../middleware/user-auth");
const Notification = require("../models/notification");
const User = require("../models/user");

//create course
const links = "https://thankful-ample-shrimp.ngrok-free.app/";

router.post("/course", async (req, res) => {
  const course = new Course(req.body);
  try {
    await course.save();
    res.status(201).json(course);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

//get course
router.get("/getCourse/all", async (req, res) => {
  const course = await Course.find();
  res.json(course);
});

/// get Teacher of course by course ID

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

/// get Teacher of course by teacher ID

router.get("/teacher/getCourses/:_id", async (req, res) => {
  const _id = req.params._id;

  try {
    // Find courses where the provided teacher ID exists within the teacherId array
    const courses = await Course.find({ teacherId: _id });

    if (courses && courses.length > 0) {
      // Extract course names from the retrieved courses
      const courseNames = courses.map((course) => course.name);
      res.json({ courseNames });
    } else {
      res.status(404).json({ message: "No courses found for this teacher" });
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
      !file.originalname.endsWith(".docx") &&
      !file.originalname.endsWith(".pptx")
    ) {
      return cb(new Error("upload a pdf or word or PowerPoint please"));
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
        return res.status(404).json("Course not found");
      }

      course.files.push({
        data: req.file.buffer,
        filename: req.file.originalname,
      });

      const savedCourse = await course.save();
      const fileId = savedCourse.files[savedCourse.files.length - 1]._id; // Get the _id of the last file added

      // Create a notification for all students in the course
      const students = await User.find({ courseId: _id });
      const notifications = [];

      students.forEach((student) => {
        const notification = new Notification({
          userId: students.map((student) => student._id),
          type: "file",
          message: `New file "${req.file.originalname}" uploaded to course "${course.name}".`,
          link: `${links}course/getFiles/${_id}/${fileId}`,
        });
        notifications.push(notification.save());

        // Emit the notification to the user
        const io = req.app.get("socketio");
        if (io) {
          io.to(student._id.toString()).emit("notification", notification);
        }
      });

      await Promise.all(notifications);

      res.json({ fileId });
    } catch (error) {
      console.error(error);
      res.status(500).json("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

//get file
router.get("/course/getFiles/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const file = course.files.find((file) => file._id.toString() === _id);

    if (!file) {
      return res.status(404).json("File not found");
    }

    let contentType;
    if (file.filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (
      file.filename.endsWith(".doc") ||
      file.filename.endsWith(".docx")
    ) {
      contentType = "application/msword";
    } else if (file.filename.endsWith(".pptx")) {
      contentType = "application/vnd.ms-powerpoint";
    } else {
      contentType = "application/octet-stream";
    }

    res.set("Content-type", contentType);
    res.send(file.data);
  } catch (e) {
    console.error(e);
    res.status(500).json("Internal Server Error");
  }
});

//delete file
router.delete("/course/deleteFiles/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const fileIndex = course.files.findIndex(
      (file) => file._id.toString() === _id
    );
    if (fileIndex === -1) {
      return res.status(404).json("File not found");
    }

    course.files.splice(fileIndex, 1);

    await course.save();

    res.status(200).json("File deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).json("Internal Server Error");
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

//POSt

router.post(
  "/course/assignments/:_id",
  uploadAssignments.single("assignments"),
  async (req, res) => {
    const _id = req.params._id;
    const { uploadtime, deadline } = req.body;
    try {
      const course = await Course.findById(_id);
      if (!course) {
        return res.status(400).json("Course not Found");
      }

      course.assignments.push({
        data: req.file.buffer,
        filename: req.file.originalname,
        uploadtime: new Date(uploadtime),
        deadline: new Date(deadline),
      });
      const savedCourse = await course.save();
      const assignmentId =
        savedCourse.assignments[savedCourse.assignments.length - 1]._id; // Get the _id of the last file added

      // Create a notification for all students in the course
      const students = await User.find({ courseId: _id });
      const notifications = [];

      students.forEach((student) => {
        const notification = new Notification({
          userId: students.map((student) => student._id),
          type: "assignment",
          message: `New assignment "${req.file.originalname}" uploaded to course "${course.name}".`,
          link: `${links}course/getAssignments/${_id}/${assignmentId}`,
        });
        notifications.push(notification.save());

        // Emit the notification to the user
        const io = req.app.get("socketio");
        if (io) {
          io.to(student._id.toString()).emit("notification", notification);
        }
      });

      await Promise.all(notifications);

      res.json({ assignmentId });
    } catch (e) {
      console.error(e);
      res.status(500).json("Internal Server error");
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

//get assignments
router.get("/course/getAssignments/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const assignments = course.assignments.find(
      (assignments) => assignments._id.toString() === _id
    );

    if (!assignments) {
      return res.status(404).json("Assignment not found");
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
    res.status(500).json("Internal Server Error");
  }
});

//delete assignments
router.delete("/course/deleteAssignments/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const assignmentsIndex = course.assignments.findIndex(
      (assignments) => assignments._id.toString() === _id
    );
    if (assignmentsIndex === -1) {
      return res.status(404).json("assignment not found");
    }

    course.assignments.splice(assignmentsIndex, 1);

    await course.save();

    res.status(200).json("assignment deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).json("Internal Server Error");
  }
});

// Add solution to assignment

const uploadSolution = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
      return cb(new Error("Upload a pdf or word only please"));
    }
    cb(undefined, true);
  },
});

//POSt

router.post(
  "/course/assignments/solution/:_cid/:_id",
  auth,
  uploadSolution.single("assignments-solution"),
  async (req, res) => {
    const _cid = req.params._cid;
    const _id = req.params._id;
    const studentId = req.user._id; // Assuming user object contains student ID after authentication
    const { uploadtime } = req.body;

    try {
      const course = await Course.findById(_cid);
      if (!course) {
        return res.status(400).json("Course not Found");
      }

      const assignment = course.assignments.find(
        (assignment) => assignment._id.toString() === _id
      );
      if (!assignment) {
        return res.status(404).json("Assignment not found");
      }

      // Push solution with student ID
      assignment.solutions.push({
        studentId: studentId,
        data: req.file.buffer,
        filename: req.file.originalname,
        uploadtime: new Date(uploadtime),
      });

      await course.save();
      const solutionId =
        assignment.solutions[assignment.solutions.length - 1]._id;
      res.json({ solutionId });
    } catch (e) {
      console.error(e);
      res.status(500).json("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// Get assignment solution

router.get(
  "/course/getAssignments/solution/:_cid/:_id/:_sid",
  auth,
  async (req, res) => {
    const _cid = req.params._cid;
    const _id = req.params._id;
    const _sid = req.params._sid;
    const studentId = req.user._id; // Assuming user object contains student ID after authentication

    try {
      const course = await Course.findById(_cid);
      if (!course) {
        return res.status(404).json("Course not found");
      }

      const assignment = course.assignments.find(
        (assignment) => assignment._id.toString() === _id
      );
      if (!assignment) {
        return res.status(404).json("Assignment not found");
      }

      // Find the correct solution within the assignment
      const solution = assignment.solutions.find(
        (solution) => solution._id.toString() === _sid
      );
      if (!solution) {
        return res.status(404).json("Solution not found");
      }

      let contentType;
      if (solution.filename.endsWith(".pdf")) {
        contentType = "application/pdf";
      } else if (
        solution.filename.endsWith(".doc") ||
        solution.filename.endsWith(".docx")
      ) {
        contentType = "application/msword";
      } else {
        contentType = "application/octet-stream";
      }

      res.set("Content-type", contentType);

      // Return solution data
      res.send(solution.data);
      // res.json({
      //   // studentName: studentId.name,
      //   // solutionData: solution.data,
      //   solutionFilename: solution.filename,
      // });
      // res
      //   .set({
      //     "Content-Type": "application/octet-stream",
      //     "Content-Disposition": `attachment; filename="${solution.filename}"`,
      //     "Student-Name": studentId.name,
      //   })
      //   .json({
      //     studentName: studentId.name,
      //     solutionData: solution.data,
      //     solutionFilename: solution.filename,
      //   });
    } catch (e) {
      console.error(e);
      res.status(500).json("Internal Server Error");
    }
  }
);

// Delete assignment solution
router.delete(
  "/course/deleteAssignments/solution/:_cid/:_id/:_sid",
  auth,
  async (req, res) => {
    const _cid = req.params._cid;
    const _id = req.params._id;
    const _sid = req.params._sid;
    const studentId = req.user._id; // Assuming user object contains student ID after authentication

    try {
      const course = await Course.findById(_cid);
      if (!course) {
        return res.status(404).json("Course not found");
      }

      const assignment = course.assignments.find(
        (assignment) => assignment._id.toString() === _id
      );
      if (!assignment) {
        return res.status(404).json("Assignment not found");
      }

      // Find the index of solution by solution ID within the assignment
      const solutionIndex = assignment.solutions.findIndex(
        (solution) => solution._id.toString() === _sid
      );
      if (solutionIndex === -1) {
        return res.status(404).json("Solution not found");
      }

      // Remove the solution from the assignment
      assignment.solutions.splice(solutionIndex, 1);

      await course.save();
      res.status(200).json("Solution deleted successfully");
    } catch (e) {
      console.error(e);
      res.status(500).json("Internal Server Error");
    }
  }
);

//add projects(pdfs and words)

const uploadprojects = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|doc|docx|.pptx)$/)) {
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
    const { uploadtime, deadline } = req.body;

    try {
      const course = await Course.findById(_id);
      if (!course) {
        return res.status(404).json("Course not found");
      }

      course.projects.push({
        data: req.file.buffer,
        filename: req.file.originalname,
        uploadtime: new Date(uploadtime),
        deadline: new Date(deadline),
      });
      const savedCourse = await course.save();
      const projectId =
        savedCourse.projects[savedCourse.projects.length - 1]._id; // Get the _id of the last file added

      // Create a notification for all students in the course
      const students = await User.find({ courseId: _id });
      const notifications = [];

      students.forEach((student) => {
        const notification = new Notification({
          userId: students.map((student) => student._id),
          type: "project",
          message: `New project "${req.file.originalname}" uploaded to course "${course.name}".`,
          link: `${links}course/getProjects/${_id}/${projectId}`,
        });
        notifications.push(notification.save());

        // Emit the notification to the user
        const io = req.app.get("socketio");
        if (io) {
          io.to(student._id.toString()).emit("notification", notification);
        }
      });

      await Promise.all(notifications);

      res.json({ projectId });
    } catch (error) {
      console.error(error);
      res.status(500).json("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

//get projects
router.get("/course/getProjects/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const projects = course.projects.find(
      (projects) => projects._id.toString() === _id
    );

    if (!projects) {
      return res.status(404).json("project not found");
    }

    let contentType;
    if (projects.filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (
      projects.filename.endsWith(".doc") ||
      projects.filename.endsWith(".docx")
    ) {
      contentType = "application/msword";
    } else if (file.filename.endsWith(".pptx")) {
      contentType = "application/vnd.ms-powerpoint";
    } else {
      contentType = "application/octet-stream";
    }

    res.set("Content-type", contentType);
    res.send(projects.data);
  } catch (e) {
    console.error(e);
    res.status(500).json("Internal Server Error");
  }
});

//delete projects
router.delete("/course/deleteProjects/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const projectsIndex = course.projects.findIndex(
      (projects) => projects._id.toString() === _id
    );
    if (projectsIndex === -1) {
      return res.status(404).json("project not found");
    }

    course.projects.splice(projectsIndex, 1);

    await course.save();

    res.status(200).json("project deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).json("Internal Server Error");
  }
});

// Add solution to project

const uploadProjectSolution = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|doc|docx|.pptx)$/)) {
      return cb(
        new Error("Upload a pdf, word, or PowerPoint file only please")
      );
    }
    cb(undefined, true);
  },
});

// Add solution to project
router.post(
  "/course/projects/solution/:_cid/:_id",
  auth,
  uploadProjectSolution.single("projects-solution"),
  async (req, res) => {
    const _cid = req.params._cid;
    const _id = req.params._id;
    const { uploadtime } = req.body;
    const studentId = req.user._id; // Assuming user object contains student ID after authentication

    try {
      const course = await Course.findById(_cid);
      if (!course) {
        return res.status(404).json("Course not found");
      }

      const project = course.projects.find(
        (project) => project._id.toString() === _id
      );
      if (!project) {
        return res.status(404).json("Project not found");
      }

      // Push solution with student ID
      project.solutions.push({
        studentId: studentId,
        data: req.file.buffer,
        filename: req.file.originalname,
        uploadtime: new Date(uploadtime),
      });

      await course.save();
      const solutionId = project.solutions[project.solutions.length - 1]._id;
      res.json({ solutionId });
    } catch (e) {
      console.error(e);
      res.status(500).json("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// Get project solution
router.get(
  "/course/getProjects/solution/:_cid/:_id/:_sid",
  auth,
  async (req, res) => {
    const _cid = req.params._cid;
    const _id = req.params._id;
    const _sid = req.params._sid;
    const studentId = req.user._id; // Assuming user object contains student ID after authentication

    try {
      const course = await Course.findById(_cid);
      if (!course) {
        return res.status(404).json("Course not found");
      }

      const project = course.projects.find(
        (project) => project._id.toString() === _id
      );
      if (!project) {
        return res.status(404).json("Project not found");
      }

      // Find the solution by solution ID
      const solution = project.solutions.find(
        (solution) => solution._id.toString() === _sid
      );
      if (!solution) {
        return res.status(404).json("Solution not found");
      }

      let contentType;
      if (solution.filename.endsWith(".pdf")) {
        contentType = "application/pdf";
      } else if (
        solution.filename.endsWith(".doc") ||
        solution.filename.endsWith(".docx")
      ) {
        contentType = "application/msword";
      } else if (file.filename.endsWith(".pptx")) {
        contentType = "application/vnd.ms-powerpoint";
      } else {
        contentType = "application/octet-stream";
      }

      res.set("Content-type", contentType);
      res.send(solution.data);
    } catch (e) {
      console.error(e);
      res.status(500).json("Internal Server Error");
    }
  }
);

// Delete project solution
router.delete(
  "/course/deleteProjects/solution/:_cid/:_id/:_sid",
  auth,
  async (req, res) => {
    const _cid = req.params._cid;
    const _id = req.params._id;
    const _sid = req.params._sid;
    const studentId = req.user._id; // Assuming user object contains student ID after authentication

    try {
      const course = await Course.findById(_cid);
      if (!course) {
        return res.status(404).json("Course not found");
      }

      const project = course.projects.find(
        (project) => project._id.toString() === _id
      );
      if (!project) {
        return res.status(404).json("Project not found");
      }

      // Find the index of solution by solution ID
      const solutionIndex = project.solutions.findIndex(
        (solution) => solution._id.toString() === _sid
      );
      if (solutionIndex === -1) {
        return res.status(404).json("Solution not found");
      }

      // Remove the solution
      project.solutions.splice(solutionIndex, 1);

      await course.save();
      res.status(200).json("Solution deleted successfully");
    } catch (e) {
      console.error(e);
      res.status(500).json("Internal Server Error");
    }
  }
);

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
        return res.status(404).json("Course not found");
      }

      course.videos.push({
        data: req.file.buffer,
        filename: req.file.originalname,
      });
      const savedCourse = await course.save();
      const videoId = savedCourse.videos[savedCourse.videos.length - 1]._id; // Get the _id of the last file added

      // Create a notification for all students in the course
      const students = await User.find({ courseId: _id });
      const notifications = [];

      students.forEach((student) => {
        const notification = new Notification({
          userId: students.map((student) => student._id),
          type: "video",
          message: `New video "${req.file.originalname}" uploaded to course "${course.name}".`,
          link: `${links}course/getVideos/${_id}/${videoId}`,
        });
        notifications.push(notification.save());

        // Emit the notification to the user
        const io = req.app.get("socketio");
        if (io) {
          io.to(student._id.toString()).emit("notification", notification);
        }
      });

      await Promise.all(notifications);
      res.json({ videoId });
    } catch (error) {
      console.error(error);
      res.status(500).json("Internal Server Error");
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

//get videos
router.get("/course/getVideos/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const videos = course.videos.find(
      (videos) => videos._id.toString() === _id
    );

    if (!videos) {
      return res.status(404).json("video not found");
    }

    res.set("Content-type", "application/mp4");
    res.send(videos.data);
  } catch (e) {
    console.error(e);
    res.status(500).json("Internal Server Error");
  }
});

//delete videos
router.delete("/course/deleteVideos/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).json("Course not found");
    }

    const videosIndex = course.videos.findIndex(
      (videos) => videos._id.toString() === _id
    );
    if (videosIndex === -1) {
      return res.status(404).json("video not found");
    }

    course.videos.splice(videosIndex, 1);

    await course.save();

    res.status(200).json("video deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).json("Internal Server Error");
  }
});

//get all course
router.get("/course/all", async (req, res) => {
  try {
    const courses = await Course.find().select("_id name path teacherId");
    res.status(200).json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//update course

router.patch("/course/update/admin/:_id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "path", "teacherId"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: "Invalid updates!" });
  }

  try {
    const course = await Course.findById(req.params._id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    updates.forEach((update) => {
      if (update === "teacherId" && Array.isArray(req.body[update])) {
        course[update] = req.body[update];
      } else if (update !== "teacherId") {
        course[update] = req.body[update];
      }
    });
    await course.save();
    res.json(course);
  } catch (e) {
    console.log(e);
    res.status(400).json({ error: e.message });
  }
});

//delete course
router.delete("/course/delete/:_id", async (req, res) => {
  const _id = req.params;
  try {
    const course = await Course.findByIdAndDelete(_id);

    if (!course) {
      return res.status(404).json({ error: "course not found" });
    }
    res.status(200).json({ message: "Course deleted Successfully" });
  } catch (e) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
