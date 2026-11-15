import 'server-only';
import { ALAN_SYSTEM_PROMPT } from './gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function askGeminiWithMedia(instruction: string, mimeType: string, data: Buffer, level: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini is not configured');

  const genAI = new GoogleGenerativeAI(key);
  // بەکارهێنانی هەمان مۆدێلی نوێ کە لە فایلەکەی تریشدا داماننا
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    const fullPrompt = `${ALAN_SYSTEM_PROMPT}\n\nLearner CEFR Level: ${level}\n\nUser Request:\n${instruction}`;
    
    // ئامادەکردنی وێنەکە یان دەنگەکە بە فۆرماتی گونجاو بۆ پاکێجە نوێیەکە
    const mediaPart = {
      inlineData: {
        data: data.toString("base64"),
        mimeType
      }
    };

    const result = await model.generateContent([fullPrompt, mediaPart]);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error('Gemini returned an empty media response');
    return text;
  } catch (error: any) {
    console.error("Gemini Media API Error details:", error);
    throw new Error(`Gemini media request failed: ${error?.message || 'Unknown error'}`);
  }
}