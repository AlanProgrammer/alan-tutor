import { NextRequest,NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifiedUid } from '@/lib/account';
import { enforceRateLimit } from '@/lib/rate-limit';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const uid=await verifiedUid(req.headers.get('authorization'));if(!uid)return NextResponse.json({error:'Sign in required'},{status:401});if(!await enforceRateLimit(`link_${uid}`,5,60_000))return NextResponse.json({error:'Please wait before requesting another code.'},{status:429});
 const db=adminDb(),bot=process.env.TELEGRAM_BOT_USERNAME;if(!bot)return NextResponse.json({error:'Telegram bot username is not configured.'},{status:503});
 for(let i=0;i<5;i++){const code=String(randomInt(0,1_000_000)).padStart(6,'0'),ref=db.collection('link_codes').doc(code),expiresAt=Timestamp.fromMillis(Date.now()+10*60_000);const created=await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(snap.exists&&snap.data()?.expiresAt instanceof Timestamp&&snap.data()!.expiresAt.toMillis()>Date.now())return false;tx.set(ref,{firebaseUid:uid,createdAt:Timestamp.now(),expiresAt,used:false});return true;});if(created)return NextResponse.json({code,expiresAt:expiresAt.toDate().toISOString(),url:`https://t.me/${bot.replace(/^@/,'')}?start=link_${code}`});}
 return NextResponse.json({error:'Could not allocate a code. Try again.'},{status:503});
 }catch(e){console.error('Link code generation failed',e);return NextResponse.json({error:'Could not create a link code.'},{status:503});}}
