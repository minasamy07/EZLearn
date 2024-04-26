// Enroll student in a course
app.post("/enroll", async (req, res) => {
  const { studentId, courseId } = req.body;
  try {
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    // Add course to student's courses
    student.courses.push(courseId);
    await student.save();
    return res.json({ message: "Student enrolled in course successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Assign teacher to a course
app.post("/assign", async (req, res) => {
  const { teacherId, courseId } = req.body;
  try {
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    // Add course to teacher's courses
    teacher.courses.push(courseId);
    await teacher.save();
    return res.json({ message: "Teacher assigned to course successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
