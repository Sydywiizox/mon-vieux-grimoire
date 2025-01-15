const multer = require("multer");
const sharp = require("sharp"); // Ajoutez cette ligne
const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_"); //remplace les espaces par des '_'
    console.log(path.parse(name).name);
    const extension = MIME_TYPES[file.mimetype]; //récupère l'extension
    callback(null, path.parse(name).name + Date.now() + "." + extension); //path.parse(name).name enlève l'extension du fichier original
  },
});

const upload = multer({ storage: storage }).single("image");

// Middleware d'optimisation des images
const optimizeImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filePath = req.file.path;
    const fileName = path.parse(req.file.filename).name;
    const outputPath = `images/${fileName}.webp`;

    // Convertit et optimise l'image
    await sharp(filePath)
      .webp({ quality: 80 })
      .resize(800, 1000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFile(outputPath);

    console.log("Chemin complet :", filePath);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(
          "Erreur lors de la suppression du fichier original:",
          err
        );
      } else {
        console.log("Fichier supprimé avec succès");
      }
    });

    // Met à jour les informations de fichier dans la requête
    req.file.filename = `${fileName}.webp`;
    req.file.path = outputPath;
    console.log(req.file);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, optimizeImage };
