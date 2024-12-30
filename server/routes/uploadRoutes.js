const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadImage, uploadStory } = require("../controllers/uploadController");
const User = require("../models/User");
const Post = require("../models/Post");

const router = express.Router();

// Configure multer with file filter and validation
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }

  // Allow specific image formats
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/apng"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, JPG, PNG, and APNG files are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("file");

// Middleware to process image with sharp
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const processedBuffer = await sharp(req.file.buffer)
      .png() // Convert to PNG
      .resize(1024, 1024, {
        // Optional: resize image
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    // Update the req.file with processed image
    req.file.buffer = processedBuffer;
    req.file.mimetype = "image/png";

    next();
  } catch (error) {
    next(error);
  }
};

// Route to handle image upload
router.post(
  "/upload/avatar",
  authMiddleware,
  (req, res, next) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ error: "File upload error", details: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  processImage,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const publicUrl = await uploadImage(req.file, "profile-pics");
      console.log("API Response URL:", publicUrl);

      const user = await User.findById(req.user._id);
      user.profilePic = publicUrl;
      await user.save();

      res.status(200).json({ url: publicUrl });
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .json({ error: "Failed to upload image", details: err.message });
    }
  }
);

router.post(
  "/upload/post",
  authMiddleware,
  (req, res, next) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ error: "File upload error", details: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  processImage,
  async (req, res) => {
    const io = req.app.get("socketio");
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const publicUrl = await uploadImage(req.file, "post");

      const post = new Post({
        userId: req.user._id,
        caption: req.body.caption,
        post: publicUrl,
      });

      await post.save();

      io.emit("new-upload", { post });

      res.status(201).send(post);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to upload image", details: err.message });
    }
  }
);

router.post(
  "/upload/story",
  authMiddleware,
  (req, res, next) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ error: "File upload error", details: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  processImage,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: "No file uploaded" });
      }

      const publicUrl = await uploadStory(req.file, "story");

      const user = await User.findById(req.user._id);

      user.story.push({
        userId: req.user._id,
        story: publicUrl,
        text: req.body.text,
      });

      await user.save();

      res.status(201).send(user.story);
    } catch (err) {
      res.status(500).send({ message: "An error Occured" });
    }
  }
);

module.exports = router;
