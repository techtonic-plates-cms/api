import * as Minio from 'minio';

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_URL || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: false,
  accessKey: process.env.MINIO_USER || 'minioadmin',
  secretKey: process.env.MINIO_PASSWORD || 'minioadmin',
});

minioClient.bucketExists('assets').then((exists) => {
  if (!exists) {
    return minioClient.makeBucket('assets', 'us-east-1');
  }
}).catch((err) => {
  console.error('Error checking/creating MinIO bucket:', err);
});