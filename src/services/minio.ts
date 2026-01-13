import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = 'cv-uploads';

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ Bucket "${BUCKET_NAME}" created`);
    }
  } catch (error) {
    console.error('Minio bucket error:', error);
  }
}

export async function uploadCV(fileName: string, fileBuffer: Buffer): Promise<string> {
  const objectName = `cv-${Date.now()}-${fileName}`;
  await minioClient.putObject(BUCKET_NAME, objectName, fileBuffer);
  return objectName;
}

export async function getCV(objectName: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    minioClient.getObject(BUCKET_NAME, objectName, (err, stream) => {
      if (err) return reject(err);
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  });
}

export { minioClient, BUCKET_NAME };
