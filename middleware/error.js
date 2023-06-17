const { MulterError } = require("multer");

function error(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err)
    return res.status(400).json({ error: "Bad JSON syntax" });

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE")
      return res.status(400).send("file must be an image");
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).send("file is too large");
    if (err.code === "LIMIT_FILE_COUNT")
      return res.status(400).send("file limit reached");
  }
}

module.exports = error;
