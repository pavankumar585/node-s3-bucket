const mongoose = require("mongoose");

function validateIds(req, res, next) {
  const { ids } = req.body;

  if (!ids) return res.status(400).send("ids are required");

  if (!Array.isArray(ids))
    return res.status(400).json("ids should to be an array");

  if (ids.length === 0) return res.status(400).json("array can not be empty");

  const isValidIds = ids.every((id) => mongoose.isValidObjectId(id.toString()));

  if (!isValidIds) return res.status(400).send("one or more ids are invalid");

  next();
}

module.exports = validateIds;
