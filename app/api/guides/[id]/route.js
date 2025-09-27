import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function normalizeTextLines(value) {
  if (!value) return [];
  return value
    .map((line) => (typeof line === 'string' ? line : ''))
    .map((line) => line.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

function normalizeRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) return undefined;

  const normalized = recommendations
    .map((item) => {
      const title = typeof item?.title === 'string' ? item.title.trim() : '';
      const id = typeof item?.id === 'string' && item.id.trim().length > 0 ? item.id : undefined;
      const baseLines = Array.isArray(item?.lines) ? item.lines : [];
      const lines = normalizeTextLines(baseLines);
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
    .filter((item) => item.title.length >= 2 && (item.lines.length > 0 || item.link?.url));

  return normalized;
}

function buildUpdatePayload(payload) {
  const update = {};

  const editableFields = ['propertyName', 'address', 'trashLocation', 'wifiName', 'wifiPassword'];
  for (const field of editableFields) {
    if (field in payload) {
      const value = typeof payload[field] === 'string' ? payload[field].trim() : '';
      if (['propertyName', 'address', 'wifiName', 'wifiPassword'].includes(field)) {
        if (value.length < 2) {
          throw new Error(`Le champ ${field} est requis.`);
        }
      }
      update[field] = value || undefined;
    }
  }

  if ('recommendations' in payload) {
    const normalized = normalizeRecommendations(payload.recommendations);
    if (Array.isArray(payload.recommendations) && payload.recommendations.length > 0 && normalized?.length === 0) {
      throw new Error('Les recommandations fournies sont invalides.');
    }
    update.recommendations = normalized || [];
  }

  if (Object.keys(update).length === 0) {
    return null;
  }

  update.updatedAt = new Date();
  return update;
}

function serializeGuide(doc) {
  return {
    _id: doc._id.toString(),
    propertyName: doc.propertyName,
    address: doc.address,
    trashLocation: doc.trashLocation,
    wifiName: doc.wifiName,
    wifiPassword: doc.wifiPassword,
    recommendations: doc.recommendations,
    qrSvgDataUrl: doc.qrSvgDataUrl,
    qrTargetUrl: doc.qrTargetUrl,
    qrToken: doc.qrToken,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function parseId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

export async function PATCH(request, { params }) {
  const { id } = params;
  const objectId = parseId(id);
  if (!objectId) {
    return NextResponse.json({ message: 'Identifiant invalide.' }, { status: 400 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Corps de requête invalide.' }, { status: 400 });
  }

  let update;
  try {
    update = buildUpdatePayload(payload);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (!update) {
    return NextResponse.json({ message: 'Aucune donnée à mettre à jour.' }, { status: 400 });
  }

  try {
    const { db } = await connectDB();
    const result = await db
      .collection('arrival_guides')
      .findOneAndUpdate({ _id: objectId }, { $set: update }, { returnDocument: 'after' });

    if (!result.value) {
      return NextResponse.json({ message: 'Guide introuvable.' }, { status: 404 });
    }

    return NextResponse.json(serializeGuide(result.value));
  } catch (error) {
    console.error('PATCH /api/guides/[id] error:', error);
    return NextResponse.json({ message: 'Impossible de mettre à jour le guide.' }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  const { id } = params;
  const objectId = parseId(id);

  if (!objectId) {
    return NextResponse.json({ message: 'Identifiant invalide.' }, { status: 400 });
  }

  try {
    const { db } = await connectDB();
    await db.collection('arrival_guides').deleteOne({ _id: objectId });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/guides/[id] error:', error);
    return NextResponse.json({ message: 'Impossible de supprimer le guide.' }, { status: 500 });
  }
}

export async function GET(_, { params }) {
  const { id } = params;
  const objectId = parseId(id);

  if (!objectId) {
    return NextResponse.json({ message: 'Identifiant invalide.' }, { status: 400 });
  }

  try {
    const { db } = await connectDB();
    const doc = await db.collection('arrival_guides').findOne({ _id: objectId });

    if (!doc) {
      return NextResponse.json({ message: 'Guide introuvable.' }, { status: 404 });
    }

    return NextResponse.json(serializeGuide(doc));
  } catch (error) {
    console.error('GET /api/guides/[id] error:', error);
    return NextResponse.json({ message: 'Impossible de récupérer le guide.' }, { status: 500 });
  }
}
