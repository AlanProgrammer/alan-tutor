'use client';
import { create } from 'zustand';
export type TutorMood='idle'|'speaking'|'happy'|'encouraging';
interface TutorState {mood:TutorMood;setMood:(mood:TutorMood)=>void;}
export const useTutorStore=create<TutorState>(set=>({mood:'idle',setMood:mood=>set({mood})}));
