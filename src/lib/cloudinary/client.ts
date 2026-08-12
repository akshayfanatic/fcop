import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { HttpStatus } from '../../utils/api-response.js';
import { createHttpError } from '../../utils/http-error.js';

let isConfigured = false;

export const getCloudinaryClient = () => {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw createHttpError(HttpStatus.INTERNAL_ERROR, 'Cloudinary credentials are not configured.', 'CLOUDINARY_NOT_CONFIGURED');
  }

  if (!isConfigured) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
      hide_sensitive: true
    });
    isConfigured = true;
  }

  return cloudinary;
};
