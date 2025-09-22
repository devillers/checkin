import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const { db } = await connectDB();

    const notifications = await db
      .collection('notifications')
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const formattedNotifications = notifications.map((notification, index) => ({
      id: notification.id || notification._id?.toString() || `notification-${index}`,
      title: notification.title || notification.subject || 'Notification',
      message: notification.message || notification.body || '',
      type: notification.type || 'info',
      read: Boolean(notification.read),
      createdAt: notification.createdAt || notification.timestamp || null,
      actionUrl: notification.actionUrl || notification.link || null
    }));

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error('Notifications API error:', error);
    const status =
      error.message === 'Invalid token' || error.message === 'No token provided'
        ? 401
        : 500;

    return NextResponse.json(
      { message: error.message || 'Erreur lors de la récupération des notifications' },
      { status }
    );
  }
}
