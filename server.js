import express from 'express';
import dotenv from 'dotenv';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// S3 Client using credentials from .env
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Bucket and Object info
const bucketName = process.env.S3_BUCKET_NAME;
const objectKey = process.env.S3_OBJECT_KEY;

let latestUrl = null;

async function generatePresignedUrl() {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  latestUrl = url;
  console.log('Generated new URL:', url);
}

generatePresignedUrl();
setInterval(generatePresignedUrl, 60 * 1000);

app.get('/image-url', (req, res) => {
  if (!latestUrl) {
    return res.status(500).json({ error: 'URL not ready yet' });
  }
  res.json({ url: latestUrl });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
