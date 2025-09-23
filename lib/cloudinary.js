import crypto from 'crypto';

const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || ''
};

export function ensureCloudinaryConfig() {
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
    throw new Error('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }
}

export function getCloudinaryConfig() {
  return cloudinaryConfig;
}

export function signCloudinaryParams(params) {
  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0));

  const stringToSign = sortedEntries
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${stringToSign}${cloudinaryConfig.apiSecret}`)
    .digest('hex');
}

export function buildThumbnailUrl(publicId, format, transformation = 'c_fill,g_auto,w_400,h_300') {
  if (!publicId || !format) {
    return '';
  }

  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformation}/${publicId}.${format}`;
}
