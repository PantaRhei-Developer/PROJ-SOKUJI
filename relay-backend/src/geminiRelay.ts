import { GoogleGenAI, Modality } from '@google/genai';
import type { WebSocket } from 'ws';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Confirmed working against a real connection via scripts/test-gemini-live.ts
// — this API key's available bidiGenerateContent (Live API) models were
// listed with scripts/list-models.ts; this one is purpose-built for
// translation, matching this relay's use case.
const LIVE_MODEL = 'gemini-3.5-live-translate-preview';

/**
 * Proxies audio between the extension's WebSocket connection and a Gemini
 * Live API session for one relay session. Resolves with the session's
 * duration in milliseconds once it ends (either side closes), for the
 * caller to log usage.
 *
 * `instructions` carries the client's source/target language pair (the same
 * string GeminiClient.ts sends directly to Google as `systemInstruction`).
 * Without it, this preview model falls back to whatever language behavior
 * it defaults to regardless of what the user selected in the UI.
 */
export async function relayToGemini(clientWs: WebSocket, instructions?: string): Promise<number> {
  const startedAt = Date.now();

  return new Promise<number>((resolve, reject) => {
    let session: Awaited<ReturnType<typeof ai.live.connect>> | undefined;
    const finish = () => resolve(Date.now() - startedAt);

    ai.live
      .connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          ...(instructions ? { systemInstruction: { parts: [{ text: instructions }] } } : {}),
        },
        callbacks: {
          onopen: () => {
            // Ready to receive audio from the client.
          },
          onmessage: (message) => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify(message));
            }
          },
          onerror: (error) => {
            reject(error instanceof Error ? error : new Error(String(error)));
          },
          onclose: finish,
        },
      })
      .then((s) => {
        session = s;
      })
      .catch(reject);

    clientWs.on('message', (data) => {
      if (!session) return;
      const parsed = JSON.parse(data.toString());
      session.sendRealtimeInput(parsed);
    });

    clientWs.on('close', () => {
      session?.close();
      finish();
    });

    clientWs.on('error', (error) => {
      session?.close();
      reject(error);
    });
  });
}
