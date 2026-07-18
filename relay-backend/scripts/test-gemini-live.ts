// Standalone check that GEMINI_API_KEY + the model name in
// src/geminiRelay.ts actually work, without needing the rest of the relay
// (auth, allowlist, a real client). Run with:
//   node --env-file=.env --import tsx/esm scripts/test-gemini-live.ts

import { GoogleGenAI, Modality } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const MODEL = 'gemini-3.5-live-translate-preview';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

console.log(`Connecting to Gemini Live API (${MODEL})...`);

const session = await ai.live.connect({
  model: MODEL,
  config: { responseModalities: [Modality.AUDIO] },
  callbacks: {
    onopen: () => console.log('✅ Connected successfully.'),
    onmessage: (message) => console.log('Received message:', message),
    onerror: (error) => {
      console.error('❌ Connection error:', error);
      process.exit(1);
    },
    onclose: (event) => {
      console.log('Connection closed:', event?.reason ?? '(no reason given)');
      process.exit(0);
    },
  },
});

// Close after a few seconds — this script only checks that the connection
// itself succeeds, it doesn't send real audio.
setTimeout(() => {
  console.log('No errors after 5s — closing.');
  session.close();
}, 5000);
