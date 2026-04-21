// Core imports
import mongoose from "mongoose";
import Favorite from "../Modules/favoriteSchema.js";
import Recipe from "../Modules/recipeSchema.js";

// Shared projection fields
const recipeSelectFields =
  "name description ingredients steps durationMinutes mealCategory cuisine foodType tags image imagePublicId createdAt updatedAt";

// Favorite listing and status handlers
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: "recipe",
        select: recipeSelectFields,
      })
      .sort({ createdAt: -1 });

    const validFavorites = favorites.filter((fav) => fav.recipe);

    return res.status(200).json({
      success: true,
      message: "Favorites fetched successfully",
      count: validFavorites.length,
      favorites: validFavorites,
    });
  } catch (error) {
    console.error("Get Favorites Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
      error: error.message,
    });
  }
};


export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Recipe ID is required",
      });
    }

    const favorite = await Favorite.findOne({
      user: userId,
      recipe: recipeId,
    }).select("_id");

    return res.status(200).json({
      success: true,
      isFavorite: !!favorite,
    });
  } catch (error) {
    console.error("Check Favorite Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check favorite status",
      error: error.message,
    });
  }
};

// Favorite mutation handlers
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { recipeId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Recipe ID is required",
      });
    }

    const recipeExists = await Recipe.findById(recipeId).select("_id");
    if (!recipeExists) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    const existingFavorite = await Favorite.findOne({
      user: userId,
      recipe: recipeId,
    });

    // REMOVE if already exists
    if (existingFavorite) {
      await Favorite.findByIdAndDelete(existingFavorite._id);

      return res.status(200).json({
        success: true,
        message: "Recipe removed from favorites",
        isFavorite: false,
        recipeId,
      });
    }

    const favorite = await Favorite.create({
      user: userId,
      recipe: recipeId,
    });

    const populatedFavorite = await Favorite.findById(favorite._id).populate({
      path: "recipe",
      select: recipeSelectFields,
    });

    return res.status(201).json({
      success: true,
      message: "Recipe added to favorites",
      isFavorite: true,
      recipeId,
      favorite: populatedFavorite,
    });
  } catch (error) {
    console.error("Toggle Favorite Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Recipe already in favorites",
        isFavorite: true,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to toggle favorite",
      error: error.message,
    });
  }
};


export const addFavorite = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { recipeId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Recipe ID is required",
      });
    }

    const recipeExists = await Recipe.findById(recipeId).select("_id");
    if (!recipeExists) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    const existingFavorite = await Favorite.findOne({
      user: userId,
      recipe: recipeId,
    }).populate({
      path: "recipe",
      select: recipeSelectFields,
    });

    if (existingFavorite) {
      return res.status(200).json({
        success: true,
        message: "Recipe already in favorites",
        isFavorite: true,
        recipeId,
        favorite: existingFavorite,
      });
    }

    const favorite = await Favorite.create({
      user: userId,
      recipe: recipeId,
    });

    const populatedFavorite = await Favorite.findById(favorite._id).populate({
      path: "recipe",
      select: recipeSelectFields,
    });

    return res.status(201).json({
      success: true,
      message: "Recipe added to favorites",
      isFavorite: true,
      recipeId,
      favorite: populatedFavorite,
    });
  } catch (error) {
    console.error("Add Favorite Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Recipe already in favorites",
        isFavorite: true,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add favorite",
      error: error.message,
    });
  }
};


export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Recipe ID is required",
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      recipe: recipeId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
        isFavorite: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recipe removed from favorites",
      isFavorite: false,
      recipeId,
    });
  } catch (error) {
    console.error("Remove Favorite Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove favorite",
      error: error.message,
    });
  }
};


