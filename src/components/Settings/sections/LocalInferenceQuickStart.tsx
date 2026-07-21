import { useMemo, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Download, Loader } from 'lucide-react';
import {
  useModelStatuses,
  useModelDownloads,
  useGetMissingModelsForLanguagePair,
  useModelStore,
} from '../../../stores/modelStore';
import { useUpdateLocalInference } from '../../../stores/settingsStore';
import { getModelSizeMb } from '../../../lib/local-inference/modelManifest';

interface LocalInferenceQuickStartProps {
  sourceLanguage: string;
  targetLanguage: string;
  onNavigateToDetails: () => void;
}

/**
 * Replaces the old "download ASR / download Translation / download TTS"
 * three-separate-links flow (jargon-heavy, no combined progress) with one
 * button that downloads everything this language pair needs. Falls back to
 * the detailed per-type view (via onNavigateToDetails) only when no
 * compatible model exists at all for the pair — a genuinely exotic language
 * combination, not the common "nothing downloaded yet" case.
 */
function LocalInferenceQuickStart({ sourceLanguage, targetLanguage, onNavigateToDetails }: LocalInferenceQuickStartProps) {
  const { t } = useTranslation();
  const modelStatuses = useModelStatuses();
  const downloads = useModelDownloads();
  const getMissingModels = useGetMissingModelsForLanguagePair();
  const updateLocalInference = useUpdateLocalInference();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = useMemo(
    () => getMissingModels(sourceLanguage, targetLanguage),
    // modelStatuses is read for its reactivity — getMissingModels reads the
    // store's current state internally, so this dependency is what makes
    // the memo recompute as downloads complete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceLanguage, targetLanguage, getMissingModels, modelStatuses],
  );
  const missingEntries = [missing.asr, missing.translation, missing.tts].filter(
    (entry): entry is NonNullable<typeof entry> => !!entry,
  );

  const totalMb = useMemo(
    () => missingEntries.reduce((sum, entry) => sum + getModelSizeMb(entry), 0),
    [missingEntries],
  );

  const combinedPercent = useMemo(() => {
    if (missingEntries.length === 0) return 0;
    let downloadedUnits = 0;
    for (const entry of missingEntries) {
      const d = downloads[entry.id];
      if (modelStatuses[entry.id] === 'downloaded') {
        downloadedUnits += 1;
      } else if (d && d.totalBytes > 0) {
        downloadedUnits += d.downloadedBytes / d.totalBytes;
      }
    }
    return Math.round((downloadedUnits / missingEntries.length) * 100);
  }, [missingEntries, downloads, modelStatuses]);

  // No compatible model exists at all for this pair (rare — an exotic
  // language combination), rather than "nothing downloaded yet". This quick
  // start has nothing to offer; hand off to the detailed per-type view.
  if (missing.noCompatibleModel) {
    return (
      <div className="validation-message error">
        <Trans
          i18nKey="settings.localInferenceModelsRequired"
          components={{
            settingsLink: <a className="models-link" onClick={(e) => { e.preventDefault(); onNavigateToDetails(); }} />,
          }}
        />
      </div>
    );
  }

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      for (const entry of missingEntries) {
        await useModelStore.getState().downloadModel(entry.id);
      }
      // Persist the newly-downloaded models as this pair's selection —
      // reuses the same correction logic SettingsInitializer already
      // triggers on language change, so Settings reflects reality afterward
      // instead of relying purely on isProviderReady's "any downloaded
      // model" fallback with an empty stored selection.
      const corrections = useModelStore.getState().autoSelectModels(sourceLanguage, targetLanguage, '', '', '');
      if (corrections) {
        updateLocalInference(corrections);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="local-inference-quick-start">
      {!isDownloading && (
        <p className="quick-start-description">
          {t('settings.localInferenceQuickStart.description', 'This language pair needs a one-time download (~{{size}}MB) before it can be used.', { size: totalMb })}
        </p>
      )}
      {error && <p className="quick-start-error">{error}</p>}
      <button type="button" className="quick-start-button" onClick={handleDownloadAll} disabled={isDownloading}>
        {isDownloading ? (
          <>
            <Loader size={14} className="spinner" />
            <span>{t('settings.localInferenceQuickStart.downloading', 'Downloading... {{percent}}%', { percent: combinedPercent })}</span>
          </>
        ) : (
          <>
            <Download size={14} />
            <span>{t('settings.localInferenceQuickStart.button', 'Download and get started')}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default LocalInferenceQuickStart;
