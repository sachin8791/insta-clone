const mongoose = require("mongoose");
require("../db/mongoose");
const validator = require("validator");

// Story schema with 24-hour deletion
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
  },
});

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

// Enhanced static method with detailed logging
userSchema.statics.cleanAllExpiredStories = async function () {
  console.log("\n🔄 ==== STORY CLEANUP STARTING ==== 🔄");
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  console.log("Checking for stories older than:", twentyFourHoursAgo);

  try {
    // Find all users with their stories before cleanup
    const beforeCleanup = await this.find({}).select("userName story");
    console.log("\n📊 Before cleanup status:");
    console.log({
      totalUsers: beforeCleanup.length,
      usersWithStories: beforeCleanup.filter((u) => u.story.length > 0).length,
      storyCounts: beforeCleanup.map((u) => ({
        userName: u.userName,
        storyCount: u.story.length,
        oldestStory: u.story.length > 0 ? u.story[0].createdAt : "No stories",
      })),
    });

    // Find users with expired stories
    const usersWithExpiredStories = await this.find({
      "story.createdAt": { $lt: twentyFourHoursAgo },
    }).select("userName story");

    console.log("\n🕒 Users with expired stories:");
    usersWithExpiredStories.forEach((user) => {
      const expiredCount = user.story.filter(
        (s) => s.createdAt < twentyFourHoursAgo
      ).length;
      console.log(`- ${user.userName}: ${expiredCount} expired stories`);
    });

    // Perform the cleanup
    const result = await this.updateMany(
      { "story.createdAt": { $lt: twentyFourHoursAgo } },
      {
        $pull: {
          story: {
            createdAt: { $lt: twentyFourHoursAgo },
          },
        },
      }
    );

    // Get status after cleanup
    const afterCleanup = await this.find({}).select("userName story");

    console.log("\n🧹 Cleanup results:");
    console.log({
      modifiedUsers: result.modifiedCount,
      matchedUsers: result.matchedCount,
      timestamp: new Date().toISOString(),
      remainingStories: afterCleanup.reduce(
        (acc, user) => acc + user.story.length,
        0
      ),
    });

    console.log("==== STORY CLEANUP FINISHED ==== \n");
    return result;
  } catch (error) {
    console.error("\n❌ CLEANUP ERROR:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// Enhanced pre-save middleware with logging
userSchema.pre("save", async function (next) {
  console.log("\n👤 ==== USER SAVE STORY CHECK ====");
  const now = new Date();
  const originalStoryCount = this.story.length;

  this.story = this.story.filter((story) => {
    const storyAge = (now - story.createdAt) / 1000;
    return storyAge < 86400; // 24 hours
  });

  const removedCount = originalStoryCount - this.story.length;

  if (removedCount > 0) {
    console.log("Pre-save story cleanup:", {
      userName: this.userName,
      originalCount: originalStoryCount,
      remainingCount: this.story.length,
      removedCount,
      timestamp: new Date().toISOString(),
    });
  }
  console.log("==== USER SAVE CHECK FINISHED ====\n");
  next();
});

// Run cleanup every 1 hour with enhanced logging
setInterval(async () => {
  console.log("\n⏰ ==== SCHEDULED CLEANUP STARTING ====");
  try {
    const User = mongoose.model("User");
    const result = await User.cleanAllExpiredStories();
    console.log("Scheduled cleanup completed:", {
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("Scheduled cleanup error:", {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
  console.log("==== SCHEDULED CLEANUP FINISHED ====\n");
}, 3600000); // 1 hour

const User = mongoose.model("User", userSchema);

module.exports = User;
