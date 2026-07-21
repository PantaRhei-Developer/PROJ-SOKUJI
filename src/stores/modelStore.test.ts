import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modelManifest functions
const mockGetManifestEntry = vi.fn();
const mockGetAsrModelsForLanguage = vi.fn();
const mockGetTranslationModel = vi.fn();
const mockGetManifestByType = vi.fn();
const mockGetTtsModelsForLanguage = vi.fn();

vi.mock('../lib/local-inference/modelManifest', () => ({
  MODEL_MANIFEST: [],
  getManifestEntry: (...args: any[]) => mockGetManifestEntry(...args),
  getManifestByType: (...args: any[]) => mockGetManifestByType(...args),
  getAsrModelsForLanguage: (...args: any[]) => mockGetAsrModelsForLanguage(...args),
  getTranslationModel: (...args: any[]) => mockGetTranslationModel(...args),
  getTtsModelsForLanguage: (...args: any[]) => mockGetTtsModelsForLanguage(...args),
  isTranslationModelCompatible: vi.fn(() => true),
  isAstCompatible: vi.fn(() => false),
  // Same ranking as the real implementation: recommended first, then lower sortOrder.
  pickBestModel: (candidates: any[]) => {
    if (candidates.length === 0) return undefined;
    return candidates.reduce((best, m) => {
      if (m.recommended && !best.recommended) return m;
      if (!m.recommended && best.recommended) return best;
      return (m.sortOrder ?? 0) < (best.sortOrder ?? 0) ? m : best;
    });
  },
}));

vi.mock('../lib/local-inference/modelStorage', () => ({
  init: vi.fn(),
  getModelStatus: vi.fn(),
  clearAll: vi.fn(),
}));

vi.mock('../lib/local-inference/ModelManager', () => ({
  ModelManager: { getInstance: vi.fn() },
}));

vi.mock('../utils/webgpu', () => ({
  checkWebGPU: vi.fn().mockResolvedValue(false),
}));

const { useModelStore } = await import('./modelStore');

describe('getParticipantModelStatus', () => {
  // Reusable model fixtures
  const sensevoice = { id: 'sensevoice-int8', type: 'asr', languages: ['ja', 'en', 'zh'], multilingual: true };
  const whisperEn = { id: 'whisper-en', type: 'asr', languages: ['en'], multilingual: false };
  const opusMtEnJa = { id: 'opus-mt-en-ja', type: 'translation', languages: ['en', 'ja'], sourceLang: 'en', targetLang: 'ja' };
  const opusMtJaEn = { id: 'opus-mt-ja-en', type: 'translation', languages: ['ja', 'en'], sourceLang: 'ja', targetLang: 'en' };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no models. Tests override per-type as needed.
    mockGetManifestByType.mockReturnValue([]);
  });

  // Helper: set up getManifestByType to return models by type
  function setupManifest(models: any[]) {
    mockGetManifestByType.mockImplementation((type: string) =>
      models.filter(m => m.type === type)
    );
  }

  it('returns available status when current ASR supports target lang and translation model exists', () => {
    useModelStore.setState({
      modelStatuses: { 'sensevoice-int8': 'downloaded', 'opus-mt-en-ja': 'downloaded' },
    });
    setupManifest([sensevoice, opusMtEnJa]);

    const status = useModelStore.getState().getParticipantModelStatus('ja', 'en', 'sensevoice-int8');

    expect(status.asrAvailable).toBe(true);
    expect(status.asrModelId).toBe('sensevoice-int8');
    expect(status.asrFallback).toBe(false);
    expect(status.translationAvailable).toBe(true);
    expect(status.translationModelId).toBe('opus-mt-en-ja');
  });

  it('falls back to alternative ASR when current model does not support target lang', () => {
    useModelStore.setState({
      modelStatuses: { 'whisper-en': 'downloaded', 'sensevoice-int8': 'downloaded', 'opus-mt-ja-en': 'downloaded' },
    });
    setupManifest([whisperEn, sensevoice, opusMtJaEn]);

    // sourceLang='en', targetLang='ja' → participant source='ja', needs ASR for 'ja'
    const status = useModelStore.getState().getParticipantModelStatus('en', 'ja', 'whisper-en');

    expect(status.asrAvailable).toBe(true);
    expect(status.asrModelId).toBe('sensevoice-int8');
    expect(status.asrFallback).toBe(true);
    expect(status.asrOriginalModelId).toBe('whisper-en');
  });

  it('returns asrAvailable=false when no ASR model supports participant source lang', () => {
    useModelStore.setState({
      modelStatuses: { 'whisper-en': 'downloaded' },
    });
    setupManifest([whisperEn]);

    const status = useModelStore.getState().getParticipantModelStatus('en', 'ja', 'whisper-en');

    expect(status.asrAvailable).toBe(false);
    expect(status.asrModelId).toBeNull();
  });

  it('returns translationAvailable=false when no translation model supports reverse direction', () => {
    useModelStore.setState({
      modelStatuses: { 'sensevoice-int8': 'downloaded' },
    });
    setupManifest([sensevoice]); // no translation models at all

    const status = useModelStore.getState().getParticipantModelStatus('ja', 'en', 'sensevoice-int8');

    expect(status.asrAvailable).toBe(true);
    expect(status.translationAvailable).toBe(false);
    expect(status.translationModelId).toBeNull();
  });

  it('returns translationAvailable=false when reverse translation model exists but not downloaded', () => {
    useModelStore.setState({
      modelStatuses: { 'sensevoice-int8': 'downloaded', 'opus-mt-en-ja': 'not_downloaded' },
    });
    setupManifest([sensevoice, opusMtEnJa]);

    const status = useModelStore.getState().getParticipantModelStatus('ja', 'en', 'sensevoice-int8');

    expect(status.asrAvailable).toBe(true);
    expect(status.translationAvailable).toBe(false);
    expect(status.translationModelId).toBeNull();
  });
});

