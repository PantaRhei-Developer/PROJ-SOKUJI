import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Mic } from 'lucide-react';
import logo from '../../assets/logo.png';
import ConversationRow from '../../components/ConversationRow/ConversationRow';
import { useOnboarding } from '../../context/OnboardingContext';
import './Session.scss';

function Session() {
  const navigate = useNavigate();
  const { spokenLanguage, targetLanguage } = useOnboarding();

  return (
    <div className="session">
      <header className="session__top-bar">
        <div className="session__brand">
          <img src={logo} alt="SOKUJI Allo" className="session__logo" />
          <span className="session__name">SOKUJI Allo</span>
        </div>
        <button
          type="button"
          className="session__settings-button"
          onClick={() => navigate('/settings')}
          aria-label="設定"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      <div className="session__conversation">
        <ConversationRow lang={spokenLanguage.toUpperCase()} text="これはサンプルの文章です。" isTranslation={false} time="09:41" />
        <ConversationRow lang={targetLanguage.toUpperCase()} text="This is a sample sentence." isTranslation time="09:41" />
        <p className="session__placeholder">ここに会話が表示されます。</p>
      </div>

      <footer className="session__status-bar">
        <Mic size={20} className="session__mic-icon" />
        <span className="session__status-text">セッション中（プレースホルダー）</span>
      </footer>
    </div>
  );
}

export default Session;
