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
    console.log('📦 Event data:', JSON.stringify(event, null, 2));

    const customData = event.meta?.custom_data;
    const userId = customData?.user_id;

    if (!db) {
      console.error('Database not initialized');
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Handle order_created event (for one-time/lifetime purchases)
    if (eventName === 'order_created') {
      const customerEmail = event.data?.attributes?.user_email;
      const orderId = event.data?.id;

      if (!userId) {
        console.error('No user_id in webhook custom data');
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
      }

      console.log('🎉 Processing lifetime purchase for user:', userId);

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};

      await setDoc(userRef, {
        ...existingData,
        subscription: 'premium',
        subscriptionType: 'lifetime',
        purchaseDate: Timestamp.now(),
        customerEmail: customerEmail || existingData.customerEmail || '',
        lemonSqueezyOrderId: orderId || '',
        updatedAt: Timestamp.now(),
      }, { merge: true });

      console.log('✅ User upgraded to lifetime premium:', userId);
    }

    // Handle subscription_created event (for monthly/yearly subscriptions)
    if (eventName === 'subscription_created') {
      const customerEmail = event.data?.attributes?.user_email;
      const subscriptionId = event.data?.id;
      const status = event.data?.attributes?.status; // active, cancelled, expired, etc.
      const renewsAt = event.data?.attributes?.renews_at;
      const endsAt = event.data?.attributes?.ends_at;

      if (!userId) {
        console.error('No user_id in webhook custom data');
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
      }

      console.log('🎉 Processing subscription for user:', userId, 'Status:', status);

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};

      await setDoc(userRef, {
        ...existingData,
        subscription: status === 'active' ? 'premium' : 'free',
        subscriptionType: 'subscription',
        subscriptionStatus: status,
        subscriptionId: subscriptionId || '',
        renewsAt: renewsAt || null,
        endsAt: endsAt || null,
        customerEmail: customerEmail || existingData.customerEmail || '',
        updatedAt: Timestamp.now(),
      }, { merge: true });

      console.log('✅ Subscription created for user:', userId);
    }

    // Handle subscription_updated event (status changes, renewals, etc.)
    if (eventName === 'subscription_updated') {
      const subscriptionId = event.data?.id;
      const status = event.data?.attributes?.status;
      const renewsAt = event.data?.attributes?.renews_at;
      const endsAt = event.data?.attributes?.ends_at;

      // Find user by subscription ID if userId not in custom data
      let targetUserId = userId;

      if (!targetUserId && subscriptionId) {
        // We'd need to query Firebase to find the user with this subscriptionId
        // For now, log a warning
        console.warn('No user_id in custom data, subscription_id:', subscriptionId);
      }

      if (targetUserId) {
        console.log('🔄 Updating subscription for user:', targetUserId, 'Status:', status);

        const userRef = doc(db, 'users', targetUserId);
        const userSnap = await getDoc(userRef);
        const existingData = userSnap.exists() ? userSnap.data() : {};

        // Only downgrade if subscription is truly inactive
        const isPremium = status === 'active' || status === 'on_trial';

        await setDoc(userRef, {
          ...existingData,
          subscription: isPremium ? 'premium' : 'free',
          subscriptionStatus: status,
          renewsAt: renewsAt || null,
          endsAt: endsAt || null,
          updatedAt: Timestamp.now(),
        }, { merge: true });

        console.log('✅ Subscription updated for user:', targetUserId, 'Premium:', isPremium);
      }
    }

    // Handle subscription_cancelled event
    if (eventName === 'subscription_cancelled') {
      const subscriptionId = event.data?.id;
      const endsAt = event.data?.attributes?.ends_at; // They still have access until this date

      if (userId) {
        console.log('❌ Subscription cancelled for user:', userId, 'Ends at:', endsAt);

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const existingData = userSnap.exists() ? userSnap.data() : {};

        await setDoc(userRef, {
          ...existingData,
          subscriptionStatus: 'cancelled',
          endsAt: endsAt || null, // User keeps access until this date
          cancelledAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }, { merge: true });

        console.log('✅ Marked subscription as cancelled, access until:', endsAt);
      }
    }

    // Handle subscription_expired event (access should be revoked)
    if (eventName === 'subscription_expired') {
      if (userId) {
        console.log('⏰ Subscription expired for user:', userId);

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const existingData = userSnap.exists() ? userSnap.data() : {};

        await setDoc(userRef, {
          ...existingData,
          subscription: 'free',
          subscriptionStatus: 'expired',
          updatedAt: Timestamp.now(),
        }, { merge: true });

        console.log('✅ User downgraded to free:', userId);
      }
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
