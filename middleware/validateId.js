const mongoose = require("mongoose");

function validateId(req, res, next) {
  const isValid = mongoose.Types.ObjectId.isValid(req.params.id);

  if (!isValid) return res.status(400).send("invalid mongo id");

  next();
}

module.exports = validateId;
