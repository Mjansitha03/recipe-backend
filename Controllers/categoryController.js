// Core imports
import mongoose from "mongoose";
import Category from "../Modules/categorySchema.js";
import Recipe from "../Modules/recipeSchema.js";

// Shared category constants
const CATEGORY_TYPES = ["meal", "cuisine", "foodType", "tag"];

// Shared normalization helpers
const normalizeText = (value = "") => String(value).trim().toLowerCase();

const generateSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const toSafeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const toSafeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Category-to-recipe query helpers
export const buildRecipeMatchQuery = (type, name) => {
  if (!name) return {};

  const safeName = name.trim();
  const regex = new RegExp(`^${escapeRegex(safeName)}$`, "i");

  switch (type) {
    case "meal":
      return {
        $or: [
          { mealCategory: { $regex: regex } },
          { strCategory: { $regex: regex } }, // 🔥 FIX
          { category: { $regex: regex } }, // 🔥 FIX (optional)
        ],
      };

    case "cuisine":
      return {
        $or: [
          { cuisine: { $regex: regex } },
          { strArea: { $regex: regex } }, // 🔥 FIX
        ],
      };

    case "foodType":
      return {
        $or: [
          { foodType: { $regex: regex } },
          { type: { $regex: regex } }, // 🔥 FIX
        ],
      };

    case "tag":
      return {
        tags: { $in: [regex] },
      };

    default:
      return {};
  }
};

const getRecipeCountByCategory = async (type, name) => {
  const query = buildRecipeMatchQuery(type, name);
  return Recipe.countDocuments(query);
};

const buildRecipeQueryFromCategory = (category) => {
  return buildRecipeMatchQuery(category.type, category.name);
};

// Category validation and payload helpers
const findDuplicateCategory = async ({
  name,
  slug,
  type,
  excludeId = null,
}) => {
  const nameFilter = excludeId
    ? { _id: { $ne: excludeId }, name, type }
    : { name, type };

  const duplicateByName = await Category.findOne(nameFilter).collation({
    locale: "en",
    strength: 2,
  });

  if (duplicateByName) return duplicateByName;

  const slugFilter = excludeId ? { _id: { $ne: excludeId }, slug } : { slug };
  return Category.findOne(slugFilter);
};

const parseCategoryPayload = (body = {}, existingCategory = null) => {
  const name =
    body.name !== undefined
      ? normalizeText(body.name).toLowerCase()
      : existingCategory?.name;

  const slug =
    body.slug !== undefined
      ? generateSlug(body.slug)
      : generateSlug(name || existingCategory?.name || "");

  const type = body.type !== undefined ? body.type : existingCategory?.type;

  return {
    name,
    slug,
    type,
    description:
      body.description !== undefined
        ? normalizeText(body.description)
        : existingCategory?.description || "",
    icon:
      body.icon !== undefined
        ? normalizeText(body.icon)
        : existingCategory?.icon || "",
    isFeatured:
      body.isFeatured !== undefined
        ? toSafeBoolean(body.isFeatured, existingCategory?.isFeatured ?? false)
        : (existingCategory?.isFeatured ?? false),
    isActive:
      body.isActive !== undefined
        ? toSafeBoolean(body.isActive, existingCategory?.isActive ?? true)
        : (existingCategory?.isActive ?? true),
    sortOrder:
      body.sortOrder !== undefined
        ? toSafeNumber(body.sortOrder, existingCategory?.sortOrder ?? 0)
        : (existingCategory?.sortOrder ?? 0),
  };
};

// Public category listing handlers
export const getGroupedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select(
        "_id name slug type icon sortOrder recipeCount isFeatured isActive",
      )
      .sort({ sortOrder: 1, name: 1 });

    const grouped = {
      mealCategories: [],
      cuisines: [],
      foodTypes: [],
      tags: [],
    };

    for (const category of categories) {
      const item = {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        icon: category.icon || "",
        sortOrder: category.sortOrder || 0,
        recipeCount: category.recipeCount || 0,
        isFeatured: category.isFeatured,
        isActive: category.isActive,
      };

      if (category.type === "meal") grouped.mealCategories.push(item);
      if (category.type === "cuisine") grouped.cuisines.push(item);
      if (category.type === "foodType") grouped.foodTypes.push(item);
      if (category.type === "tag") grouped.tags.push(item);
    }

    return res.status(200).json({
      success: true,
      categories: grouped,
    });
  } catch (error) {
    console.error("Get Grouped Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch grouped categories",
      error: error.message,
    });
  }
};

