import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assetId, assetTitle, url } = body;

    if (!userId || !assetId || !assetTitle || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll return success and let the client handle storing notifications
    // In a production app, you might want to store these in Firebase
    return NextResponse.json({
      success: true,
      notification: {
        id: `notif_${Date.now()}`,
        type: 'duplicate',
        assetId,
        assetTitle,
        url,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add notification' },
      { status: 500 }
    );
  }
}
