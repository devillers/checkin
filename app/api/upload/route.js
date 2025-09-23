import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  buildThumbnailUrl,
  ensureCloudinaryConfig,
  getCloudinaryConfig,
  signCloudinaryParams
} from '@/lib/cloudinary';

export const runtime = 'nodejs';

async function uploadToCloudinary(file, folder) {
  ensureCloudinaryConfig();
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder,
    timestamp
  };
  const signature = signCloudinaryParams(paramsToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key', config.apiKey);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    let message = 'Cloudinary upload failed';
    try {
      const errorBody = await response.json();
      message = errorBody?.error?.message || message;
    } catch (parseError) {
      // ignore parsing errors and use default message
    }
    throw new Error(message);
  }

  const result = await response.json();
  const thumbnailUrl = buildThumbnailUrl(result.public_id, result.format);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    thumbnailUrl
  };
}

async function deleteFromCloudinary(publicId) {
  ensureCloudinaryConfig();
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    public_id: publicId,
    timestamp
  };
  const signature = signCloudinaryParams(paramsToSign);

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key', config.apiKey);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    let message = 'Cloudinary deletion failed';
    try {
      const errorBody = await response.json();
      message = errorBody?.error?.message || message;
    } catch (parseError) {
      // ignore parsing errors and use default message
    }
    throw new Error(message);
  }

  const result = await response.json();

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(result.result || 'Cloudinary deletion failed');
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('file');
    const folderInput = formData.get('folder');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { message: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    const folder = folderInput
      ? `checkin/${user.id}/${String(folderInput)}`
      : `checkin/${user.id}/properties`;

    const uploadResult = await uploadToCloudinary(file, folder);

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors du téléchargement de la photo' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const { publicId } = body || {};

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json(
        { message: "Identifiant d'image manquant" },
        { status: 400 }
      );
    }

    await deleteFromCloudinary(publicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return NextResponse.json(
      { message: error.message || "Erreur lors de la suppression de l'image" },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}
