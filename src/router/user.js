const express = require("express");
const cors = require("cors");
const auth = require("../middleware/user-auth");
const User = require("../models/user");
const multer = require("multer");
const router = new express.Router();

//create user
router.post("/users", cors(), async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).json({
      user,
      token,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json("Email is Taken");
  }
});

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
router.patch("/users/update", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ["email", "password", "courseId"];
  const isValidOperation = updates.every((update) =>
    allowedUpdate.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ Error: "Invalid UPDATE!!!" });
  }

  try {
    updates.forEach((udpate) => (req.user[udpate] = req.body[udpate]));
    await req.user.save();

    res.json(req.user);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

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
    res.json();
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
    res.json(user.avatar);
  } catch (e) {
    console.log(e);
    res.status(404).json();
  }
});

//delete Profile Picture

router.delete("/users/deletePP", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.json();
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
