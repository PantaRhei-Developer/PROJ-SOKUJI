import type { LiveServerMessage, LiveServerContent } from '@google/genai';
import {
  IClient,
  ConversationItem,
  SessionConfig,
  ClientEventHandlers,
  ResponseConfig,
  isGeminiSessionConfig,
} from '../interfaces/IClient';
import { Provider, ProviderType } from '../../types/Provider';
import { getPantarheiRelayWsUrl } from '../../utils/environment';

const CONNECT_TIMEOUT_MS = 10000;

/**
 * Relay-managed twin of GeminiClient — same Gemini Live API wire format,
 * but the actual Google connection lives server-side in
 * relay-backend/src/geminiRelay.ts. This client only ever talks to
 * PantaRhei's own relay over a plain WebSocket, authenticating with a
 * Firebase ID token (sent as the connection's first message — a browser's
 * native WebSocket can't set an Authorization header) instead of an API
 * key. See docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md.
 *
 * Deliberately simplified relative to GeminiClient: no automatic
 * reconnection, no session resumption, no Push-to-Talk mode. A dropped
 * connection just ends the session — acceptable for the current small-
 * scale demo (see the design doc's Decisions), not for general
 * production use. If this needs to be resilient later, port
 * GeminiClient's reconnect()/session-resumption logic here rather than
 * rebuilding it from scratch.
 */
export class PantarheiGeminiRelayClient implements IClient {
  private idToken: string;
  private ws: WebSocket | null = null;
  private eventHandlers: ClientEventHandlers = {};
  private conversationItems: ConversationItem[] = [];
  private isConnectedState = false;
  private instanceId: string;
  private textOnlyMode = false;
  private keepReplayAudio = false;

  private currentTurn: {
    inputTranscription: string;
    outputTranscription: string;
    audioData: Int16Array[];
    inputTranscriptionItem?: ConversationItem;
    assistantItem?: ConversationItem;
  } = { inputTranscription: '', outputTranscription: '', audioData: [] };

