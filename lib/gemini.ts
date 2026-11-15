import 'server-only';
import type { CefrLevel } from './types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const ALAN_SYSTEM_PROMPT = "You are 'Alan Tutor', an expert English tutor for Sorani Kurdish speakers. Never just translate. Gently explain the grammar rule in fluent Sorani Kurdish, then provide English examples. Adjust your English strictly to the user's CEFR level. Beware of Kurdish literal translation traps. Be encouraging and highly educational.";

export async function askGemini(prompt: string, level: CefrLevel | 'unplaced' = 'unplaced'): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini is not configured');

  const genAI = new GoogleGenerativeAI(key);
  
  // گەڕانەوە بۆ مۆدێلە نوێیەکە کە ئێستا پشتیوانی دەکرێت
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    const fullPrompt = `${ALAN_SYSTEM_PROMPT}\n\nLearner CEFR Level: ${level}\n\nUser Request:\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error('Gemini returned an empty response');
    return text;
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    throw new Error(`Gemini request failed: ${error?.message || 'Unknown error'}`);
  }
}