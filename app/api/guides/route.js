import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

function normalizeTextLines(value) {
  if (!value) return [];
  return value
    .map((line) => (typeof line === 'string' ? line : ''))
    .map((line) => line.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

function normalizeRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) return [];

  return recommendations
    .map((item) => {
      const title = typeof item?.title === 'string' ? item.title.trim() : '';
      const id = typeof item?.id === 'string' && item.id.trim().length > 0 ? item.id : nanoid(8);
      const lines = normalizeTextLines(Array.isArray(item?.lines) ? item.lines : []);
      const content = typeof item?.content === 'string' ? item.content : undefined;
      if (content && lines.length === 0) {
        lines.push(
          ...normalizeTextLines(
            content
              .split('\n')
              .map((line) => line)
          )
        );
      }

      let link;
      const linkUrl = typeof item?.link?.url === 'string' ? item.link.url.trim() : '';
      const linkLabel = typeof item?.link?.label === 'string' ? item.link.label.trim() : '';

      if (linkUrl) {
        try {
          const validatedUrl = new URL(linkUrl);
          link = { url: validatedUrl.toString() };
          if (linkLabel) {
            link.label = linkLabel.slice(0, 80);
          }
        } catch (_) {
          link = undefined;
        }
      }

      return { id, title, lines, link };
    })
    .filter((rec) => {
      if (rec.title.length < 2) return false;
      if (rec.lines.length === 0 && !rec.link?.url) return false;
      return true;
    });
}

function validateGuidePayload(payload) {
  const errors = {};

  const requiredFields = ['propertyName', 'address', 'wifiName', 'wifiPassword'];
  for (const field of requiredFields) {
    const value = typeof payload[field] === 'string' ? payload[field].trim() : '';
    if (value.length < 2) {
      errors[field] = 'Ce champ est requis';
    }
  }

  if (payload.recommendations) {
    const recommendations = normalizeRecommendations(payload.recommendations);
    if (payload.recommendations.length > 0 && recommendations.length === 0) {
      errors.recommendations = 'Ajoutez au moins une recommandation valide ou supprimez-les.';
    }
  }

  return errors;
}

function buildGuideDocument(payload, origin) {
  const now = new Date();
  const qrToken = nanoid(12);
  const normalizedOrigin = origin.replace(/\/$/, '');
  const qrTargetUrl = `${normalizedOrigin}/guide/${qrToken}`;

  return {
    propertyName: payload.propertyName.trim(),
    address: payload.address.trim(),
    trashLocation: payload.trashLocation?.trim() || undefined,
    wifiName: payload.wifiName.trim(),
    wifiPassword: payload.wifiPassword.trim(),
    recommendations: normalizeRecommendations(payload.recommendations),
    qrToken,
    qrTargetUrl,
    createdAt: now,
    updatedAt: now,
  };
}

function serializeGuide(doc) {
  return {
    _id: doc._id.toString(),
    propertyName: doc.propertyName,
    address: doc.address,
    createdAt: doc.createdAt,
    qrSvgDataUrl: doc.qrSvgDataUrl,
    qrTargetUrl: doc.qrTargetUrl,
    trashLocation: doc.trashLocation,
    wifiName: doc.wifiName,
    wifiPassword: doc.wifiPassword,
    recommendations: doc.recommendations,
    qrToken: doc.qrToken,
    updatedAt: doc.updatedAt,
  };
}

export async function GET() {
  try {
    const { db } = await connectDB();
    const guides = await db
      .collection('arrival_guides')
      .find({}, {
        projection: {
          propertyName: 1,
          address: 1,
          createdAt: 1,
          qrSvgDataUrl: 1,
          qrTargetUrl: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const data = guides.map((doc) => ({
      _id: doc._id.toString(),
      propertyName: doc.propertyName,
      address: doc.address,
      createdAt: doc.createdAt,
      qrSvgDataUrl: doc.qrSvgDataUrl,
      qrTargetUrl: doc.qrTargetUrl,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/guides error:', error);
    return NextResponse.json({ message: 'Une erreur est survenue.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const errors = validateGuidePayload(payload);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const guideDoc = buildGuideDocument(payload, origin);

    const svgString = await QRCode.toString(guideDoc.qrTargetUrl, {
      type: 'svg',
      margin: 1,
      width: 480,
    });

    const svgBase64 = Buffer.from(svgString, 'utf8').toString('base64');
    guideDoc.qrSvgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    const { db } = await connectDB();
    const result = await db.collection('arrival_guides').insertOne(guideDoc);

    const insertedDoc = {
      ...guideDoc,
      _id: result.insertedId,
    };

    return NextResponse.json(serializeGuide(insertedDoc), { status: 201 });
  } catch (error) {
    console.error('POST /api/guides error:', error);
    return NextResponse.json({ message: 'Impossible de créer le guide.' }, { status: 500 });
  }
}
