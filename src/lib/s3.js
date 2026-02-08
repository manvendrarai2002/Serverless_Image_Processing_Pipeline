const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const uploadToS3 = async (bucket, key, body, contentType) => {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    };
    await s3.putObject(params).promise();
    console.log(`Successfully uploaded ${key} to ${bucket}`);
  } catch (error) {
    console.error(`Error uploading to S3: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadToS3,
  s3 // Exporting the instance for potential direct usage
};
