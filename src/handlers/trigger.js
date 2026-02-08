const AWS = require('aws-sdk');

const sqs = new AWS.SQS();

module.exports.handler = async (event) => {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            const s3Bucket = record.s3.bucket.name;
            const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

            const messageBody = JSON.stringify({
                bucket: s3Bucket,
                key: s3Key,
            });

            const params = {
                QueueUrl: process.env.SQS_QUEUE_URL,
                MessageBody: messageBody,
            };

            await sqs.sendMessage(params).promise();
            console.log(`Sent message to SQS for object: ${s3Key}`);
        }

        return { statusCode: 200, body: 'Successfully processed S3 event' };
    } catch (error) {
        console.error('Error handling S3 event:', error);
        throw error; // Retry mechanism in Lambda
    }
};
