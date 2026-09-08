# Serverless Image Processing Pipeline ☁️

An event-driven AWS image-processing pipeline that accepts uploads, queues work, processes images asynchronously, and records processing metadata.

## Engineering focus

This project demonstrates practical backend/cloud concepts:

- Event-driven processing with S3 and Lambda
- Asynchronous work buffering with SQS
- Retry handling and a dead-letter queue
- Image transformations with Sharp
- Processing metadata in DynamoDB
- Least-privilege IAM actions scoped to project resources
- Infrastructure defined through Serverless Framework
- Infrastructure validation through `serverless print`

## Architecture

```text
Client
  |
  v
S3 upload bucket
  |
  | ObjectCreated event
  v
Trigger Lambda
  |
  v
SQS queue -----> DLQ after repeated failures
  |
  v
Processing Lambda
  |
  +----> Sharp image transforms
  |
  +----> S3 processed objects
  |
  +----> DynamoDB metadata
```

## AWS components

| Service | Responsibility |
|---|---|
| S3 | Upload and processed image storage |
| Lambda | Event handling and image processing |
| SQS | Durable asynchronous processing queue |
| SQS DLQ | Failed-message isolation |
| DynamoDB | Image processing metadata |
| CloudWatch | Lambda/application logs and AWS metrics |

> **Deployment note:** The repository previously contained a simulated CloudFront URL and a public processed-bucket policy. Those have been removed. The current infrastructure does not claim a live CloudFront deployment.

## Processing flow

1. An image is uploaded to the configured S3 upload bucket.
2. S3 invokes the trigger Lambda.
3. The trigger Lambda publishes the bucket/key to SQS.
4. The processing Lambda consumes the message.
5. Sharp creates the configured image variants and transformations.
6. Outputs are written to the processed bucket.
7. Metadata is written to DynamoDB.
8. Failed messages are retried and eventually isolated in the DLQ.

## Tech stack

- **Runtime:** Node.js 20.x
- **Compute:** AWS Lambda
- **Storage:** Amazon S3
- **Queue:** Amazon SQS
- **Database:** Amazon DynamoDB
- **Image processing:** Sharp
- **Infrastructure:** Serverless Framework
- **Load testing:** k6

## Repository layout

```text
frontend/              # Minimal upload UI
scripts/               # Helper scripts
tests/                 # k6 load tests
src/
  handlers/            # Lambda entry points
  lib/                 # S3/image-processing helpers
serverless.yml         # AWS infrastructure definition
```

## Local validation

### Prerequisites

- Node.js 20+
- AWS CLI for real AWS deployment
- Serverless Framework
- k6 for load testing

### Install

```bash
npm install
```

### Validate infrastructure

```bash
npm test
```

This runs `serverless print --stage ci`, which compiles the Serverless configuration without deploying resources.

### Deploy

```bash
npx serverless deploy --stage dev --region us-east-1
```

Review the generated CloudFormation and IAM permissions before deploying to a production account.

### Load test

The k6 scenario is in `tests/loadtest.js`. Run it with the k6 CLI against an explicitly configured test endpoint. Do not run load tests against production without authorization.

## Performance benchmarks

The repository previously documented a 99.5% success rate, sub-280ms average processing time, 289ms P95 latency, 100 concurrent uploads, and a 94% CloudFront cache hit ratio. These figures are **historical project claims and are not presented here as independently reproducible production measurements**. Re-run the load test against a real deployment before using any number in a resume or interview.

## Cost model

AWS cost depends on region, image volume, object size, Lambda duration, request counts, and storage class. Avoid quoting the previous README's fixed percentage savings as a production guarantee. Measure actual usage with AWS billing data after deployment.

## Reliability and security

- SQS messages use a configured DLQ and retry policy.
- SQS queues use AWS-managed server-side encryption.
- IAM permissions are scoped to the upload/processed object paths and project queues/table.
- The previous wildcard public processed-bucket policy has been removed.
- Secrets and AWS credentials must remain outside source control.

## Next engineering steps

- Add explicit S3 bucket resources with Block Public Access and lifecycle rules.
- Add CloudFront only when a real distribution is provisioned and documented.
- Add automated integration tests using LocalStack or a dedicated AWS test account.
- Add CloudWatch alarms for Lambda errors, duration, SQS age, and DLQ depth.
- Add Terraform/CDK only if it provides value beyond the current Serverless configuration.

---

Built by Manvendra Rai as a cloud/backend engineering portfolio project.
