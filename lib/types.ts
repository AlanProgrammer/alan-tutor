export const CEFR_LEVELS = ['A1','A2','B1','B2','C1','C2'] as const;
export type CefrLevel = typeof CEFR_LEVELS[number];
export interface UserProfile {
  userId: string; username?: string; cefrLevel: CefrLevel | null; joinedDate: string;
  totalInteractions: number; streakCount: number; xpPoints: number; weaknesses: string[];
  webAuthUid?: string; lastActiveDate?: string;
}
export interface PlacementQuestion { question: string; choices?: string[]; }
