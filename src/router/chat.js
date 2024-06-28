const express = require("express");
const router = express.Router();
const { Chat, Message } = require("../models/chat");
const multer = require("multer");
const auth = require("../middleware/user-auth");
const moment = require("moment-timezone");

const upload = multer({
  limits: {
    fileSize: 10000000, // Limit to 10MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|mp4|mpeg)$/)) {
      return cb(
        new Error(
          "Please upload a valid media file (jpg, jpeg, png, mp4, mpeg)"
        )
      );
    }
    cb(undefined, true);
  },
});

// Create a new chat
router.post("/chats", auth, async (req, res) => {
  const chat = new Chat({
    name: req.body.name,
    participants: req.body.participants,
  });

  try {
    await chat.save();
    res.status(201).send(chat);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get all chats for a user
router.get("/chats", auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name email")
      .populate("lastMessage");
    res.send(chats);
  } catch (e) {
    res.status(500).send();
  }
});

//ROUTES FOR MESSAGE

const formatTimestampsToLocal = (message) => {
  message.createdAt = moment(message.createdAt).tz("Africa/Cairo").format();
  return message;
};
// Send a message
router.post(
  "/chats/:chatId/messages",
  auth,
  upload.single("media"),
  async (req, res) => {
    const chatId = req.params.chatId;
    const { text } = req.body;
    let media, voice, contentType;

    if (req.file) {
      media = req.file.buffer;
      contentType = req.file.mimetype;
    }

    const message = new Message({
      sender: req.user._id,
      chat: chatId,
      text,
      media,
      voice,
      contentType,
    });

    try {
      await message.save();
      const chat = await Chat.findById(chatId);
      chat.messages.push(message._id);
      chat.lastMessage = message._id;
      chat.updatedAt = new Date();
      await chat.save();

      // Emit the message to other participants
      const io = req.app.get("socketio");
      io.to(chatId).emit(
        "message",
        formatTimestampsToLocal(message.toObject())
      );

      res
        .status(201)
        .send({ message: formatTimestampsToLocal(message.toObject()) });
    } catch (e) {
      res.status(400).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

// Get all messages for a chat
router.get("/chats/:chatId/messages", auth, async (req, res) => {
  const chatId = req.params.chatId;

  try {
    const message = await Message.find({ chat: chatId }).populate(
      "sender",
      "name email"
    );
    // Ensure all messages are formatted
    const formattedMessages = message.map((message) =>
      formatTimestampsToLocal(message.toObject())
    );

    res.send({ messages: formattedMessages });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
