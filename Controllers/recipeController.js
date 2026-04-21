// Core imports
import mongoose from "mongoose";
import Recipe from "../Modules/recipeSchema.js";
import Category from "../Modules/categorySchema.js";
import { buildRecipeMatchQuery } from "./categoryController.js";
import cloudinary from "../Config/cloudinary.js";
import streamifier from "streamifier";

// Image upload helper
const uploadToCloudinary = (fileBuffer, folder = "recipes") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Request payload parsers
const parseArrayField = (field, fieldName) => {
  if (field === undefined || field === null || field === "") return [];

  if (Array.isArray(field)) {
    return field.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof field === "string") {
    const trimmed = field.trim();

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);

        if (!Array.isArray(parsed)) {
          throw new Error(`${fieldName} must be an array`);
        }

        return parsed.map((item) => String(item).trim()).filter(Boolean);
      } catch {
        throw new Error(`Invalid ${fieldName} format. Must be a valid array.`);
      }
    }

    // Fallback: comma-separated values
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  throw new Error(`Invalid ${fieldName} format. Must be a valid array.`);
};

// Category sync helper
const updateCategoryCounts = async () => {
  try {
    const categories = await Category.find();

    for (const category of categories) {
      const query = buildRecipeMatchQuery(category.type, category.name);

      const count = await Recipe.countDocuments(query);

      if (category.recipeCount !== count) {
        category.recipeCount = count;
        await category.save();
      }
    }
  } catch (error) {
    console.error("Update Category Counts Error:", error);
  }
};

// Recipe CRUD handlers
export const createRecipe = async (req, res) => {
  try {
    const {
      name,
      description,
      durationMinutes,
      mealCategory,
      cuisine,
      foodType,
    } = req.body;

    const ingredients = parseArrayField(req.body.ingredients, "ingredients");
    const steps = parseArrayField(req.body.steps, "steps");
    const tags = parseArrayField(req.body.tags, "tags");

    if (
      !name?.trim() ||
      !description?.trim() ||
      durationMinutes === undefined ||
      !mealCategory?.trim() ||
      !cuisine?.trim() ||
      !foodType?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one ingredient is required",
      });
    }

    if (steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one step is required",
      });
    }

    let image = "";
    let imagePublicId = "";

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "recipes",
      );
      image = uploadedImage.secure_url;
      imagePublicId = uploadedImage.public_id;
    }

    const recipe = await Recipe.create({
      name: name.trim(),
      description: description.trim(),
      ingredients,
      steps,
      durationMinutes: Number(durationMinutes),

      mealCategory: mealCategory.trim().toLowerCase(),
      cuisine: cuisine.trim().toLowerCase(),
      foodType: foodType.trim().toLowerCase(),
      tags: tags.map((t) => t.toLowerCase()),

      image,
      imagePublicId,
    });

    await updateCategoryCounts();

    return res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe,
    });
  } catch (error) {
    console.error("Create Recipe Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create recipe",
      error: error.message,
    });
  }
};


export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    console.error("Get All Recipes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recipes",
      error: error.message,
    });
  }
};

export const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    return res.status(200).json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("Get Recipe By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recipe",
      error: error.message,
    });
  }
};


export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    if (req.file) {
      if (recipe.imagePublicId) {
        await cloudinary.uploader.destroy(recipe.imagePublicId);
      }

      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "recipes",
      );
      recipe.image = uploadedImage.secure_url;
      recipe.imagePublicId = uploadedImage.public_id;
    }

    if (req.body.name !== undefined) {
      recipe.name = req.body.name.trim();
    }

    if (req.body.description !== undefined) {
      recipe.description = req.body.description.trim();
    }

    if (req.body.durationMinutes !== undefined) {
      recipe.durationMinutes = Number(req.body.durationMinutes);
    }

    if (req.body.mealCategory !== undefined) {
      recipe.mealCategory = req.body.mealCategory.trim().toLowerCase();
    }

    if (req.body.cuisine !== undefined) {
      recipe.cuisine = req.body.cuisine.trim().toLowerCase();
    }

    if (req.body.foodType !== undefined) {
      recipe.foodType = req.body.foodType.trim().toLowerCase();
    }

    if (req.body.tags !== undefined) {
      const parsedTags = parseArrayField(req.body.tags, "tags");
      recipe.tags = parsedTags.map((t) => t.toLowerCase());
    }

    if (req.body.ingredients !== undefined) {
      const parsedIngredients = parseArrayField(
        req.body.ingredients,
        "ingredients",
      );

      if (parsedIngredients.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one ingredient is required",
        });
      }

      recipe.ingredients = parsedIngredients;
    }

    if (req.body.steps !== undefined) {
      const parsedSteps = parseArrayField(req.body.steps, "steps");

      if (parsedSteps.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one step is required",
        });
      }

      recipe.steps = parsedSteps;
    }

    if (req.body.tags !== undefined) {
      recipe.tags = parseArrayField(req.body.tags, "tags");
    }

    await recipe.save();
    await updateCategoryCounts();

    return res.status(200).json({
      success: true,
      message: "Recipe updated successfully",
      recipe,
    });
  } catch (error) {
    console.error("Update Recipe Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update recipe",
      error: error.message,
    });
  }
};


export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    if (recipe.imagePublicId) {
      await cloudinary.uploader.destroy(recipe.imagePublicId);
    }

    await recipe.deleteOne();
    await updateCategoryCounts();

    return res.status(200).json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error("Delete Recipe Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete recipe",
      error: error.message,
    });
  }
};

// Recipe search handler
export const searchRecipes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const recipes = await Recipe.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { mealCategory: { $regex: q, $options: "i" } },
        { cuisine: { $regex: q, $options: "i" } },
        { foodType: { $regex: q, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    console.error("Search Recipes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search recipes",
      error: error.message,
    });
  }
};
