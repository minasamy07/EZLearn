const express = require("express");
const auth = require("../middleware/user-auth");
const Notification = require("../models/notification");
const router = new express.Router();

// Get all notifications for a user
router.get("/notifications", auth, async (req, res) => {
  try {
    const courseId = req.user.courseId;
    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });
    res.json({ notifications, courseId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Mark notification as read
router.patch("/notifications/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
