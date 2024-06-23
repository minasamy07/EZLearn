const express = require("express");
const cors = require("cors");
const auth = require("../middleware/user-auth");
const User = require("../models/user");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const router = new express.Router();

//multer for registerImage
const uploadImage = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error("Please upload an image (jpg, jpeg, or png)"));
    }
    cb(undefined, true);
  },
});

//create user
router.post(
  "/users",
  cors(),
  uploadImage.array("registerImage", 5),
  async (req, res) => {
    try {
      console.log("Files:", req.files); // Debug log

      const { name, email, password, role, courseIds } = req.body;
      const courseIdArray = courseIds
        .split(",")
        .map((courseId) => courseId.trim());
      const user = new User({
        name,
        email,
        password,
        role,
        courseId: courseIdArray,
        registerImage: req.files ? req.files.map((file) => file.buffer) : [],
      });

      await user.save();
      const token = await user.generateAuthToken();

      // Send data to AI server
      const formData = new FormData();
      formData.append("student_id", user._id.toString());
      formData.append("course_ids", courseIds);
      req.files.forEach((file, index) => {
        formData.append("images", file.buffer, `image${index}.jpg`);
      });

      const aiResponse = await axios.post(
        "http://127.0.0.1:8010/register_student",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      res.status(201).json({
        user,
        token,
        aiResponse: aiResponse.data,
      });
    } catch (e) {
      console.error(e); // Debug log
      res.status(400).json({ error: e.message });
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);
//login user

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByEmailAndPass(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();
    const role = await user.role;
    res.json({
      user,
      token,
      role,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

//log out user

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();
    res.json("log out succefully");
  } catch (e) {
    console.log(e);
    res.status(500).json();
  }
});

//get loged user

router.get("/users/me", auth, async (req, res) => {
  res.json(req.user);
});

//get all users
router.get("/users/all", async (req, res) => {
  const user = await User.find();

  res.json(user);
});

//update personal data user
router.patch(
  "/users/update",
  auth,
  uploadImage.array("registerImage", 5),
  async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdate = ["email", "password", "courseId", "registerImage"];
    const isValidOperation = updates.every((update) =>
      allowedUpdate.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ Error: "Invalid UPDATE!!!" });
    }

    try {
      updates.forEach((udpate) => (req.user[udpate] = req.body[udpate]));
      if (req.files && req.files.length > 0) {
        req.user.registerImage = req.files.map((file) => file.buffer);
      }
      await req.user.save();

      res.json(req.user);
    } catch (e) {
      console.log(e);
      res.status(400).json(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// add profile picture

const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (
      !file.originalname.endsWith(".jpg") &&
      !file.originalname.endsWith(".jpeg") &&
      !file.originalname.endsWith(".png")
    ) {
      return cb(new Error("upload a photo"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/profilePicture",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// get profile picture

router.get("/users/getPP", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.avatar) {
      throw new error();
    }

    res.set("Content-type", "image/png" || "image/jpeg" || "image/jpg");
    res.send(user.avatar);
  } catch (e) {
    console.log(e);
    res.status(404).json(e);
  }
});

//delete Profile Picture

router.delete("/users/deletePP", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

//get course of user

router.get("/users/getcourse", auth, async (req, res) => {
  try {
    _id = req.user._id;

    // Find the user document by ID
    const user = await User.findOne({ _id }).populate("courseId");

    if (user) {
      if (user.courseId && user.courseId.length > 0) {
        // Extract course names from the retrieved user
        const courseNames = user.courseId.map((course) => course.name);
        res.json({ courseNames });
      } else {
        res.status(404).json({ message: "No course found for this user" });
      }
    } else {
      res.status(404).json({ message: "user not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
