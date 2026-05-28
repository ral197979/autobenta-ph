const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

const BUCKET = () => process.env.R2_BUCKET_NAME;
const PUBLIC_URL = () => process.env.R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev

module.exports = {
  async saveFile(file) {
    const client = getClient();
    const key = `photos/${file.filename}`;
    const body = fs.readFileSync(file.path);

    await client.send(new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: file.mimetype,
    }));

    // clean up local tmp file written by multer
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }

    const url = `${PUBLIC_URL()}/${key}`;
    return { url, storageKey: key, provider: 'r2' };
  },

  async deleteFile(storageKey) {
    const client = getClient();
    await client.send(new DeleteObjectCommand({
      Bucket: BUCKET(),
      Key: storageKey,
    }));
  },
};
