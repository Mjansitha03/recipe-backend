// Model imports
import Recipe from "../Modules/recipeSchema.js"
import Category from "../Modules/categorySchema.js"
import Review from "../Modules/reviewSchema.js"
import User from "../Modules/userSchema.js"

// Admin dashboard analytics
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalRecipes,
      totalCategories,
      totalReviews,
      pendingReviews,
      totalUsers,
      blockedUsers,
    ] = await Promise.all([
      Recipe.countDocuments(),
      Category.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({ isApproved: false }),
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
    ]);

    const recentRecipes = await Recipe.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name createdAt");

    const recentReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name")
      .populate("recipe", "name")
      .select("rating comment isApproved createdAt");

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role isBlocked createdAt");

    res.status(200).json({
      success: true,
      stats: {
        totalRecipes,
        totalCategories,
        totalReviews,
        pendingReviews,
        totalUsers,
        blockedUsers,
      },
      recentRecipes,
      recentReviews,
      recentUsers,
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};


