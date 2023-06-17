const mongoose = require("mongoose");
const Joi = require("joi");
const s3 = require("../config/s3")();
const {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const postsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  content: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 5000,
  },
  imageName: { type: String, required: true },
  image_url: String,
});

const bucketName = process.env.AWS_BUCKET_NAME;

postsSchema.methods.getImageUrl = async function () {
  const params = { Bucket: bucketName, Key: this.imageName };
  const command = new GetObjectCommand(params);
  return await getSignedUrl(s3, command, { expiresIn: 10 });
};

postsSchema.methods.deleteImageUrl = async function () {
  const params = { Bucket: bucketName, Key: this.imageName };
  const command = new DeleteObjectCommand(params);

  await s3.send(command);
};

postsSchema.statics.createImageUrl = async function (imageName, buffer, type) {
  const params = { Bucket: bucketName, Key: imageName, Body: buffer };

  const command = new PutObjectCommand(params);
  await s3.send(command);
};

const Post = mongoose.model("Post", postsSchema);

function validatePost(post) {
  const schema = Joi.object({
    title: Joi.string().required().min(5).max(50),
    content: Joi.string().required().min(20).max(5000),
  });

  return schema.validate(post);
}

module.exports.validate = validatePost;
module.exports.Post = Post;
