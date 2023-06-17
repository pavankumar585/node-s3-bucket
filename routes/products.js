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
  DeleteObjectCommand,
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
  limits: { fileSize: 500000, files: 2 },
});

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

router.get("/:id", validateId, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).send("product not found.");

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

router.post("/", upload.array("images"), async (req, res) => {
  const { files } = req;
  const { name, description, price } = req.body;

  if (files.length === 0) return res.status(400).send("please select images");

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const imageNames = [];
  for (let i = 0; i < files.length; i++) {
    const imageName = "products/" + randomString() + req.files[i].originalname;
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

router.put("/:id", validateId, upload.array("images"), async (req, res) => {});

router.delete("/:id", validateId, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).send("product not found.");

  for (const imageName of product.imageNames) {
    const params = { Bucket: bucketName, Key: imageName };
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
  }

  await Product.deleteOne();
  res.send(product);
});

router.delete("/", validateIds, async (req, res) => {
  res.send("dvlmflm");
});

module.exports = router;
