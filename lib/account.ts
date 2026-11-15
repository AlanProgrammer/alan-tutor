import 'server-only';
import { getAuth } from 'firebase-admin/auth';
import type { DocumentReference } from 'firebase-admin/firestore';
import { adminApp,adminDb } from './firebase-admin';

export async function verifiedUid(authorization:string|null):Promise<string|null>{if(!authorization?.startsWith('Bearer '))return null;try{return(await getAuth(adminApp()).verifyIdToken(authorization.slice(7))).uid;}catch{return null;}}
export async function canonicalUserId(telegramId:string):Promise<string>{const db=adminDb();const link=await db.collection('telegram_accounts').doc(telegramId).get();return typeof link.data()?.firebaseUid==='string'?link.data()!.firebaseUid as string:telegramId;}
export async function awardActivity(userRef:DocumentReference,points=0){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 await adminDb().runTransaction(async tx=>{const snap=await tx.get(userRef);const p=snap.data()??{};const last=String(p.lastActiveDate??'');let streak=Number(p.streakCount??0);if(last!==today){const d=new Date(`${today}T00:00:00Z`);d.setUTCDate(d.getUTCDate()-1);const yesterday=d.toISOString().slice(0,10);streak=last===yesterday?streak+1:1;}tx.set(userRef,{lastActiveDate:today,streakCount:streak,xpPoints:Number(p.xpPoints??0)+points,totalInteractions:Number(p.totalInteractions??0)+1},{merge:true});});
}
