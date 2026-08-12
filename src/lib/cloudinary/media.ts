import type { UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env.js';
import { HttpStatus } from '../../utils/api-response.js';
import { createHttpError } from '../../utils/http-error.js';
import { getCloudinaryClient } from './client.js';

export type StoredResourceType = 'image' | 'video' | 'raw';
export type UploadResourceType = StoredResourceType | 'auto';

export type UploadMediaInput = {
  buffer: Buffer;
  folder: string;
  publicId?: string;
  resourceType?: UploadResourceType;
  overwrite?: boolean;
};

export type UploadedMedia = {
  assetId: string;
  publicId: string;
  resourceType: StoredResourceType;
  secureUrl: string;
  format?: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export type DeleteMediaInput = {
  publicId: string;
  resourceType: StoredResourceType;
};

type CloudinaryError = {
  http_code?: number;
  message?: string;
  name?: string;
};

type CloudinaryErrorResponse = {
  error?: {
    message?: string;
  };
};

const isStoredResourceType = (value: string): value is StoredResourceType => value === 'image' || value === 'video' || value === 'raw';

const normalizeUploadResult = (result: UploadApiResponse): UploadedMedia => {
  if (!isStoredResourceType(result.resource_type)) {
    throw createHttpError(HttpStatus.INTERNAL_ERROR, 'Cloudinary returned an unsupported resource type.', 'MEDIA_UPLOAD_INVALID_RESPONSE');
  }

  return {
    assetId: result.asset_id,
    publicId: result.public_id,
    resourceType: result.resource_type,
    secureUrl: result.secure_url,
    format: result.format,
    sizeBytes: result.bytes,
    width: result.width,
    height: result.height
  };
};

const isCloudinaryTimeout = (error: unknown): error is CloudinaryError => {
  if (typeof error !== 'object' || !error) return false;

  const cloudinaryError = error as CloudinaryError;
  return cloudinaryError.http_code === 499 || cloudinaryError.name === 'TimeoutError';
};

const uploadBuffer = async ({
  buffer,
  folder,
  publicId,
  resourceType,
  overwrite
}: Required<Pick<UploadMediaInput, 'buffer' | 'folder' | 'resourceType' | 'overwrite'>> & Pick<UploadMediaInput, 'publicId'>) => {
  const cloudinary = getCloudinaryClient();
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = {
    folder,
    overwrite,
    timestamp,
    ...(publicId ? { public_id: publicId } : {})
  };
  const formData = new FormData();

  formData.set('file', new Blob([new Uint8Array(buffer)]), publicId ?? 'upload');
  formData.set('api_key', env.cloudinaryApiKey);
  formData.set('signature', cloudinary.utils.api_sign_request(signedParams, env.cloudinaryApiSecret));

  for (const [key, value] of Object.entries(signedParams)) {
    formData.set(key, String(value));
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.cloudinaryCloudName)}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(60_000)
  });
  const result = (await response.json()) as UploadApiResponse & CloudinaryErrorResponse;

  if (!response.ok) {
    throw Object.assign(new Error(result.error?.message ?? 'Cloudinary rejected the upload.'), {
      http_code: response.status
    });
  }

  return result;
};

const upload = async ({ buffer, folder, publicId, resourceType = 'auto', overwrite = false }: UploadMediaInput): Promise<UploadedMedia> => {
  try {
    // Upload through the signed API so media creation remains authenticated by the backend.
    const result = await uploadBuffer({ buffer, folder, publicId, resourceType, overwrite });

    return normalizeUploadResult(result);
  } catch (error) {
    if (isCloudinaryTimeout(error)) {
      throw createHttpError(HttpStatus.GATEWAY_TIMEOUT, 'Media provider timed out. Please try again.', 'MEDIA_UPLOAD_TIMEOUT');
    }

    if (typeof error === 'object' && error && 'statusCode' in error) {
      throw error;
    }

    throw createHttpError(HttpStatus.BAD_GATEWAY, 'Media provider rejected the upload.', 'MEDIA_UPLOAD_FAILED');
  }
};

const deleteMedia = async ({ publicId, resourceType }: DeleteMediaInput): Promise<void> => {
  try {
    const cloudinary = getCloudinaryClient();
    const timestamp = Math.floor(Date.now() / 1000);
    const signedParams = {
      invalidate: true,
      public_id: publicId,
      timestamp
    };
    const formData = new FormData();

    formData.set('api_key', env.cloudinaryApiKey);
    formData.set('signature', cloudinary.utils.api_sign_request(signedParams, env.cloudinaryApiSecret));

    for (const [key, value] of Object.entries(signedParams)) {
      formData.set(key, String(value));
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.cloudinaryCloudName)}/${resourceType}/destroy`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(60_000)
    });
    const result = (await response.json()) as { result?: string; error?: { message?: string } };

    if (!response.ok) {
      throw new Error(result.error?.message ?? 'Cloudinary rejected the delete request.');
    }

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Unexpected Cloudinary delete result: ${result.result ?? 'unknown'}`);
    }
  } catch (error) {
    if (typeof error === 'object' && error && 'statusCode' in error) {
      throw error;
    }

    throw createHttpError(HttpStatus.INTERNAL_ERROR, 'Media deletion failed.', 'MEDIA_DELETE_FAILED');
  }
};

export const cloudinaryMedia = {
  upload,
  delete: deleteMedia
};
