import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { verifyIdToken } from './auth.js';
import { isAllowed } from './allowlist.js';
import { tryAcquireSession, releaseSession } from './rateLimit.js';
import { relayToGemini } from './geminiRelay.js';
import { logUsage } from './usageLog.js';

const PORT = Number(process.env.PORT) || 8080;
const AUTH_TIMEOUT_MS = 5000;

interface AuthMessage {
  type: 'auth';
  idToken: string;
  instructions?: string;
}

function isAuthMessage(value: unknown): value is AuthMessage {
  if (
    typeof value !== 'object' ||
    value === null ||
    (value as Record<string, unknown>).type !== 'auth' ||
    typeof (value as Record<string, unknown>).idToken !== 'string'
  ) {
    return false;
  }
  const instructions = (value as Record<string, unknown>).instructions;
  return instructions === undefined || typeof instructions === 'string';
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SOKUJI Allo relay backend');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  let authenticatedUid: string | undefined;

  // A browser WebSocket client can't set an Authorization header on the
  // handshake request, so the Firebase ID token is sent as the first
  // message over the socket instead (see design doc's Decisions —
  // this differs from the doc's original "Authorization: Bearer" sketch,
  // which isn't reachable from the extension's native WebSocket client).
  const authTimeout = setTimeout(() => {
    if (!authenticatedUid) ws.close(4001, 'auth timeout');
  }, AUTH_TIMEOUT_MS);

  ws.once('message', async (data) => {
    try {
      const parsed: unknown = JSON.parse(data.toString());
      if (!isAuthMessage(parsed)) {
        ws.close(4000, 'first message must be an auth message');
        return;
      }

      const decoded = await verifyIdToken(parsed.idToken);
      if (!decoded.email || !(await isAllowed(decoded.email))) {
        ws.close(4003, 'not allowed');
        return;
      }

      if (!tryAcquireSession(decoded.uid)) {
        ws.close(4029, 'rate limited');
        return;
      }

      authenticatedUid = decoded.uid;
      clearTimeout(authTimeout);

      const durationMs = await relayToGemini(ws, parsed.instructions);
      await logUsage(authenticatedUid, durationMs);
    } catch (error) {
      console.error('[relay] session error:', error);
      ws.close(4500, 'internal error');
    } finally {
      if (authenticatedUid) releaseSession(authenticatedUid);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[relay] listening on :${PORT}`);
});
