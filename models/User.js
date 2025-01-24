const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.plugin(uniqueValidator); //plugin pour s'assurer que 2 utilisateurs ne peuvent pas partager la même adresse email

module.exports = mongoose.model("User", userSchema);
