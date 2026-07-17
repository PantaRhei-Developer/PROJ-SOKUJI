import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import './Login.scss';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/mode-select', { replace: true });
    }
  }, [loading, user, navigate]);

  async function handleSignIn() {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/mode-select');
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        // User cancelled — not an error worth surfacing.
      } else if (err instanceof FirebaseError && err.code === 'auth/popup-blocked') {
        setError('ポップアップがブロックされました。ブラウザの設定を確認してください。');
      } else {
        console.error('[SOKUJI Allo] Google sign-in failed:', err);
        setError('ログインできませんでした。もう一度お試しください。');
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <img src={logo} alt="SOKUJI Allo" className="login__logo" />
          <span className="login__name">SOKUJI Allo</span>
        </div>
        <p className="login__tagline">設定不要のリアルタイム翻訳。</p>
        <button type="button" className="login__google-button" onClick={handleSignIn} disabled={isSigningIn}>
          <GoogleMark />
          <span>Googleでログイン</span>
        </button>
        {error && <p className="login__error">{error}</p>}
        <p className="login__footer">
          <a href="#">利用規約</a> · <a href="#">プライバシーポリシー</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
