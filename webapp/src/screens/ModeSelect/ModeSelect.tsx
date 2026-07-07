import { useNavigate } from 'react-router-dom';
import ModeCard from '../../components/ModeCard/ModeCard';
import PrimaryButton from '../../components/common/PrimaryButton';
import BackLink from '../../components/common/BackLink';
import { useOnboarding } from '../../context/OnboardingContext';
import './ModeSelect.scss';

function ModeSelect() {
  const navigate = useNavigate();
  const { mode, setMode } = useOnboarding();

  return (
    <div className="mode-select">
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

      <div className="mode-select__footer">
        <BackLink to="/login" />
        <PrimaryButton disabled={!mode} onClick={() => navigate('/setup/language')}>
          次へ
        </PrimaryButton>
      </div>
    </div>
  );
}

export default ModeSelect;
