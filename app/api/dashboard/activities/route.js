import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    // Get recent activities for the user
    const activities = await db.collection('activity_logs')
      .find({ userId: user.id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Format activities for frontend
    const formattedActivities = activities.map(activity => {
      let title = '';
      let description = '';

      switch (activity.type) {
        case 'inventory':
          if (activity.action === 'created') {
            title = 'Nouvel inventaire créé';
            description = `Inventaire pour ${activity.details?.propertyName || 'une propriété'}`;
          } else if (activity.action === 'completed') {
            title = 'Inventaire complété';
            description = `Inventaire signé par ${activity.details?.guestName || 'le guest'}`;
          }
          break;
        case 'guest':
          if (activity.action === 'added') {
            title = 'Nouveau guest ajouté';
            description = `${activity.details?.guestName || 'Guest'} ajouté au système`;
          } else if (activity.action === 'checked_in') {
            title = 'Check-in effectué';
            description = `${activity.details?.guestName || 'Guest'} a effectué son check-in`;
          }
          break;
        case 'deposit':
          if (activity.action === 'authorized') {
            title = 'Caution autorisée';
            description = `Caution de ${activity.details?.amount}€ pré-autorisée`;
          } else if (activity.action === 'released') {
            title = 'Caution libérée';
            description = `Caution automatiquement libérée`;
          }
          break;
        case 'booking':
          if (activity.action === 'confirmed') {
            title = 'Réservation confirmée';
            description = `Séjour du ${activity.details?.checkIn} au ${activity.details?.checkOut}`;
          }
          break;
        default:
          title = 'Activité système';
          description = activity.details?.message || 'Action effectuée';
      }

      return {
        id: activity._id,
        type: activity.type,
        title,
        description,
        timestamp: formatDistanceToNow(new Date(activity.timestamp), { 
          addSuffix: true, 
          locale: fr 
        })
      };
    });

    return NextResponse.json(formattedActivities);

  } catch (error) {
    console.error('Activities API error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des activités' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}