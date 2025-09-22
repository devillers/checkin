import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    // Get upcoming check-ins within next 7 days
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const upcomingCheckins = await db.collection('bookings').aggregate([
      {
        $match: {
          userId: user.id,
          status: { $in: ['confirmed', 'pending'] },
          checkIn: {
            $gte: now,
            $lte: sevenDaysFromNow
          }
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
      },
      {
        $project: {
          id: 1,
          checkIn: 1,
          checkOut: 1,
          status: 1,
          guestName: { $concat: [{ $arrayElemAt: ['$guest.firstName', 0] }, ' ', { $arrayElemAt: ['$guest.lastName', 0] }] },
          property: { $arrayElemAt: ['$property.name', 0] },
          propertyAddress: { $arrayElemAt: ['$property.address', 0] },
          adults: 1,
          children: 1,
          totalAmount: 1
        }
      },
      {
        $sort: { checkIn: 1 }
      }
    ]).toArray();

    // Format the data
    const formattedCheckins = upcomingCheckins.map(booking => ({
      id: booking.id,
      guestName: booking.guestName,
      property: booking.property,
      propertyAddress: booking.propertyAddress,
      date: format(new Date(booking.checkIn), 'd MMM', { locale: fr }),
      fullDate: format(new Date(booking.checkIn), 'EEEE d MMMM yyyy', { locale: fr }),
      checkInTime: format(new Date(booking.checkIn), 'HH:mm'),
      checkOutDate: format(new Date(booking.checkOut), 'd MMM', { locale: fr }),
      status: booking.status,
      guests: booking.adults + (booking.children || 0),
      totalAmount: booking.totalAmount
    }));

    return NextResponse.json(formattedCheckins);

  } catch (error) {
    console.error('Checkins API error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des arrivées' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}