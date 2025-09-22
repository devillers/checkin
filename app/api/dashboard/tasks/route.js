import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    const now = new Date();
    const tasks = [];

    // Check for pending inventories
    const pendingInventories = await db.collection('inventories').find({
      userId: user.id,
      status: 'pending',
      dueDate: { $lte: addDays(now, 1) }
    }).toArray();

    pendingInventories.forEach(inventory => {
      tasks.push({
        id: `inventory-${inventory.id}`,
        type: 'inventory',
        title: 'Inventaire en attente',
        description: `Inventaire ${inventory.type} pour ${inventory.propertyName}`,
        priority: isBefore(new Date(inventory.dueDate), now) ? 'high' : 'medium',
        due: format(new Date(inventory.dueDate), 'd MMM HH:mm', { locale: fr }),
        dueDate: inventory.dueDate
      });
    });

    // Check for deposits to release
    const depositsToRelease = await db.collection('deposits').find({
      userId: user.id,
      status: 'authorized',
      releaseDate: { $lte: now }
    }).toArray();

    depositsToRelease.forEach(deposit => {
      tasks.push({
        id: `deposit-${deposit.id}`,
        type: 'deposit',
        title: 'Caution à libérer',
        description: `Caution de ${deposit.amount}€ à libérer`,
        priority: 'high',
        due: 'Maintenant',
        dueDate: deposit.releaseDate
      });
    });

    // Check for overdue check-ins
    const overdueCheckins = await db.collection('bookings').aggregate([
      {
        $match: {
          userId: user.id,
          status: 'confirmed',
          checkIn: { $lt: now },
          inventoryStatus: { $ne: 'completed' }
        }
      },
      {
        $lookup: {
          from: 'guests',
          localField: 'guestId',
          foreignField: 'id',
          as: 'guest'
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: 'id',
          as: 'property'
        }
      }
    ]).toArray();

    overdueCheckins.forEach(booking => {
      const guestName = booking.guest[0] ? `${booking.guest[0].firstName} ${booking.guest[0].lastName}` : 'Guest';
      const propertyName = booking.property[0]?.name || 'Propriété';
      
      tasks.push({
        id: `checkin-${booking.id}`,
        type: 'checkin',
        title: 'Check-in en retard',
        description: `${guestName} - ${propertyName}`,
        priority: 'high',
        due: format(new Date(booking.checkIn), 'd MMM HH:mm', { locale: fr }),
        dueDate: booking.checkIn
      });
    });

    // Check for properties without recent maintenance
    const propertiesNeedingMaintenance = await db.collection('properties').find({
      userId: user.id,
      lastMaintenance: { 
        $lt: addDays(now, -90) // 3 months ago
      }
    }).toArray();

    propertiesNeedingMaintenance.forEach(property => {
      tasks.push({
        id: `maintenance-${property.id}`,
        type: 'maintenance',
        title: 'Maintenance recommandée',
        description: `${property.name} - Dernière maintenance il y a plus de 3 mois`,
        priority: 'low',
        due: 'À planifier',
        dueDate: addDays(now, 7)
      });
    });

    // Sort by priority and due date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    return NextResponse.json(tasks);

  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des tâches' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}