import { useNavigate } from 'react-router-dom';
import BackLink from '../../components/common/BackLink';
import { useOnboarding } from '../../context/OnboardingContext';
import { languageLabel } from '../../data/languages';
import { modeLabel } from '../../utils/modeLabel';
import './Settings.scss';

function Settings() {
  const navigate = useNavigate();
  const { mode, spokenLanguage, targetLanguage, microphoneLabel, speakerLabel } = useOnboarding();

  return (
    <div className="settings">
      <BackLink to="/session" label="← セッションに戻る" />
      <h1 className="settings__title">設定</h1>

      <div className="settings__row">
        <span>モード：{modeLabel(mode)}</span>
        <button type="button" className="settings__change" onClick={() => navigate('/mode-select')}>
          変更
        </button>
      </div>

      <div className="settings__row">
        <span>
          言語：{languageLabel(spokenLanguage)} → {languageLabel(targetLanguage)}
        </span>
        <button type="button" className="settings__change" onClick={() => navigate('/setup/language')}>
          変更
        </button>
      </div>

      <div className="settings__row">
        <span>
          デバイス：{microphoneLabel} / {speakerLabel}
        </span>
        <button type="button" className="settings__change" onClick={() => navigate('/setup/audio')}>
          変更
        </button>
      </div>
    </div>
  );
}

export default Settings;
