const mongoose = require("mongoose");
const Joi = require("joi");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 9999999,
  },
  imageNames: [{ type: String, required: true }],
  image_urls: [String],
});

const Product = mongoose.model("Product", productSchema);

function validateProduct(product) {
  const schema = Joi.object({
    name: Joi.string().required().min(5).max(50),
    description: Joi.string().required().min(10).max(2000),
    price: Joi.number().required().min(0).max(9999999),
  });

  return schema.validate(product);
}

module.exports.Product = Product;
module.exports.validate = validateProduct;
