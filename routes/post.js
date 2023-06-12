const express = require("express");
const router = express.Router();
const multer = require("multer");
const { randomString } = require("../utils/randomString");
const { Post, validate } = require("../models/posts");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();

    for (const post of posts) post.image_url = await post.getImageUrl();

    res.json(posts);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("please select an image");

    const { error } = validate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    const imageName = "posts/" + randomString() + req.file.originalname;

    await Post.createImageUrl(imageName, req.file.buffer, req.file.mimetype);

    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imageName,
    });

    await post.save();
    post.image_url = await post.getImageUrl();

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("post not found");

    if (req.file) {
      await post.deleteImageUrl();

      const imageName = "posts/" + randomString() + req.file.originalname;

      await Post.createImageUrl(imageName, req.file.buffer, req.file.mimetype);

      post = await Post.findByIdAndUpdate(
        req.params.id,
        {
          $set: { title: req.body.title, content: req.body.content, imageName },
        },
        { new: true }
      );
      post.image_url = await post.getImageUrl();

      return res.json(post);
    }

    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $set: { title: req.body.title, content: req.body.content },
      },
      { new: true }
    );
    post.image_url = await post.getImageUrl();

    res.json(post);
  } catch (error) {
    res.json(error.message);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json("post not found");

    await post.deleteImageUrl();
    await post.deleteOne();

    res.json(post);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = router;
