const express = require("express");
require("../db/mongoose");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});

    if (users.length === 0) {
      return res.status(404).send({ message: "Please add some users first" });
    }

    res.send(users);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get("/user/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user.length === 0) {
      return res.status(404).send({ message: "Please add some users first" });
    }

    res.send(user);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get("/users/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne(req.user._id);

    if (!user) {
      throw new Error({ message: "User not found" });
    }

    if (user.length === 0) {
      return res.status(404).send({ message: "Please add some users first" });
    }

    res.send(user);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.post("/user/save/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new Error({ message: "User not found" });
    }

    if (user.length === 0) {
      return res.status(404).send({ message: "Please add some users first" });
    }

    const postIndex = user.saved.findIndex(
      (post) => post.postId.toString() === req.params.id.toString()
    );

    if (postIndex === -1) {
      user.saved.push({ postId: req.params.id });
    } else {
      res.status(400).send({ message: "You have already saved the post" });
    }

    await user.save();

    res.send(user);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get("/user/saved/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const isSaved = user.saved.some(
      (post) => post.postId.toString() === req.params.id.toString()
    );

    if (isSaved) {
      return res.status(200).send({ message: true });
    } else {
      return res.status(404).send({ message: false });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post("/user/unsave/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const postIndex = user.saved.findIndex(
      (post) => post.postId.toString() === req.params.id.toString()
    );

    if (postIndex === -1) {
      return res.status(404).send({ message: "Post not found in saved list" });
    }

    // Remove the post from the saved list
    user.saved.splice(postIndex, 1);
    await user.save();

    res.send({ message: "Post unsaved successfully", saved: user.saved });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post("/user/follow/:userId", authMiddleware, async (req, res) => {
  try {
    const [userFollowed, authedUser] = await Promise.all([
      User.findById(req.params.userId),
      User.findById(req.user._id),
    ]);

    if (!userFollowed || !authedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    if (
      authedUser.following.some(
        (f) => f.userId.toString() === req.params.userId
      )
    ) {
      throw new Error("You are already following this user");
    }

    authedUser.following.push({ userId: req.params.userId });
    await authedUser.save();

    userFollowed.followers.push({ userId: req.user._id });
    await userFollowed.save();

    res.send({
      message: "Followed successfully",
      following: authedUser.following,
      followers: authedUser.followers,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get("/user/isfollowing/:userId", authMiddleware, async (req, res) => {
  try {
    const authedUser = await User.findById(req.user._id);

    if (!authedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    if (
      authedUser.following.some(
        (f) => f.userId.toString() === req.params.userId
      )
    ) {
      return res.send({ following: true });
    }

    res.send({ following: false });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.post("/user/unfollow/:userId", authMiddleware, async (req, res) => {
  try {
    const [userUnfollowed, authedUser] = await Promise.all([
      User.findById(req.params.userId),
      User.findById(req.user._id),
    ]);

    // Check if either user doesn't exist
    if (!userUnfollowed || !authedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if trying to unfollow self
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).send({ message: "Cannot unfollow yourself" });
    }

    // Check if already not following
    const isFollowing = authedUser.following.some(
      (f) => f.userId.toString() === req.params.userId
    );

    if (!isFollowing) {
      return res
        .status(400)
        .send({ message: "You are not following this user" });
    }

    // Update the followers list of the user being unfollowed
    userUnfollowed.followers = userUnfollowed.followers.filter(
      (follower) => follower.userId.toString() !== req.user._id.toString()
    );
    await userUnfollowed.save();

    // Update the following list of the authenticated user
    authedUser.following = authedUser.following.filter(
      (follow) => follow.userId.toString() !== req.params.userId.toString()
    );
    await authedUser.save();

    res.send({
      message: "Unfollowed successfully",
      following: authedUser.following,
      followers: userUnfollowed.followers,
    });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).send({ message: "Server error while unfollowing user" });
  }
});

router.get("/user/search/:searchedQuery", authMiddleware, async (req, res) => {
  try {
    const searchQuery = req.params.searchedQuery;

    // Create a case-insensitive regular expression for the search
    const searchRegex = new RegExp(searchQuery, "i");

    // Find users where either username or name matches the search query
    const users = await User.find({
      $or: [{ username: searchRegex }, { name: searchRegex }],
    })
      .select("_id userName name profilePic followers") // Added _id to selection
      .limit(10);

    if (!users.length) {
      return res.status(200).json({
        success: true,
        message: "No users found",
        users: [],
      });
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching for users",
      error: error.message,
    });
  }
});

router.get("/users/story", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the logged-in user and populate following users
    const loggedInUser = await User.findById(userId).populate({
      path: "following.userId",
      select: "story name userName profilePic",
      // Only populate users who have stories
      match: {
        story: { $exists: true, $not: { $size: 0 } },
      },
    });

    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!loggedInUser.following || loggedInUser.following.length === 0) {
      return res
        .status(404)
        .json({ message: "You are not following any users." });
    }

    // Group stories by user
    const groupedStories = loggedInUser.following
      .filter((follow) => follow.userId && follow.userId.story) // Ensure both userId and story exist
      .map((follow) => {
        const { story, userName, name, profilePic, _id } = follow.userId;

        // Check if story is an array before processing
        if (!Array.isArray(story)) {
          return null;
        }

        // Create user object with their stories array
        return {
          userId: _id,
          userName,
          name,
          profilePic,
          stories: story.map((storyItem) => ({
            storyId: storyItem._id,
            content: storyItem.story, // The actual story content
            text: storyItem.text,
            createdAt: storyItem.createdAt,
          })),
        };
      })
      .filter(Boolean); // Remove any null entries

    if (groupedStories.length === 0) {
      return res.status(404).json({
        message: "No stories found from users you follow.",
      });
    }

    // Sort users by their most recent story
    groupedStories.sort((a, b) => {
      const aLatest = Math.max(...a.stories.map((s) => new Date(s.createdAt)));
      const bLatest = Math.max(...b.stories.map((s) => new Date(s.createdAt)));
      return bLatest - aLatest;
    });

    // Sort stories within each user's array by creation date (newest first)
    groupedStories.forEach((user) => {
      user.stories.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    });

    res.status(200).json({
      users: groupedStories,
      totalUsers: groupedStories.length,
      totalStories: groupedStories.reduce(
        (sum, user) => sum + user.stories.length,
        0
      ),
    });
  } catch (error) {
    console.error("Error retrieving stories:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
