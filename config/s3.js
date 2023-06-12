const { S3Client } = require("@aws-sdk/client-s3");

function s3() {
  const bucketRegion = process.env.AWS_BUCKET_REGION;
  const accessKey = process.env.AWS_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  return new S3Client({
    region: bucketRegion,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey,
    },
  });
}

module.exports = s3;
