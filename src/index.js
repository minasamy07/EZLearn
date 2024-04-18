const express = require("express");
const cors = require("cors");
const adminRouter = require("./router/admin");
const teacherRouter = require("./router/teacher");
const studentRouter = require("./router/student");
const courseRouter = require("./router/course");
require("./DB/mongoose");

const app = express();
app.use(cors());
const port = process.env.PORT;

app.use(express.json());
app.use(adminRouter);
app.use(teacherRouter);
app.use(studentRouter);
app.use(courseRouter);

app.listen(port, () => {
  console.log("server run on port: " + port);
});