  constructor(idToken: string) {
    this.idToken = idToken;
    this.instanceId = `pantarhei_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateItemId(type: string): string {
    return `${this.instanceId}_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async connect(config: SessionConfig): Promise<void> {
    if (!isGeminiSessionConfig(config)) {
      throw new Error('PantarheiGeminiRelayClient requires gemini session config');
    }

    this.textOnlyMode = config.textOnly ?? false;
    this.keepReplayAudio = config.keepReplayAudio ?? false;
    this.currentTurn = { inputTranscription: '', outputTranscription: '', audioData: [] };
    this.conversationItems = [];

    const ws = new WebSocket(getPantarheiRelayWsUrl());
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          ws.close();
          reject(new Error('Connection to PantaRhei relay timed out'));
        }
      }, CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', idToken: this.idToken }));
      };

      ws.onmessage = (event) => {
        if (settled) {
          this.handleServerMessage(event);
          return;
        }
        // First message after a successful auth is Gemini's own
        // setupComplete (relayed as-is by geminiRelay.ts) — treat receipt
        // of any message here as "the relay accepted us", not just that
        // specific shape, so we don't over-couple to Gemini's wire format.
        settled = true;
        clearTimeout(timeoutId);
        this.isConnectedState = true;
        this.eventHandlers.onOpen?.();
        this.handleServerMessage(event);
        resolve();
      };

      ws.onerror = (event) => {
        this.eventHandlers.onError?.(event);
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(new Error('WebSocket error connecting to PantaRhei relay'));
        }
      };

      ws.onclose = (event) => {
        this.isConnectedState = false;
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          // Server closes with a specific code before ever sending a
          // message when auth/allowlist/rate-limit rejects the connection
          // (see relay-backend/src/server.ts) — surface the reason.
          reject(new Error(`PantaRhei relay closed the connection: ${event.reason || event.code}`));
          return;
        }
        this.finalizeTurn();
        this.eventHandlers.onClose?.({ code: event.code, reason: event.reason });
      };
    });
  }

  private handleServerMessage(event: MessageEvent): void {
    let message: LiveServerMessage;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      console.error('[PantarheiGeminiRelayClient] Failed to parse relay message:', err);
      return;
    }

    if (message.serverContent) {
      this.handleServerContent(message.serverContent);
    }
  }

  private handleServerContent(serverContent: LiveServerContent): void {
    if ('interrupted' in serverContent) {
      this.eventHandlers.onConversationInterrupted?.();
      this.resetCurrentTurn();
      return;
    }

    if ('turnComplete' in serverContent) {
      this.finalizeTurn();
      this.resetCurrentTurn();
      return;
    }

    if ('inputTranscription' in serverContent && serverContent.inputTranscription?.text) {
      this.currentTurn.inputTranscription += serverContent.inputTranscription.text;
      if (!this.currentTurn.inputTranscriptionItem) {
        this.currentTurn.inputTranscriptionItem = {
          id: this.generateItemId('user'),
          role: 'user',
          type: 'message',
          status: 'in_progress',
          createdAt: Date.now(),
          formatted: { transcript: this.currentTurn.inputTranscription },
        };
        this.conversationItems.push(this.currentTurn.inputTranscriptionItem);
      } else if (this.currentTurn.inputTranscriptionItem.formatted) {
        this.currentTurn.inputTranscriptionItem.formatted.transcript = this.currentTurn.inputTranscription;
      }
      this.eventHandlers.onConversationUpdated?.({ item: this.currentTurn.inputTranscriptionItem });
    }

    if ('outputTranscription' in serverContent && serverContent.outputTranscription?.text) {
      this.currentTurn.outputTranscription += serverContent.outputTranscription.text;
      const item = this.ensureAssistantItem();
      if (item.formatted) {
        item.formatted.transcript = this.currentTurn.outputTranscription;
      }
      this.eventHandlers.onConversationUpdated?.({ item });
    }

    if ('modelTurn' in serverContent && serverContent.modelTurn && !this.textOnlyMode) {
      const audioParts = (serverContent.modelTurn.parts || []).filter(
        (p) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/pcm'),
      );
      if (audioParts.length === 0) return;

      const item = this.ensureAssistantItem();
      const newAudioChunks: Int16Array[] = [];
      for (const part of audioParts) {
        if (!part.inlineData?.data) continue;
        const chunk = base64ToInt16Array(part.inlineData.data);
        newAudioChunks.push(chunk);
        if (this.keepReplayAudio) this.currentTurn.audioData.push(chunk);
      }
      if (newAudioChunks.length === 0) return;

      const combined = concatInt16Arrays(newAudioChunks);
      this.eventHandlers.onConversationUpdated?.({
        item,
        delta: { audio: combined, timestamp: Date.now() },
      });
    }
  }

  private ensureAssistantItem(): ConversationItem {
    if (!this.currentTurn.assistantItem) {
      this.currentTurn.assistantItem = {
        id: this.generateItemId('assistant'),
        role: 'assistant',
        type: 'message',
        status: 'in_progress',
        createdAt: Date.now(),
        formatted: {},
      };
      this.conversationItems.push(this.currentTurn.assistantItem);
    }
    return this.currentTurn.assistantItem;
  }

  private finalizeTurn(): void {
    if (this.currentTurn.inputTranscriptionItem) {
      this.currentTurn.inputTranscriptionItem.status = 'completed';
      this.eventHandlers.onConversationUpdated?.({ item: this.currentTurn.inputTranscriptionItem });
    }
    if (this.currentTurn.assistantItem) {
      this.currentTurn.assistantItem.status = 'completed';
      if (this.keepReplayAudio && this.currentTurn.audioData.length > 0 && this.currentTurn.assistantItem.formatted) {
        this.currentTurn.assistantItem.formatted.audio = concatInt16Arrays(this.currentTurn.audioData);
      }
      this.eventHandlers.onConversationUpdated?.({ item: this.currentTurn.assistantItem });
    }
  }

  private resetCurrentTurn(): void {
    this.currentTurn = { inputTranscription: '', outputTranscription: '', audioData: [] };
  }

  async disconnect(): Promise<void> {
    this.finalizeTurn();
    this.ws?.close();
    this.ws = null;
    this.isConnectedState = false;
  }

  isConnected(): boolean {
    return this.isConnectedState && this.ws?.readyState === WebSocket.OPEN;
  }

  updateSession(_config: Partial<SessionConfig>): void {
    console.warn('[PantarheiGeminiRelayClient] Runtime session updates not supported. Reconnection required.');
  }

  reset(): void {
    this.conversationItems = [];
    this.resetCurrentTurn();
  }

  appendInputAudio(audioData: Int16Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      audio: { mimeType: 'audio/pcm;rate=24000', data: int16ArrayToBase64(audioData) },
    }));
  }

  appendInputText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !text.trim()) return;
    const trimmed = text.trim();
    const item: ConversationItem = {
      id: this.generateItemId('user_text'),
      role: 'user',
      type: 'message',
      status: 'completed',
      createdAt: Date.now(),
      formatted: { text: trimmed, transcript: trimmed },
    };
    this.conversationItems.push(item);
    this.eventHandlers.onConversationUpdated?.({ item });
    this.ws.send(JSON.stringify({ text: trimmed }));
  }

  createResponse(_config?: ResponseConfig): void {
    // Gemini Live API generates responses automatically based on turn
    // detection — no explicit trigger needed (same as GeminiClient's
    // auto-mode behavior; PTT mode is not implemented here).
  }

  cancelResponse(_trackId?: string, _offset?: number): void {
    console.warn('[PantarheiGeminiRelayClient] Response cancellation not supported');
  }

  getConversationItems(): ConversationItem[] {
    return [...this.conversationItems];
  }

  clearConversationItems(): void {
    this.conversationItems = [];
    this.resetCurrentTurn();
  }

  setEventHandlers(handlers: ClientEventHandlers): void {
    this.eventHandlers = { ...handlers };
  }

  getProvider(): ProviderType {
    return Provider.PANTARHEI_GEMINI;
  }
}

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function int16ArrayToBase64(data: Int16Array): string {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function concatInt16Arrays(chunks: Int16Array[]): Int16Array {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Int16Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}
