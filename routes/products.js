const express = require("express");
const router = express();
const multer = require("multer");
const storage = multer.memoryStorage();
const fileFilter = require("../middleware/filefilter");
const { Product, validate } = require("../models/product");
const {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3")();
const { randomString } = require("../utils/randomString");
const validateId = require("../middleware/validateId");
const validateIds = require("../middleware/validateIds");
const bucketName = process.env.AWS_BUCKET_NAME;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1000000, files: 4 },
});

// Get all products
router.get("/", async (req, res) => {
  const products = await Product.find();

  for (const product of products) {
    const image_urls = [];

    for (const imageName of product.imageNames) {
      const params = { Bucket: bucketName, Key: imageName };
      const command = new GetObjectCommand(params);
      const image_url = await getSignedUrl(s3, command, { expiresIn: 300 });
      image_urls.push(image_url);
    }
    product.image_urls = image_urls;
  }

  res.json(products);
});

// Get single product
router.get("/:id", validateId, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json("product not found.");

  const image_urls = [];
  for (const imageName of product.imageNames) {
    const params = { Bucket: bucketName, Key: imageName };
    const command = new GetObjectCommand(params);
    const image_url = await getSignedUrl(s3, command, { expiresIn: 3000 });
    image_urls.push(image_url);
  }
  product.image_urls = image_urls;

  res.json(product);
});

// Create a product
router.post("/", upload.array("images"), async (req, res) => {
  const { files } = req;
  const { name, description, price } = req.body;

  if (files.length === 0) return res.status(400).json("please select images");

  const { error } = validate(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  const imageNames = [];

  for (const file of files) {
    const imageName = "products/" + randomString() + file.originalname;
    imageNames.push(imageName);
  }

  const params = files.map((file, index) => ({
    Bucket: bucketName,
    Key: imageNames[index],
    Body: file.buffer,
  }));

  await Promise.all(
    params.map((param) => s3.send(new PutObjectCommand(param)))
  );

  const product = new Product({ name, description, price, imageNames });
  await product.save();

  const image_urls = [];
  for (const imageName of product.imageNames) {
    const params = { Bucket: bucketName, Key: imageName };
    const command = new GetObjectCommand(params);
    const image_url = await getSignedUrl(s3, command, { expiresIn: 3000 });
    image_urls.push(image_url);
  }
  product.image_urls = image_urls;

  res.json(product);
});

// Update single product
router.put("/:id", validateId, upload.array("images"), async (req, res) => {
  const filesLimit = 4;
  const { files } = req;
  const { name, description, price } = req.body;

  const { error } = validate(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  let product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json("product not found");

  const existedFilesCount = product.imageNames.length;
  const receivedFilesCount = files.length > 0 ? files.length : 0;
  const totalFiles = existedFilesCount + receivedFilesCount;

  if (totalFiles > filesLimit)
    return res.status(400).json("files limit reached");

  if (receivedFilesCount > 0) {
    const imageNames = [];

    for (const file of files) {
      const imageName = "products/" + randomString() + file.originalname;
      imageNames.push(imageName);
    }

    const params = files.map((file, index) => ({
      Bucket: bucketName,
      Key: imageNames[index],
      Body: file.buffer,
    }));

    await Promise.all(
      params.map((param) => s3.send(new PutObjectCommand(param)))
    );

    product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          description,
          price,
        },
        $push: { imageNames: { $each: imageNames } },
      },
      { new: true }
    );

    const image_urls = [];
    for (const imageName of product.imageNames) {
      const params = { Bucket: bucketName, Key: imageName };
      const command = new GetObjectCommand(params);
      const image_url = await getSignedUrl(s3, command, { expiresIn: 3000 });
      image_urls.push(image_url);
    }
    product.image_urls = image_urls;

    return res.json(product);
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: { name, description, price } },
    { new: true }
  );

  const image_urls = [];
  for (const imageName of product.imageNames) {
    const params = { Bucket: bucketName, Key: imageName };
    const command = new GetObjectCommand(params);
    const image_url = await getSignedUrl(s3, command, { expiresIn: 3000 });
    image_urls.push(image_url);
  }

  product.image_urls = image_urls;

  res.json(product);
});

// Delete single product
router.delete("/:id", validateId, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json("product not found.");

  const keys = [];

  for (const imageName of product.imageNames) keys.push({ Key: imageName });

  const params = { Bucket: bucketName, Delete: { Objects: keys, Quiet: true } };
  const command = new DeleteObjectsCommand(params);
  await s3.send(command);

  await product.deleteOne();
  res.json(product);
});

// Delete multiple products
router.delete("/", validateIds, async (req, res) => {
  const { ids } = req.body;
  const products = await Product.find({ _id: { $in: ids } });
  if (products.length === 0) return res.status(404).json("Products not found");

  const keys = [];

  for (const product of products)
    for (const imageName of product.imageNames) keys.push({ Key: imageName });

  const params = { Bucket: bucketName, Delete: { Objects: keys, Quiet: true } };
  const command = new DeleteObjectsCommand(params);
  await s3.send(command);

  await Product.deleteMany({ _id: { $in: ids } });

  res.json("products deleted successfully");
});

module.exports = router;
