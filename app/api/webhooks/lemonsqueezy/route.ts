import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import crypto from 'crypto';

// Verify LemonSqueezy webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || '';
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';

    // Verify webhook signature (skip in development if secret not set)
    if (webhookSecret && webhookSecret !== 'your_webhook_secret_here') {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;

    console.log('📬 LemonSqueezy webhook received:', eventName);

    // Handle order_created event (for one-time/lifetime purchases)
    if (eventName === 'order_created') {
      const customData = event.meta?.custom_data;
      const userId = customData?.user_id;
      const customerEmail = event.data?.attributes?.user_email;
      const orderId = event.data?.id;

      if (!userId) {
        console.error('No user_id in webhook custom data');
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
      }

      if (!db) {
        console.error('Database not initialized');
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log('🎉 Processing purchase for user:', userId);

      // Get existing user data if it exists
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};

      // Update user document with premium status
      await setDoc(userRef, {
        ...existingData,
        subscription: 'premium',
        subscriptionType: 'lifetime',
        purchaseDate: Timestamp.now(),
        customerEmail: customerEmail || existingData.customerEmail || '',
        lemonSqueezyOrderId: orderId || '',
        updatedAt: Timestamp.now(),
      }, { merge: true });

      console.log('✅ User upgraded to premium:', userId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature',
    },
  });
}
