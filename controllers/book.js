const Book = require("../models/Book");
const cloudinary = require("../config/cloudinary");

// GET /api/books
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: "Une erreur est survenue lors de la récupération des livres",
        error,
      });
    });
};

// GET /api/books/:id
exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error:
          "Une erreur est survenue lors de la récupération du livre " +
          req.params.id,
        error,
      });
    });
};

// GET /api/books/bestrating
exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) //ordre décroissant
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })

    .catch((error) => {
      res.status(400).json({
        error:
          "Une erreur est survenue lors de la récupération des livres les mieux notés",
        error,
      });
    });
};

// POST /api/books
exports.createBook = async (req, res, next) => {
  // Vérifier si l'utilisateur est authentifié
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ error: "Image requise" });
    }

    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id; // Supprimer tout id malveillant
    delete bookObject._userId; // Supprimer tout userId malveillant

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId, // Associer le livre à l'utilisateur authentifié
      imageUrl: req.file.path, // URL Cloudinary déjà disponible
    });

    await book.save();
    res.status(201).json({ message: "Livre créé avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la création du livre:", error);
    res
      .status(400)
      .json({ error: "Erreur lors de la création du livre: " + error.message });
  }
};

// PUT /api/books/:id
exports.modifyBook = async (req, res, next) => {
  try {
    // Vérifier l'authentification
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    // Trouver le livre
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Vérifier la propriété
    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Si nouvelle image : supprimer l’ancienne sur Cloudinary
    if (req.file && book.imageUrl) {
      try {
        const match = book.imageUrl.match(
          /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/
        );
        if (match) {
          const publicId = match[1];
          const result = await cloudinary.uploader.destroy(publicId);
          if (result.result === "ok") {
            console.log("✅ Ancienne image supprimée:", publicId);
          } else {
            console.warn("⚠️ Image non trouvée sur Cloudinary:", publicId);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la suppression Cloudinary:", err);
      }
    }

    // Construction de l’objet à mettre à jour
    const bookObject = req.file
      ? { ...JSON.parse(req.body.book), imageUrl: req.file.path }
      : { ...req.body };

    delete bookObject._id;
    delete bookObject._userId;

    // Mise à jour en base
    await Book.updateOne({ _id: req.params.id }, { ...bookObject });
    res.status(200).json({ message: "Livre modifié avec succès !" });
  } catch (error) {
    console.error("Erreur modifyBook:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res, next) => {
  try {
    // Vérif auth
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Vérif propriétaire
    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Suppression Cloudinary si image présente
    if (book.imageUrl) {
      try {
        const match = book.imageUrl.match(
          /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/
        );
        const publicId = match ? match[1] : null;

        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId);
          if (result.result === "ok") {
            console.log("✅ Image supprimée de Cloudinary:", publicId);
          } else {
            console.warn("⚠️ Image non trouvée sur Cloudinary:", publicId);
          }
        } else {
          console.warn(
            "⚠️ Impossible d'extraire le public_id depuis l'URL:",
            book.imageUrl
          );
        }
      } catch (err) {
        console.error("Erreur lors de la suppression Cloudinary:", err);
      }
    }

    // Suppression du livre en base
    await Book.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Livre supprimé !" });
  } catch (error) {
    console.error("Erreur deleteBook:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST /api/books/:id/rating
exports.addRating = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  const userId = req.auth.userId;
  const grade = req.body.rating;
  if (typeof grade !== "number" || grade < 0 || grade > 5) {
    return res
      .status(400)
      .json({ error: "La note doit être comprise entre 0 et 5" });
  }
  const bookId = req.params.id;
  Book.findOne({ _id: bookId })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Livre non trouvé" });
      }

      const existingRating = book.ratings.find(
        (rating) => rating.userId === userId
      );
      if (existingRating) {
        return res
          .status(400)
          .json({ error: "Cet utilisateur a deja note ce livre" });
      }

      const newRating = {
        userId: userId,
        grade: grade,
      };

      book.ratings.push(newRating);
      return book.save();
    })
    .then((updatedBook) => {
      res.status(200).json(updatedBook);
    })
    .catch((error) => {
      res.status(400).json({
        error: "Une erreur est survenue lors de l'ajout de la note",
        error,
      });
    });
};

// PUT /api/books/:id/rating
exports.updateRating = async (req, res) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const { rating } = req.body;
    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      return res
        .status(400)
        .json({ error: "La note doit être comprise entre 0 et 5" });
    }

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé" });
    }

    // Vérifier qu'un utilisateur ne peut modifier que sa propre note
    const existingRating = book.ratings.find(
      (r) => r.userId === req.auth.userId
    );
    if (!existingRating) {
      return res
        .status(404)
        .json({ error: "Aucune note existante pour cet utilisateur" });
    }

    // Mise à jour de la note
    existingRating.grade = rating;

    // Recalcul de la moyenne
    const sum = book.ratings.reduce((acc, r) => acc + r.grade, 0);
    book.averageRating = (sum / book.ratings.length).toFixed(1);

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    console.error("Erreur updateRating:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// DELETE /api/books/:id/rating
exports.deleteRating = async (req, res) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé" });
    }

    // Vérifier que la note existe pour cet utilisateur
    const hasRating = book.ratings.some((r) => r.userId === req.auth.userId);
    if (!hasRating) {
      return res
        .status(404)
        .json({ error: "Aucune note à supprimer pour cet utilisateur" });
    }

    // Supprimer la note
    book.ratings = book.ratings.filter((r) => r.userId !== req.auth.userId);

    // Recalcul de la moyenne
    const sum = book.ratings.reduce((acc, r) => acc + r.grade, 0);
    book.averageRating = book.ratings.length
      ? (sum / book.ratings.length).toFixed(1)
      : 0;

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    console.error("Erreur deleteRating:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
