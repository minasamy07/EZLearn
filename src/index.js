const express = require("express");
const adminRouter = require("./router/admin");
const teacherRouter = require("./router/teacher");
const studentRouter = require("./router/student");
require("./DB/mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
const port = process.env.PORT;

app.use(express.json());
app.use(adminRouter);
app.use(teacherRouter);
app.use(studentRouter);

app.listen(port, () => {
  console.log("server run on port: " + port);
});
