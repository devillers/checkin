import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    // Get current date for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));

    // Parallel queries for better performance
    const [
      propertiesCount,
      inventoriesCount,
      activeBookings,
      pendingDeposits,
      monthlyRevenue,
      occupancyData
    ] = await Promise.all([
      db.collection('properties').countDocuments({ userId: user.id }),
      db.collection('inventories').countDocuments({ userId: user.id }),
      db.collection('bookings').countDocuments({
        userId: user.id,
        status: 'confirmed',
        checkIn: { $lte: now },
        checkOut: { $gte: now }
      }),
      db.collection('deposits').aggregate([
        {
          $match: {
            userId: user.id,
            status: { $in: ['pending', 'authorized'] }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]).toArray(),
      db.collection('bookings').aggregate([
        {
          $match: {
            userId: user.id,
            status: 'completed',
            checkOut: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ]).toArray(),
      db.collection('bookings').aggregate([
        {
          $match: {
            userId: user.id,
            checkOut: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalNights: { $sum: { $divide: [{ $subtract: ['$checkOut', '$checkIn'] }, 24 * 60 * 60 * 1000] } }
          }
        }
      ]).toArray()
    ]);

    // Calculate occupancy rate (simplified calculation)
    const totalProperties = propertiesCount;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const possibleNights = totalProperties * daysInMonth;
    const occupiedNights = occupancyData[0]?.totalNights || 0;
    const occupancyRate = possibleNights > 0 ? Math.round((occupiedNights / possibleNights) * 100) : 0;

    const stats = {
      properties: propertiesCount,
      inventories: inventoriesCount,
      activeGuests: activeBookings,
      pendingDeposits: pendingDeposits[0]?.totalAmount || 0,
      totalRevenue: monthlyRevenue[0]?.totalRevenue || 0,
      occupancyRate: occupancyRate
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des statistiques' },
      { status: error.message === 'Invalid token' || error.message === 'No token provided' ? 401 : 500 }
    );
  }
}