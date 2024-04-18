//get videos
router.get("/course/getVideos/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const videos = course.videos.find(
      (videos) => videos._id.toString() === _id
    );

    if (!videos) {
      return res.status(404).send("videos not found");
    }

    res.set("Content-type", "application/mp4");
    res.send(videos.data);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

//delete videos
router.delete("/course/deleteVideos/:_cid/:_id", async (req, res) => {
  try {
    const _cid = req.params._cid;
    const _id = req.params._id;

    const course = await Course.findById(_cid);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const videosIndex = course.videos.findIndex(
      (videos) => videos._id.toString() === _id
    );
    if (videosIndex === -1) {
      return res.status(404).send("videos not found");
    }

    course.videos.splice(videosIndex, 1);

    await course.save();

    res.status(200).send("videos deleted successfully");
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});
