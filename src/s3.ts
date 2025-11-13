import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ============================================================================
// S3 Client Configuration (RustFS)
// ============================================================================

const S3_ENDPOINT = Deno.env.get('S3_ENDPOINT') || 'http://rustfs:9000';
const S3_REGION = Deno.env.get('S3_REGION') || 'us-east-1';
const S3_ACCESS_KEY = Deno.env.get('S3_ACCESS_KEY') || 'rustfsadmin';
const S3_SECRET_KEY = Deno.env.get('S3_SECRET_KEY') || 'rustfsadmin';
const S3_BUCKET = Deno.env.get('S3_BUCKET') || 'techtonic-assets';

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for RustFS/MinIO compatibility
});

// ============================================================================
// S3 Helper Functions
// ============================================================================

export interface UploadOptions {
  bucket?: string;
  key: string;
  body: Uint8Array | ReadableStream;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  bucket?: string;
  key: string;
}

export interface DeleteOptions {
  bucket?: string;
  key: string;
}

export interface GetSignedUrlOptions {
  bucket?: string;
  key: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

/**
 * Upload a file to S3-compatible storage (RustFS)
 */
export async function uploadToS3(options: UploadOptions): Promise<{ key: string; etag?: string }> {
  const bucket = options.bucket || S3_BUCKET;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
    Metadata: options.metadata,
  });

  const response = await s3Client.send(command);

  return {
    key: options.key,
    etag: response.ETag,
  };
}

/**
 * Download a file from S3-compatible storage (RustFS)
 */
export async function downloadFromS3(options: DownloadOptions): Promise<ReadableStream | null> {
  const bucket = options.bucket || S3_BUCKET;
  
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: options.key,
    });

    const response = await s3Client.send(command);
    return response.Body as ReadableStream;
  } catch (error) {
    if ((error as { name?: string }).name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a file from S3-compatible storage (RustFS)
 */
export async function deleteFromS3(options: DeleteOptions): Promise<void> {
  const bucket = options.bucket || S3_BUCKET;
  
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: options.key,
  });

  await s3Client.send(command);
}

/**
 * Check if a file exists in S3-compatible storage (RustFS)
 */
export async function existsInS3(options: DownloadOptions): Promise<boolean> {
  const bucket = options.bucket || S3_BUCKET;
  
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: options.key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Get a presigned URL for temporary access to an object
 */
export async function getPresignedUrl(options: GetSignedUrlOptions): Promise<string> {
  const bucket = options.bucket || S3_BUCKET;
  const expiresIn = options.expiresIn || 3600; // 1 hour default
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: options.key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a unique S3 key for an uploaded file
 */
export function generateS3Key(filename: string, userId: string): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomUUID().slice(0, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return `uploads/${userId}/${timestamp}-${randomStr}-${sanitizedFilename}`;
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Determine content type from file extension
 */
export function getContentType(filename: string): string {
  const ext = getFileExtension(filename);
  const contentTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    
    // Archives
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    
    // Audio/Video
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wav: 'audio/wav',
    
    // Other
    default: 'application/octet-stream',
  };
  
  return contentTypes[ext] || contentTypes.default;
}

export const S3_CONFIG = {
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  bucket: S3_BUCKET,
};
