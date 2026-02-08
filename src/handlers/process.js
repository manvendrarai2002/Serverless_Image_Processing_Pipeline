const AWS = require('aws-sdk');
const { s3, uploadToS3 } = require('../lib/s3');
const { processImage } = require('../lib/image');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
    try {
        for (const record of event.Records) {
            const { bucket, key } = JSON.parse(record.body);
            console.log(`Processing image: ${key} from bucket: ${bucket}`);

            const startTime = Date.now();

            // 1. Get original image from S3
            const originalImage = await s3.getObject({
                Bucket: bucket,
                Key: key,
            }).promise();

            // 2. Process image (Resize, Compress, Watermark) -> Returns object with buffers for each size
            const processedBuffers = await processImage(originalImage.Body);

            // 3. Upload all versions to Processed Bucket
            const processedBucket = process.env.PROCESSED_BUCKET;
            const baseKey = key.replace(/\.[^/.]+$/, ''); // Remove extension
            const uploadPromises = [];

            for (const [size, buffer] of Object.entries(processedBuffers)) {
                const processedKey = `${baseKey}-${size}.jpg`;
                uploadPromises.push(uploadToS3(processedBucket, processedKey, buffer, 'image/jpeg'));
            }

            await Promise.all(uploadPromises);

            // 4. Store Metadata in DynamoDB
            const processingTime = Date.now() - startTime;
            await dynamoDb.put({
                TableName: process.env.DYNAMODB_TABLE,
                Item: {
                    imageId: key,
                    originalBucket: bucket,
                    processedBucket: processedBucket,
                    processingTimeMs: processingTime,
                    versions: Object.keys(processedBuffers),
                    processedAt: new Date().toISOString(),
                    status: 'COMPLETED'
                }
            }).promise();

            console.log(`Successfully processed ${key} in ${processingTime}ms`);
        }

        return { statusCode: 200, body: 'Image processing complete' };
    } catch (error) {
        console.error('Error processing image batch:', error);
        throw error; // Fail to retry via SQS/DLQ
    }
};