// Category sync helpers
export const syncCategoryRecipeCount = async (categoryId) => {
  if (!isValidObjectId(categoryId)) return null;

  const category = await Category.findById(categoryId);
  if (!category) return null;

  const recipeCount = await getRecipeCountByCategory(
    category.type,
    category.name,
  );

  category.recipeCount = recipeCount;
  await category.save();

  return category;
};


export const syncAllCategoryRecipeCounts = async (req, res) => {
  try {
    const categories = await Category.find();

    const updatedCategories = await Promise.all(
      categories.map(async (category) => {
        const recipeCount = await getRecipeCountByCategory(
          category.type,
          category.name,
        );
        category.recipeCount = recipeCount;
        await category.save();
        return category;
      }),
    );

    return res.status(200).json({
      success: true,
      message: "All category recipe counts synced successfully",
      count: updatedCategories.length,
      categories: updatedCategories,
    });
  } catch (error) {
    console.error("Sync All Category Recipe Counts Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync category recipe counts",
      error: error.message,
    });
  }
};

// Category CRUD handlers
export const createCategory = async (req, res) => {
  try {
    const payload = parseCategoryPayload(req.body);

    if (!payload.name || !payload.type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    if (!CATEGORY_TYPES.includes(payload.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category type",
      });
    }

    const duplicate = await findDuplicateCategory({
      name: payload.name,
      slug: payload.slug,
      type: payload.type,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Category with same name/type or slug already exists",
      });
    }

    payload.recipeCount = await getRecipeCountByCategory(
      payload.type,
      payload.name,
    );

    const category = await Category.create(payload);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category name/type or slug already exists",
      });
    }

    if (error.name === "ValidationError") {
      const firstError =
        Object.values(error.errors || {})[0]?.message || "Validation failed";

      return res.status(400).json({
        success: false,
        message: firstError,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};


export const getAllCategories = async (req, res) => {
  try {
    const { type, featured, active } = req.query;
    const query = {};

    if (type) {
      if (!CATEGORY_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category type filter",
        });
      }
      query.type = type;
    }

    if (featured !== undefined) query.isFeatured = featured === "true";
    if (active !== undefined) query.isActive = active === "true";

    const categories = await Category.find(query).sort({
      sortOrder: 1,
      createdAt: -1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get All Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};


export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get Category By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};


export const getCategoryBySlug = async (req, res) => {
  try {
    const slug = generateSlug(req.params.slug);

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get Category By Slug Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const payload = parseCategoryPayload(req.body, existingCategory);

    if (!payload.name || !payload.type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    if (!CATEGORY_TYPES.includes(payload.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category type",
      });
    }

    const duplicate = await findDuplicateCategory({
      name: payload.name,
      slug: payload.slug,
      type: payload.type,
      excludeId: id,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Another category with same name/type or slug already exists",
      });
    }

    payload.recipeCount = await getRecipeCountByCategory(
      payload.type,
      payload.name,
    );

    const updatedCategory = await Category.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category name/type or slug already exists",
      });
    }

    if (error.name === "ValidationError") {
      const firstError =
        Object.values(error.errors || {})[0]?.message || "Validation failed";

      return res.status(400).json({
        success: false,
        message: firstError,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};


export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const usedInRecipes = await getRecipeCountByCategory(
      category.type,
      category.name,
    );

    if (usedInRecipes > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${usedInRecipes} recipe(s) are using this category.`,
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

// Category recipe lookup handlers
export const getRecipesByCategorySlug = async (req, res) => {
  try {
    const slug = generateSlug(req.params.slug);

    const category = await Category.findOne({
      slug,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    const query = buildRecipeQueryFromCategory(category);
    const recipes = await Recipe.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      category,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    console.error("Get Recipes By Category Slug Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recipes for category",
      error: error.message,
    });
  }
};


export const getRecipesByCategory = async (req, res) => {
  console.log(req.params);
  try {
    const { type, value } = req.query;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        message: "Type and name are required",
      });
    }

    const query = buildRecipeMatchQuery(type, value);

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    console.error("Get Recipes By Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recipes",
    });
  }
};
