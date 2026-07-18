// One-off script to discover which model names this API key can actually
// use for the Live API (bidiGenerateContent). Run with:
//   node --env-file=.env --import tsx/esm scripts/list-models.ts

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const pager = await ai.models.list();
for await (const model of pager) {
  const methods = model.supportedActions ?? [];
  if (methods.some((m) => m.toLowerCase().includes('bidi'))) {
    console.log(model.name, '—', methods.join(', '));
  }
}
