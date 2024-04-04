const express = require("express");
const cors = require("cors");
const auth = require("../middleware/admin-auth");
const Admin = require("../models/admin");
const multer = require("multer");
const router = new express.Router();

//create admin
router.post("/admins", cors(), async (req, res) => {
  const admin = new Admin(req.body);
  try {
    await admin.save();
    const token = await admin.generateAuthToken();
    res.status(201).send({
      admin,
      token,
    });
  } catch (e) {
    res.status(400).send("Email is Taken");
  }
});

// //login admin

router.post("/admins/login", async (req, res) => {
  try {
    const admin = await Admin.findByEmailAndPass(
      req.body.email,
      req.body.password
    );

    const token = await admin.generateAuthToken();
    res.send({
      admin,
      token,
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

//log out admin

router.post("/admins/logout", auth, async (req, res) => {
  try {
    req.admin.tokens = req.admin.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.admin.save();
    res.send("log out succefully");
  } catch (e) {
    res.status(500).send();
  }
});

//get loged admin

router.get("/admins/me", auth, async (req, res) => {
  res.send(req.admin);
});

//get all admins
router.get("/admins/all", async (req, res) => {
  const admin = await Admin.find();

  res.send(admin);
});

//update personal data
router.patch("/admins/update", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ["name", "email", "password"];
  const isValidOperation = updates.every((update) =>
    allowedUpdate.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ Error: "Invalid UPDATE!!!" });
  }

  try {
    updates.forEach((udpate) => (req.admin[udpate] = req.body[udpate]));
    await req.admin.save();

    res.send(req.admin);
  } catch (e) {
    res.status(400).send(e);
  }
});

// add profile picture

const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.endsWith(".jpg" || ".jpeg" || ".png")) {
      return cb(new Error("upload a photo"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/admins/profilePicture",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 200, height: 200 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.admin.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// get profile picture

router.get("/admins/getPP", auth, async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin || !admin.avatar) {
      throw new error();
    }

    res.set("Content-type", "image/png" || "image/jpeg" || "image/jpg");
    res.send(admin.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

//delete Profile Picture

router.delete("/admins/deletePP", auth, async (req, res) => {
  req.admin.avatar = undefined;
  await req.admin.save();
  res.send();
});

// //delete admin
// router.delete("/admins/delete", auth, async (req, res) => {
//   try {
//     await req.admin.remove();
//     res.send(req.admin);
//   } catch (e) {
//     res.status(500).send();
//   }
// });

module.exports = router;
