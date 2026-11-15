import 'server-only';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length) return getApps()[0]!;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  let serviceAccount: ServiceAccount;
  try { serviceAccount = JSON.parse(raw) as ServiceAccount; }
  catch { throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON'); }
  return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.projectId });
}
export const adminApp = () => initAdmin();
export const adminDb = () => getFirestore(initAdmin());
