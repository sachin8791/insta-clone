const mongoose = require("mongoose");
require("../db/mongoose");
const validator = require("validator");

// Create a separate schema for stories but don't create a model from it
const storySchema = new mongoose.Schema({
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
    expires: 86400, // 24 hours in seconds
  },
});

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
        ref: "User",
      },
    },
  ],
  following: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  story: [storySchema],
});

// Static method to clean all expired stories
userSchema.statics.cleanAllExpiredStories = async function () {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const result = await this.updateMany(
      {},
      {
        $pull: {
          story: {
            createdAt: { $lt: twentyFourHoursAgo },
          },
        },
      }
    );
    console.log(
      `Cleaned up expired stories. Modified ${result.modifiedCount} users.`
    );
    return result;
  } catch (error) {
    console.error("Error cleaning up stories:", error);
    throw error;
  }
};

// Pre-save middleware to clean expired stories
userSchema.pre("save", async function (next) {
  const now = new Date();
  this.story = this.story.filter((story) => {
    const storyAge = (now - story.createdAt) / 1000; // Convert to seconds
    return storyAge < 86400; // Keep stories less than 24 hours old
  });
  next();
});

// Set up periodic cleanup task
const cleanupExpiredStories = async () => {
  try {
    await User.cleanAllExpiredStories();
  } catch (error) {
    console.error("Error in periodic cleanup:", error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredStories, 3600000); // 1 hour in milliseconds

const User = mongoose.model("User", userSchema);

module.exports = User;
