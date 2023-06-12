const crypto = require("crypto");

const randomString = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

module.exports.randomString = randomString;
