import { GoogleGenAI, Modality } from '@google/genai';
import type { WebSocket } from 'ws';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// NOTE: model name and the Live session's exact message shape should be
// double-checked against @google/genai's current docs when this is first
// run for real — the Live API surface has changed across SDK versions and
// this hasn't been exercised against a live connection yet (see design
// doc's Decisions: "Gemini Live API confirmed" covers *that* it's needed,
// not the exact wire format).
const LIVE_MODEL = 'gemini-2.0-flash-live-001';

/**
 * Proxies audio between the extension's WebSocket connection and a Gemini
 * Live API session for one relay session. Resolves with the session's
 * duration in milliseconds once it ends (either side closes), for the
 * caller to log usage.
 */
export async function relayToGemini(clientWs: WebSocket): Promise<number> {
  const startedAt = Date.now();

  return new Promise<number>((resolve, reject) => {
    let session: Awaited<ReturnType<typeof ai.live.connect>> | undefined;
    const finish = () => resolve(Date.now() - startedAt);

    ai.live
      .connect({
        model: LIVE_MODEL,
        config: { responseModalities: [Modality.AUDIO] },
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
