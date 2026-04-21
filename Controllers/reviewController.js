// Core imports
import mongoose from "mongoose";
import Review from "../Modules/reviewSchema.js";
import Recipe from "../Modules/recipeSchema.js"; // <-- use your actual recipe file name consistently

// Review submission handlers
export const createReview = async (req, res) => {
  try {
    const { recipe, rating, comment } = req.body;

    if (!recipe || !rating) {
      return res.status(400).json({
        success: false,
        message: "Recipe and rating are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(recipe)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const existingRecipe = await Recipe.findOne({
      _id: recipe,
      approvalStatus: "approved",
    });

    if (!existingRecipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found or not approved",
      });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      recipe,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this recipe",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      recipe,
      rating: numericRating,
      comment: comment?.trim() || "",
      isApproved: false,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully. Waiting for admin approval.",
      review,
    });
  } catch (error) {
    console.error("Create Review Error:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this recipe",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

// Public review listing handlers
export const getApprovedReviewsByRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const reviews = await Review.find({
      recipe: recipeId,
      isApproved: true,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error("Get Approved Reviews By Recipe Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// User review management handlers
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("recipe", "name image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get My Reviews Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your reviews",
      error: error.message,
    });
  }
};


export const deleteMyReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
      });
    }

    await Review.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Your review deleted successfully",
    });
  } catch (error) {
    console.error("Delete My Review Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete your review",
      error: error.message,
    });
  }
};


