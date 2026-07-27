import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PantarheiGeminiRelayClient } from './PantarheiGeminiRelayClient';
import type { GeminiSessionConfig } from '../interfaces/IClient';

vi.mock('../../utils/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/environment')>();
  return {
    ...actual,
    getPantarheiRelayWsUrl: () => 'wss://relay.example.test',
  };
});

class MockWebSocket {
  static OPEN = 1;
  static instances: MockWebSocket[] = [];

  sent: string[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {}

  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }
}

// @ts-expect-error - test-only global WebSocket stand-in
global.WebSocket = MockWebSocket;

function buildConfig(instructions: string): GeminiSessionConfig {
  return {
    provider: 'gemini',
    model: 'gemini-live',
    instructions,
    turnDetectionMode: 'Auto',
    vadStartSensitivity: 'high',
    vadEndSensitivity: 'high',
    vadSilenceDurationMs: 500,
    vadPrefixPaddingMs: 100,
  };
}

describe('PantarheiGeminiRelayClient', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
  });

  it('sends the session instructions (language pair) alongside the auth message', async () => {
    const client = new PantarheiGeminiRelayClient('test-id-token');
    const connectPromise = client.connect(buildConfig('Translate from Japanese to English.'));

    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();
    ws.onmessage?.({ data: JSON.stringify({ serverContent: {} }) });

    await connectPromise;

    expect(ws.sent).toHaveLength(1);
    const authMessage = JSON.parse(ws.sent[0]);
    expect(authMessage).toEqual({
      type: 'auth',
      idToken: 'test-id-token',
      instructions: 'Translate from Japanese to English.',
    });
  });
});
