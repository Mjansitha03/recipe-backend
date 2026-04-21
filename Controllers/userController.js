// Core imports
import mongoose from "mongoose";
import User from "../Modules/userSchema.js";
import Favorite from "../Modules/favoriteSchema.js";
import Review from "../Modules/reviewSchema.js";

// Shared projection fields
const recipeSelectFields =
  "name description ingredients steps durationMinutes mealCategory cuisine foodType tags image imagePublicId createdAt updatedAt";

// Profile management handlers
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const user = await User.findById(userId).select(
      "name email phone role isBlocked isSeedData createdAt updatedAt",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile fetched successfully", user });
  } catch (error) {
    console.error("Get My Profile Error:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch profile",
        error: error.message,
      });
  }
};


export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, phone } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const updates = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Name must be between 2 and 50 characters",
          });
      }
      updates.name = trimmedName;
    }

    if (phone !== undefined) {
      const trimmedPhone = phone.trim();
      if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid phone number" });
      }
      updates.phone = trimmedPhone;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide name or phone to update",
        });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      returnDocument: "after", // ✅ Mongoose 7 update
      runValidators: true,
    }).select("name email phone role isBlocked isSeedData createdAt updatedAt");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
  } catch (error) {
    console.error("Update My Profile Error:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
  }
};

// User activity handlers
export const getMyFavoriteRecipes = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });

    const favorites = await Favorite.find({ user: userId })
      .populate({ path: "recipe", select: recipeSelectFields })
      .sort({ createdAt: -1 });

    const validFavorites = favorites.filter((fav) => fav.recipe);

    return res
      .status(200)
      .json({
        success: true,
        message: "My favorite recipes fetched successfully",
        count: validFavorites.length,
        favorites: validFavorites,
      });
  } catch (error) {
    console.error("Get My Favorite Recipes Error:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch favorite recipes",
        error: error.message,
      });
  }
};


export const getMyOwnReviews = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });

    const reviews = await Review.find({ user: userId })
      .populate("recipe", "name image")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({
        success: true,
        message: "My reviews fetched successfully",
        count: reviews.length,
        reviews,
      });
  } catch (error) {
    console.error("Get My Own Reviews Error:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch reviews",
        error: error.message,
      });
  }
};

// User dashboard handler
export const getMyDashboard = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });

    const [user, favorites, reviews] = await Promise.all([
      User.findById(userId).select(
        "name email phone role isBlocked isSeedData createdAt updatedAt",
      ),
      Favorite.find({ user: userId })
        .populate({ path: "recipe", select: recipeSelectFields })
        .sort({ createdAt: -1 }),
      Review.find({ user: userId })
        .populate("recipe", "name image")
        .sort({ createdAt: -1 }),
    ]);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const validFavorites = favorites.filter((fav) => fav.recipe);

    return res.status(200).json({
      success: true,
      message: "User dashboard fetched successfully",
      user,
      favorites: validFavorites,
      favoriteCount: validFavorites.length,
      reviews,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error("Get My Dashboard Error:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch user dashboard",
        error: error.message,
      });
  }
};



