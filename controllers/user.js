const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hash,
    });

    await user.save();
    res.status(201).json({ message: "Utilisateur créé !" });
  } catch (error) {
    console.error(error);

    // Cas 1 — doublon MongoDB (index unique)
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email déjà utilisé !" });
    }

    // Cas 2 — validation Mongoose (unique non respecté)
    if (error.name === "ValidationError") {
      const emailError = error.errors?.email;
      if (emailError && emailError.kind === "unique") {
        return res.status(400).json({ error: "Email déjà utilisé !" });
      }
    }

    // Cas 3 — autre erreur
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST /api/auth/login
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
