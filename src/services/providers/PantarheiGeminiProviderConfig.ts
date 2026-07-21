import { GeminiProviderConfig } from './GeminiProviderConfig';
import { ProviderConfig } from './ProviderConfig';

/**
 * PantaRhei Gemini — the relay-managed twin of Gemini. Same protocol/UI,
 * but authenticated by a Firebase ID token and routed through PantaRhei's
 * own relay backend (handled in ClientFactory), not the user's own API key.
 * See docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md.
 */
export class PantarheiGeminiProviderConfig extends GeminiProviderConfig {
  getConfig(): ProviderConfig {
    const base = super.getConfig();
    return {
      ...base,
      id: 'pantarhei_gemini',
      displayName: 'PantaRhei Gemini',
      requiresAuth: true,
      apiKeyLabel: 'PantaRhei Account',
      apiKeyPlaceholder: 'Authentication managed automatically',
    };
  }
}
