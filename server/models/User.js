const mongoose = require("mongoose");
require("../db/mongoose");
const validator = require("validator");

// Create a separate schema for stories to handle TTL properly
const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  story: {
    type: String,
    required: true,
  },
  text: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create TTL index on createdAt field
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Main user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  userName: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is Invalid");
      }
    },
  },
  profilePic: {
    type: String,
    default: "https://superst.ac/_next/image?url=%2FIMG_8692.PNG&w=128&q=75",
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  saved: [
    {
      postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },
  ],
  followers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  ],
  following: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  ],
  // Reference the separate story schema
  story: [storySchema],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