describe('rememberModels / recallModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModelStore.setState({ modelPreferences: {} });
  });

  it('remembers and recalls models for a language pair', () => {
    useModelStore.setState({
      modelStatuses: {
        'sensevoice-int8': 'downloaded',
        'opus-mt-ja-en': 'downloaded',
        'piper-en': 'downloaded',
      },
    });

    useModelStore.getState().rememberModels('ja', 'en', 'sensevoice-int8', 'opus-mt-ja-en', 'piper-en');
    const recalled = useModelStore.getState().recallModels('ja', 'en');

    expect(recalled).toEqual({
      asrModel: 'sensevoice-int8',
      translationModel: 'opus-mt-ja-en',
      ttsModel: 'piper-en',
    });
  });

  it('returns null when no record exists', () => {
    const recalled = useModelStore.getState().recallModels('ja', 'en');
    expect(recalled).toBeNull();
  });

  it('treats different directions as separate keys', () => {
    useModelStore.setState({
      modelStatuses: {
        'sensevoice-int8': 'downloaded',
        'opus-mt-ja-en': 'downloaded',
        'opus-mt-en-ja': 'downloaded',
        'piper-en': 'downloaded',
        'piper-ja': 'downloaded',
      },
    });

    useModelStore.getState().rememberModels('ja', 'en', 'sensevoice-int8', 'opus-mt-ja-en', 'piper-en');
    useModelStore.getState().rememberModels('en', 'ja', 'sensevoice-int8', 'opus-mt-en-ja', 'piper-ja');

    const jaEn = useModelStore.getState().recallModels('ja', 'en');
    const enJa = useModelStore.getState().recallModels('en', 'ja');

    expect(jaEn!.translationModel).toBe('opus-mt-ja-en');
    expect(enJa!.translationModel).toBe('opus-mt-en-ja');
    expect(jaEn!.ttsModel).toBe('piper-en');
    expect(enJa!.ttsModel).toBe('piper-ja');
  });

  it('degrades per-field when a model is deleted', () => {
    useModelStore.setState({
      modelStatuses: {
        'sensevoice-int8': 'downloaded',
        'opus-mt-ja-en': 'downloaded',
        'piper-en': 'downloaded',
      },
    });

    useModelStore.getState().rememberModels('ja', 'en', 'sensevoice-int8', 'opus-mt-ja-en', 'piper-en');

    useModelStore.setState({
      modelStatuses: {
        'sensevoice-int8': 'downloaded',
        'opus-mt-ja-en': 'downloaded',
        'piper-en': 'not_downloaded',
      },
    });

    const recalled = useModelStore.getState().recallModels('ja', 'en');

    expect(recalled).not.toBeNull();
    expect(recalled!.asrModel).toBe('sensevoice-int8');
    expect(recalled!.translationModel).toBe('opus-mt-ja-en');
    expect(recalled!.ttsModel).toBe('');
  });

  it('degrades all fields when all models deleted', () => {
    useModelStore.setState({
      modelStatuses: {
        'sensevoice-int8': 'downloaded',
        'opus-mt-ja-en': 'downloaded',
        'piper-en': 'downloaded',
      },
    });

    useModelStore.getState().rememberModels('ja', 'en', 'sensevoice-int8', 'opus-mt-ja-en', 'piper-en');

    useModelStore.setState({
      modelStatuses: {
        'sensevoice-int8': 'not_downloaded',
        'opus-mt-ja-en': 'not_downloaded',
        'piper-en': 'not_downloaded',
      },
    });

    const recalled = useModelStore.getState().recallModels('ja', 'en');
    expect(recalled).not.toBeNull();
    expect(recalled!.asrModel).toBe('');
    expect(recalled!.translationModel).toBe('');
    expect(recalled!.ttsModel).toBe('');
  });
});

