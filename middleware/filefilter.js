const { MulterError } = require("multer");

const fileFilter = (req, file, cb) => {
  if (file.mimetype.split("/")[0] === "image") cb(null, true);
  else cb(new MulterError("LIMIT_UNEXPECTED_FILE"), false);
};

module.exports = fileFilter;
