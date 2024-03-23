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

router.get("/admins/me", auth, async (req, res) => {
  res.send(req.admin);
});

router.get("/admins/all", async (req, res) => {
  const admin = await Admin.find();

  res.send(admin);
});

module.exports = router;
