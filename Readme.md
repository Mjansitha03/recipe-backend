# Recipe Backend API

A production-style Node.js and Express backend for a recipe application. This service provides authentication, recipe management, category management, favorites, reviews, user profile features, and admin operations through a RESTful API backed by MongoDB.

## Overview

The API is designed to support a recipe platform where:

- Users can register, sign in, manage their profiles, save favorite recipes, and submit reviews.
- Public clients can browse recipes, categories, and approved reviews.
- Admins can manage users, moderate reviews, maintain categories, create or update recipes, and view dashboard statistics.
- Media uploads are handled with Multer and stored in Cloudinary.
- Password reset is supported through tokenized email workflows using Nodemailer.

## Key Features

- JWT-based authentication and role-based authorization
- User registration, login, forgot password, token verification, and password reset
- Recipe CRUD operations with image upload support
- Category CRUD operations with automatic recipe count syncing
- Favorite recipe management
- Review submission and admin approval workflow
- User profile and dashboard endpoints
- Admin analytics and moderation tools
- MongoDB seeding support for sample recipes, users, reviews, and favorites

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- Cloudinary
- Nodemailer
- CORS
- dotenv

## Project Structure

```text
recipe-backend/
|-- Config/
|-- Controllers/
|-- Database/
|-- Midddlewares/
|-- Modules/
|-- Routers/
|-- Utils/
|-- index.js
|-- package.json
`-- Readme.md
```

## API Base URL

Local development base URL:

http://localhost:3000/api


## Environment Variables

Create a `.env` file in the project root and configure the following values:

```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
```

### Environment Variable Notes

- `PORT`: Port used by the Express server.
- `MONGODB_URL`: MongoDB connection string.
- `JWT_SECRET`: Secret used to sign and verify JWT tokens.
- `CLIENT_URL`: Frontend URL used for CORS and password reset links.
- `CLOUDINARY_*`: Cloudinary credentials for recipe image uploads.
- `EMAIL_USER` and `EMAIL_PASS`: Gmail credentials or app password used by Nodemailer.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/recipe-frontend.git
   cd recipe-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

Runs the server with Nodemon for development.


## Application Flow

### Authentication

- Users register with `name`, `email`, `phone`, and `password`.
- Passwords are hashed using `bcrypt`.
- Successful login returns a JWT token.
- Protected routes require an `Authorization` header:

```http
Authorization: Bearer <token>
```

### Authorization

- `protect` middleware validates the JWT and attaches the user to the request.
- `authorizeRoles("admin")` restricts selected routes to admin users only.
- Blocked users are denied access even if they present a valid token.

### File Uploads

- Image uploads use Multer memory storage.
- Only image MIME types are accepted.
- Maximum upload size is 5 MB.
- Uploaded files are stored in Cloudinary.

### Password Reset

- Users can request a password reset by email.
- A temporary token is generated, hashed, stored, and emailed.
- Reset links expire after 2 minutes in the current implementation.


## API Endpoints

### Root

| Method | Endpoint | Description          | Access |
|--------|----------|----------------------|--------|
| `GET`  | `/`      | Health/welcome route | Public |

### Auth Routes

Base path: `/api/auth`

| Method | Endpoint                     | Description                         | Access |
|--------|------------------------------|-------------------------------------|--------|
| `POST` | `/sign-up`                   | Register a new user                 | Public |
| `POST` | `/sign-in`                   | Authenticate user and receive token | Public |
| `POST` | `/forgot-password`           | Request password reset email        | Public |
| `GET`  | `/verify-reset/:id/:token`   | Verify reset token                  | Public |
| `POST` | `/reset-password/:id/:token` | Reset password                      | Public |

### Recipe Routes

Base path: `/api/recipes`

| Method   | Endpoint                             | Description                | Access |
|----------|--------------------------------------|----------------------------|--------|
| `GET`    | `/`                                  | Get all recipes            | Public |
| `GET`    | `/search?q=value`                    | Search recipes             | Public |
| `GET`    | `/by-category?type=value&value=name` | Filter recipes by category | Public |
| `GET`    | `/:id`                               | Get recipe by ID           | Public |
| `POST`   | `/create`                            | Create a new recipe        | Admin  |
| `PUT`    | `/update/:id`                        | Update a recipe            | Admin  |
| `DELETE` | `/delete/:id`                        | Delete a recipe            | Admin  |

### Category Routes

Base path: `/api/categories`

| Method   | Endpoint              | Description                        | Access |
|----------|-----------------------|------------------------------------|--------|
| `GET`    | `/grouped`            | Get grouped active categories      | Public |
| `GET`    | `/`                   | Get all categories                 | Public |
| `GET`    | `/slug/:slug`         | Get category by slug               | Public |
| `GET`    | `/slug/:slug/recipes` | Get recipes by category slug       | Public |
| `GET`    | `/:id`                | Get category by ID                 | Public |
| `POST`   | `/create`             | Create category                    | Admin  |
| `PUT`    | `/:id`                | Update category                    | Admin  |
| `DELETE` | `/:id`                | Delete category                    | Admin  |
| `PATCH`  | `/sync-recipe-counts` | Recalculate category recipe counts | Admin  |

### Favorite Routes

Base path: `/api/favorites`

| Method   | Endpoint           | Description                  | Access        |
|----------|--------------------|------------------------------|---------------|
| `GET`    | `/`                | Get current user favorites   | Authenticated |
| `GET`    | `/check/:recipeId` | Check if recipe is favorited | Authenticated |
| `POST`   | `/toggle`          | Toggle favorite state        | Authenticated |
| `POST`   | `/`                | Add recipe to favorites      | Authenticated |
| `DELETE` | `/:recipeId`       | Remove recipe from favorites | Authenticated |

### Review Routes

Base path: `/api/reviews`

| Method   |  Endpoint           | Description                       | Access        |
|----------|---------------------|-----------------------------------|---------------|
| `GET`    | `/recipe/:recipeId` | Get approved reviews for a recipe | Public        |
| `POST`   | `/create`           | Submit a review                   | Authenticated |
| `GET`    | `/my`               | Get current user reviews          | Authenticated |
| `DELETE` | `/my/:id`           | Delete current user review        | Authenticated |

### User Routes

Base path: `/api/users`

| Method| Endpoint        | Description                       | Access        |
|-------|-----------------|-----------------------------------|---------------|
| `GET` | `/dashboard`    | Get current user dashboard        | Authenticated |
| `GET` | `/me`           | Get current user profile          | Authenticated |
| `PUT` | `/me`           | Update current user profile       | Authenticated |
| `GET` | `/me/favorites` | Get current user favorite recipes | Authenticated |
| `GET` | `/me/reviews`   | Get current user reviews          | Authenticated |

### Admin Dashboard Routes

Base path: `/api/admin`

| Method | Endpoint     | Description                    | Access|
|--------|--------------|--------------------------------|-------|
| `GET`  | `/dashboard` | Get admin dashboard statistics | Admin |

### Admin User Routes

Base path: `/api/admin/users`

| Method   | Endpoint           | Description         | Access|
|----------|--------------------|---------------------|-------|
| `GET`    | `/stats`           | Get user statistics | Admin |
| `GET`    | `/`                | Get all users       | Admin |
| `GET`    | `/:userId`         | Get user by ID      | Admin |
| `PUT`    | `/:userId/role`    | Update user role    | Admin |
| `PUT`    | `/:userId/block`   | Block a user        | Admin |
| `PUT`    | `/:userId/unblock` | Unblock a user      | Admin |
| `DELETE` | `/:userId`         | Delete a user       | Admin |

### Admin Review Routes

Base path: `/api/admin/reviews`

| Method   | Endpoint       | Description            | Access|
|----------|----------------|------------------------|-------|
| `GET`    | `/`            | Get all reviews        | Admin |
| `GET`    | `/pending`     | Get unapproved reviews | Admin |
| `PUT`    | `/approve/:id` | Approve a review       | Admin |
| `DELETE` | `/delete/:id`  | Delete a review        | Admin |


## Validation and Business Rules

- Email must be unique and valid.
- Phone numbers must match the configured pattern.
- Passwords must be at least 6 characters long.
- Recipe ingredients and steps must contain at least one valid item.
- Ratings must be between 1 and 5.
- A user can submit only one review per recipe.
- Reviews require admin approval before appearing in public review listings.
- Favorite records are unique per user and recipe.
- Seed admin accounts have extra protection in admin workflows.

## Admin Capabilities

- View aggregate dashboard metrics
- Review recent users, recipes, and reviews
- Create, update, and delete recipes
- Create, update, and delete categories
- Re-sync category recipe counts
- View all users
- Change user roles
- Block and unblock users
- Delete non-protected users
- Review and approve pending reviews

## Error Handling

The API returns JSON responses in a consistent format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Some responses may also include:

```json
{
  "error": "Detailed error message"
}
```

## Security Notes

- Store secrets only in environment variables.
- Use strong values for `JWT_SECRET`.
- Use Gmail app passwords instead of your normal email password when possible.
- Restrict `CLIENT_URL` to trusted frontend origins.
- Protect admin credentials carefully.
- Use HTTPS in production.

## Deployment Recommendations

- Set production-safe environment variables.
- Use a managed MongoDB deployment such as MongoDB Atlas.
- Use a production process manager or container runtime.
- Configure Cloudinary and mail credentials in the hosting platform.
- Enable HTTPS and proper CORS restrictions.
- Rotate secrets regularly.

## Known Project Notes

- The middleware directory is named `Midddlewares` in the current codebase.
- The README and route documentation reflect the current implementation as present in the repository.
- Some behaviors, such as short password reset token expiry, may be adjusted later depending on product requirements.

## Author

**jansitha**

## License

This project is currently licensed under the `ISC` license.
