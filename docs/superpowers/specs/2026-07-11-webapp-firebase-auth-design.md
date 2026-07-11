# SOKUJI Allo Web App — Firebase Authentication — Design

**Date**: 2026-07-11
**Status**: Approved for implementation planning
**Scope**: Wire real Firebase Authentication (Google Sign-In) into `webapp/`, replacing the Login screen's no-op navigation from the screens-only phase, and gate every other route behind an authenticated session.

## Context

The screens-only phase (`docs/superpowers/specs/2026-07-07-sokuji-wrapper-webapp-design.md`) explicitly deferred "Firebase Auth / Firestore real integration" as a Non-Goal — the Login screen's "Googleでログイン" button just navigates to `/mode-select`. This document covers the next slice: making that login real, while intentionally keeping everything else (Firestore persistence, real ASR/MT, billing) out of scope so this phase stays reviewable on its own.

This webapp deliberately uses **Firebase Auth**, a separate identity system from the existing Sokuji extension's Better Auth — they are not connected in this phase (see Non-Goals).

## Non-Goals (this phase)

- Firestore persistence of onboarding selections (mode/languages/devices stay in the existing in-memory `OnboardingContext`).
- Skipping the onboarding wizard for returning users who already completed it — every login lands on `/mode-select`, every time, until a later phase adds persisted onboarding state.
- Real ASR/MT execution, local model download, or API-key collection.
- Usage-based billing.
- Firebase Analytics (the console-provided config snippet includes `getAnalytics`/`measurementId`; this phase only imports `firebase/app` and `firebase/auth`, keeping the bundle scoped to what's needed).
- Any link to the existing extension's Better Auth session.

## User-Visible Behavior

### Login (`/login`)

- "Googleでログイン" now calls a real `signInWithPopup(auth, googleProvider)`.
- Success → navigate to `/mode-select` (always, regardless of prior sessions).
- Failure:
  - User closes the popup (`auth/popup-closed-by-user`) → treated as a cancel, no error message, button just returns to its normal state.
  - Popup blocked (`auth/popup-blocked`) → inline error text below the button: "ポップアップがブロックされました。ブラウザの設定を確認してください。" (`color-error` token, 12px).
  - Any other error → generic inline error text: "ログインできませんでした。もう一度お試しください。"
- While the popup flow is in progress, the button shows a disabled/loading state (label unchanged, just non-interactive) to prevent double-submits.

### Route protection

- Every route except `/login` requires an authenticated Firebase user: `/mode-select`, `/setup/language`, `/setup/audio`, `/setup/confirm`, `/session`, `/settings`.
- On app load, Firebase's `onAuthStateChanged` resolves asynchronously. Until it resolves once, protected routes render a minimal centered loading state (no spinner design needed — plain centered "読み込み中…" text is enough) instead of redirecting, to avoid a flash-redirect to `/login` for already-logged-in users.
- Once resolved:
  - No user → redirect to `/login`.
  - User present → render the requested screen.
- If an already-authenticated user navigates directly to `/login`, redirect straight to `/mode-select` (don't show the login card to a logged-in user).

### Settings (`/settings`) — logout

- New fourth row, reusing the exact same `.settings__row` layout as the existing three (flex row space-between, 16px vertical padding, bottom divider — the divider is omitted on this last row, matching how the third row already has no divider below it):
  - Left: "アカウント：{signed-in user's email}" (from `useAuth().user.email`).
  - Right: "ログアウト" — styled like the existing "変更" links (plain text button, no border, `font-size-body`) but in `color-error` instead of `color-primary`, so it visually reads as a distinct/leaving action rather than another "変更" link.
- Click → `signOut(auth)`, then navigate to `/login`.

## Architecture

- **New dependency**: `firebase` npm package. Only `firebase/app` and `firebase/auth` are imported (no `firebase/analytics`, no `firebase/firestore` yet).
- **`webapp/src/lib/firebase.ts`**: hardcoded `firebaseConfig` (project `pantarhei-int-sandbox-prd`, values from the Firebase console — safe to commit since web `apiKey` values aren't secret). Exports `app` (`initializeApp(firebaseConfig)`), `auth` (`getAuth(app)`), and a shared `googleProvider` (`new GoogleAuthProvider()`).
- **`webapp/src/context/AuthContext.tsx`**: new React context/provider mirroring the existing `OnboardingContext` pattern (plain function + hook, no class). Subscribes to `onAuthStateChanged(auth, ...)` in a `useEffect`, exposes `{ user: User | null, loading: boolean }` via `useAuth()`.
- **`webapp/src/components/common/RequireAuth.tsx`**: reads `useAuth()`; renders the loading state, a `<Navigate to="/login" />`, or `children` per the rules above.
- **`webapp/src/App.tsx`**: wrap the router tree in `<AuthProvider>`; wrap every route element except `/login` in `<RequireAuth>`.
- **`webapp/src/screens/Login/Login.tsx`**: replace the no-op `navigate('/mode-select')` with the real sign-in call described above; add local `isSigningIn`/`error` state. Also redirect immediately to `/mode-select` if `useAuth()` already has a `user` (covers the "already logged in, landed on /login" case without duplicating logic in `RequireAuth`).
- **`webapp/src/screens/Settings/Settings.tsx`**: add the logout row calling `signOut(auth)`.

## Error handling / edge cases

- Popup closed by user vs. popup blocked vs. generic failure are the three cases handled explicitly (see User-Visible Behavior). All other Firebase Auth error codes fall into the generic message.
- If `onAuthStateChanged` never resolves (e.g. Firebase misconfiguration), the app is stuck on the loading state rather than incorrectly redirecting either way — acceptable for this phase; no timeout/fallback UI is added.
