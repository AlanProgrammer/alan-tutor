import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';

/** Firestore transaction-backed fixed-window limiter. Use a stable hashed actor key in production. */
export async function enforceRateLimit(actor: string, limit = 35, windowMs = 60_000): Promise<boolean> {
  const db = adminDb();
  const ref = db.collection('_rate_limits').doc(actor.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 140));
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.data();
    const start = data?.windowStart instanceof Timestamp ? data.windowStart.toMillis() : 0;
    if (!data || now - start >= windowMs) {
      tx.set(ref, { count: 1, windowStart: Timestamp.fromMillis(now), expiresAt: Timestamp.fromMillis(now + windowMs * 2) });
      return true;
    }
    if (Number(data.count) >= limit) return false;
    tx.update(ref, { count: Number(data.count) + 1 });
    return true;
  });
}
