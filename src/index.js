const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const userRouter = require("./router/user");
const courseRouter = require("./router/course");
const quizRouter = require("./router/quiz");
const searchRouter = require("./router/search");
const notificationRouter = require("./router/notification");
const reminderRouter = require("./router/reminder");
const attendanceRouter = require("./router/attendace");
const chatRouter = require("./router/chat");
require("./DB/mongoose");

const app = express();
const server = http.createServer(app); //because websocket doesn't work with express lazm waset
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
  },
});

app.use(cors());
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(userRouter);
app.use(courseRouter);
app.use(quizRouter);
app.use(searchRouter);
app.use(reminderRouter);
app.use(notificationRouter);
app.use(attendanceRouter);
app.use(chatRouter);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("join", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });
  socket.on("message", (message) => {
    const { chatId, ...messageContent } = message;
    io.to(chatId).emit("message", messageContent);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.set("socketio", io); // Make io accessible in routes

server.listen(port, () => {
  console.log("server running on port: " + port);
});
