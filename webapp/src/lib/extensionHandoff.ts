export type ExtensionHandoffResult = 'delivered' | 'no-extension';

const HANDOFF_TIMEOUT_MS = 800;

interface SetModeMessage {
  type: 'sokuji-allo/set-mode';
  mode: 'local' | 'api';
  idToken: string;
}

// chrome.runtime.sendMessage to an extension ID with no listening extension
// does not reliably reject/callback promptly, so this races the call against
// a timeout rather than trusting chrome.runtime.lastError alone.
interface ChromeRuntime {
  sendMessage(extensionId: string, message: SetModeMessage, callback: (response: unknown) => void): void;
  lastError?: { message?: string };
}

export function sendModeToExtension(mode: 'local' | 'api', idToken: string): Promise<ExtensionHandoffResult> {
  const extensionId = import.meta.env.VITE_SOKUJI_EXTENSION_ID;
  const runtime = (globalThis as { chrome?: { runtime?: ChromeRuntime } }).chrome?.runtime;

  if (!extensionId || typeof runtime?.sendMessage !== 'function') {
    return Promise.resolve('no-extension');
  }

  const message: SetModeMessage = { type: 'sokuji-allo/set-mode', mode, idToken };

  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: ExtensionHandoffResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const timeoutId = setTimeout(() => settle('no-extension'), HANDOFF_TIMEOUT_MS);

    try {
      runtime.sendMessage(extensionId, message, () => {
        clearTimeout(timeoutId);
        settle(runtime.lastError ? 'no-extension' : 'delivered');
      });
    } catch {
      clearTimeout(timeoutId);
      settle('no-extension');
    }
  });
}
