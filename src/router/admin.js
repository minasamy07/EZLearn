const express = require("express");
const cors = require("cors");
const auth = require("../middleware/admin-auth");
const Admin = require("../models/admin");
const router = new express.Router();

//create Admin
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

// //login Admin

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

//get loged user

router.get("/admins/me", auth, async (req, res) => {
  res.send(req.admin);
});

//get all users
router.get("/admins/all", async (req, res) => {
  const admin = await Admin.find();

  res.send(admin);
});

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

module.exports = router;
