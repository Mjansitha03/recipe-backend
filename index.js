import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoute from "./Routers/authRoute.js"
import recipeRoute from "./Routers/recipeRoute.js";
import categoryRoute from "./Routers/categoryRoute.js";
import favoriteRoute from "./Routers/favoriteRoute.js";
import reviewRoute from "./Routers/reviewRoute.js";
import adminReviewRoute from "./Routers/adminReviewRoute.js";
import adminUserRoute from "./Routers/adminUserRoute.js";
import adminRoute from "./Routers/adminRoute.js";
import userRoute from "./Routers/userRoute.js";
import connectDB from "./Database/dbConfig.js";

//dotenv configuration
dotenv.config();

//express initialization
const app = express();

//default middleware
app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

//Database connection
connectDB();

//Default Route
app.get("/", (req, res) =>{
    res.status(200).send(`<h1 style="text-align:center;">Welcome to API<h1>`);
});

//Custom routes
app.use("/api/auth", authRoute);
app.use("/api/recipes", recipeRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/favorites", favoriteRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/admin/reviews", adminReviewRoute);
app.use("/api/admin/users", adminUserRoute);
app.use("/api/admin", adminRoute);
app.use("/api/users", userRoute);

//Port
const port = process.env.PORT;

//server starting logic
app.listen(port, () =>{
    console.log("Server Started port " + port);
    
})