const express = require("express");
const auth = require("../middleware/user-auth");
const Reminder = require("../models/reminder");
const moment = require("moment-timezone");
const router = new express.Router();

// Utility function to convert timestamps to local timezone
const convertTimestampsToLocal = (reminder) => {
  reminder.createdAt = moment(reminder.createdAt).tz("Africa/Cairo").format();
  reminder.updatedAt = moment(reminder.updatedAt).tz("Africa/Cairo").format();
  return reminder;
};

// Create reminder
router.post("/reminders", auth, async (req, res) => {
  const { title, note } = req.body;
  const reminder = new Reminder({
    title,
    note,
  });

  try {
    await reminder.save();
    res.status(201).json(convertTimestampsToLocal(reminder.toObject()));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create reminder" });
  }
});

// Get all reminders
router.get("/getReminder/all", async (req, res) => {
  try {
    let reminders = await Reminder.find();
    reminders = reminders.map((reminder) =>
      convertTimestampsToLocal(reminder.toObject())
    );
    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// Get reminder by ID
router.get("/reminders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await Reminder.findById(id);

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.status(200).json(convertTimestampsToLocal(reminder.toObject()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete reminder by ID
router.delete("/reminders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await Reminder.findByIdAndDelete(id);

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.status(200).json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