describe('getMissingModelsForLanguagePair', () => {
  const sensevoice = { id: 'sensevoice-int8', type: 'asr', languages: ['ja', 'en'], multilingual: true, recommended: true, sortOrder: 0 };
  const opusMtJaEn = { id: 'opus-mt-ja-en', type: 'translation', languages: ['ja', 'en'], sourceLang: 'ja', targetLang: 'en' };
  const edgeTts = { id: 'edge-tts-en', type: 'tts', languages: ['en'], multilingual: false, isCloudModel: true };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTtsModelsForLanguage.mockReturnValue([]);
    useModelStore.setState({ modelStatuses: {}, webgpuAvailable: true });
  });

  it('returns everything needed when nothing is downloaded yet', () => {
    mockGetAsrModelsForLanguage.mockReturnValue([sensevoice]);
    mockGetTranslationModel.mockReturnValue(opusMtJaEn);
    mockGetTtsModelsForLanguage.mockReturnValue([edgeTts]);

    const result = useModelStore.getState().getMissingModelsForLanguagePair('ja', 'en');

    expect(result.asr?.id).toBe('sensevoice-int8');
    expect(result.translation?.id).toBe('opus-mt-ja-en');
    // Cloud TTS needs no download, so it's not "missing" even though nothing downloaded.
    expect(result.tts).toBeUndefined();
    expect(result.noCompatibleModel).toBe(false);
  });

  it('returns nothing missing once everything is downloaded or cloud', () => {
    mockGetAsrModelsForLanguage.mockReturnValue([sensevoice]);
    mockGetTranslationModel.mockReturnValue(opusMtJaEn);
    mockGetTtsModelsForLanguage.mockReturnValue([edgeTts]);
    useModelStore.setState({
      modelStatuses: { 'sensevoice-int8': 'downloaded', 'opus-mt-ja-en': 'downloaded' },
    });

    const result = useModelStore.getState().getMissingModelsForLanguagePair('ja', 'en');

    expect(result.asr).toBeUndefined();
    expect(result.translation).toBeUndefined();
    expect(result.tts).toBeUndefined();
    expect(result.noCompatibleModel).toBe(false);
  });

  it('flags noCompatibleModel when no translation model exists for the pair', () => {
    mockGetAsrModelsForLanguage.mockReturnValue([sensevoice]);
    mockGetTranslationModel.mockReturnValue(undefined);
    mockGetTtsModelsForLanguage.mockReturnValue([edgeTts]);

    const result = useModelStore.getState().getMissingModelsForLanguagePair('ja', 'xx');

    expect(result.translation).toBeUndefined();
    expect(result.noCompatibleModel).toBe(true);
  });
});
