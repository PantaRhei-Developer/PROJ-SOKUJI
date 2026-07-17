import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import ModeCard from '../../components/ModeCard/ModeCard';
import PrimaryButton from '../../components/common/PrimaryButton';
import BackLink from '../../components/common/BackLink';
import { useOnboarding } from '../../context/OnboardingContext';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { sendModeToExtension } from '../../lib/extensionHandoff';
import './ModeSelect.scss';

const SOKUJI_CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/ppmihnhelgfpjomhjhpecobloelicnak';

type HandoffState = 'idle' | 'sending' | 'delivered' | 'fallback';

function ModeSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, setMode } = useOnboarding();
  const [handoffState, setHandoffState] = useState<HandoffState>('idle');

  async function handleNext() {
    if (!mode) return;
    setHandoffState('sending');
    const result = await sendModeToExtension(mode);
    setHandoffState(result === 'delivered' ? 'delivered' : 'fallback');
  }

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <div className="mode-select">
      <div className="mode-select__account">
        <span>{user?.email}</span>
        <button type="button" className="mode-select__logout" onClick={handleLogout}>
          ログアウト
        </button>
      </div>
      <h1 className="mode-select__title">翻訳方式を選んでください</h1>
      <p className="mode-select__subtitle">設定は後から変更できます。</p>

      <div className="mode-select__cards">
        <ModeCard
          title="ローカルモデル"
          tagline="無料・高速"
          bullets={['無料', '高速レスポンス', '初回起動時に約4GBのダウンロードが必要']}
          selected={mode === 'local'}
          onSelect={() => setMode('local')}
        />
        <ModeCard
          title="API利用"
          tagline="従量課金・ダウンロード不要"
          bullets={[
            'インストール不要ですぐ使える',
            '従量課金、APIキー不要',
            'レスポンスはやや遅め',
          ]}
          selected={mode === 'api'}
          onSelect={() => setMode('api')}
        />
      </div>

      {handoffState === 'delivered' && (
        <p className="mode-select__status mode-select__status--success">
          拡張機能に設定を送りました。Sokuji拡張機能を開いてください。
        </p>
      )}
      {handoffState === 'fallback' && (
        <p className="mode-select__status mode-select__status--fallback">
          Sokuji拡張機能が見つかりませんでした。
          <a href={SOKUJI_CHROME_WEB_STORE_URL} target="_blank" rel="noreferrer">
            Chromeウェブストアからインストール
          </a>
          してから、もう一度お試しください。
        </p>
      )}

      <div className="mode-select__footer">
        <BackLink to="/login" />
        <PrimaryButton disabled={!mode || handoffState === 'sending'} onClick={handleNext}>
          次へ
        </PrimaryButton>
      </div>
    </div>
  );
}

export default ModeSelect;
