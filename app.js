const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bookRoutes = require("./routes/book");
const userRoutes = require("./routes/user");
const path = require("path");
require("dotenv").config();

// Connexion à la base de données MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use(express.json()); //parser les requêtes en json

// Configuration des headers pour éviter les erreurs de CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Déclaration des routes
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

// Gestion des images
app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;
