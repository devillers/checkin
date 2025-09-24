import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

const COLLECTION_NAME = 'super_admin_overview';
const DOCUMENT_ID = 'global-overview';

const trendDirectionSchema = z.enum(['up', 'down']);

const overviewSchema = z
  .object({
    lastUpdated: z.string().min(1).optional(),
    metrics: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1).optional(),
          value: z.string().min(1),
          trend: z.string().optional(),
          trendDirection: trendDirectionSchema.optional(),
          color: z.string().optional()
        })
      )
      .optional(),
    quickActions: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          tone: z.string().optional()
        })
      )
      .optional(),
    platformHealth: z
      .object({
        status: z.string().optional(),
        uptime: z.string().optional(),
        incidentsThisMonth: z.number().int().min(0).optional(),
        responseTime: z.string().optional(),
        deploymentFrequency: z.string().optional()
      })
      .optional(),
    monthlyGrowth: z
      .array(
        z.object({
          month: z.string().min(1),
          revenue: z.number(),
          owners: z.number().optional(),
          properties: z.number().optional()
        })
      )
      .optional(),
    activity: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
          date: z.string().optional(),
          status: z.string().optional(),
          type: z.string().optional()
        })
      )
      .optional(),
    support: z
      .object({
        openTickets: z.number().int().min(0).optional(),
        criticalTickets: z.number().int().min(0).optional(),
        satisfaction: z.number().min(0).max(100).optional(),
        tickets: z
          .array(
            z.object({
              id: z.string().min(1),
              subject: z.string().min(1),
              account: z.string().optional(),
              priority: z.string().optional(),
              status: z.string().optional(),
              updated: z.string().optional()
            })
          )
          .optional()
      })
      .optional(),
    topOwners: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          company: z.string().optional(),
          properties: z.number().int().min(0).optional(),
          occupancy: z.string().optional(),
          revenue: z.string().optional(),
          trend: z.string().optional()
        })
      )
      .optional(),
    roadmap: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          quarter: z.string().optional(),
          owner: z.string().optional(),
          progress: z.number().int().min(0).max(100).optional(),
          status: z.string().optional(),
          description: z.string().optional()
        })
      )
      .optional(),
    expansion: z
      .object({
        markets: z
          .array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              status: z.string().optional(),
              properties: z.number().int().min(0).optional()
            })
          )
          .optional(),
        pipeline: z
          .array(
            z.object({
              id: z.string().min(1),
              label: z.string().min(1),
              value: z.number().int().min(0).optional()
            })
          )
          .optional()
      })
      .optional()
  })
  .partial();

async function ensureSuperAdmin(user) {
  if (user.role !== 'superadmin') {
    throw new Error('FORBIDDEN');
  }
}

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    await ensureSuperAdmin(user);

    const { db } = await connectDB();

    const document = await db.collection(COLLECTION_NAME).findOne({ id: DOCUMENT_ID });

    if (!document) {
      return NextResponse.json({
        lastUpdated: null
      });
    }

    const { _id, id, ...payload } = document;

    return NextResponse.json(payload);
  } catch (error) {
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json({ message: 'Authentification requise' }, { status: 401 });
    }

    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    console.error('Super admin overview GET error:', error);
    return NextResponse.json({ message: 'Erreur lors de la récupération des données' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    await ensureSuperAdmin(user);

    const json = await request.json();
    const parsed = overviewSchema.parse(json);

    const { db } = await connectDB();

    const update = {
      id: DOCUMENT_ID,
      ...parsed,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      updatedBy: {
        id: user.id,
        email: user.email
      },
      updatedAt: new Date()
    };

    await db.collection(COLLECTION_NAME).updateOne(
      { id: DOCUMENT_ID },
      { $set: update },
      { upsert: true }
    );

    await db.collection('activity_logs').insertOne({
      id: `${DOCUMENT_ID}-${Date.now()}`,
      userId: user.id,
      type: 'superadmin',
      action: 'update_overview',
      details: {
        lastUpdated: update.lastUpdated
      },
      timestamp: new Date()
    });

    return NextResponse.json({ message: 'Vue mise à jour', ...update });
  } catch (error) {
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json({ message: 'Authentification requise' }, { status: 401 });
    }

    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Format des données invalide',
          issues: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Super admin overview POST error:', error);
    return NextResponse.json({ message: 'Erreur lors de la mise à jour des données' }, { status: 500 });
  }
}
