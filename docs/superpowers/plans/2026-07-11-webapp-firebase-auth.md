# SOKUJI Allo Web App — Firebase Authentication — Implementation Plan

**Goal:** Wire real Firebase Authentication (Google Sign-In) into `webapp/` per `docs/superpowers/specs/2026-07-11-webapp-firebase-auth-design.md` — replace Login's no-op navigation, gate every other route behind an authenticated session, and add a logout row to Settings.

**Architecture:** New `firebase` dependency (Auth only). A `webapp/src/lib/firebase.ts` module exports the initialized `app`/`auth`/`googleProvider`. A new `AuthContext` mirrors the existing `OnboardingContext` pattern. A `RequireAuth` wrapper gates routes in `App.tsx`.

**Tech Stack:** `firebase` (`firebase/app`, `firebase/auth`), React Router (`<Navigate>`), existing React + TypeScript + Vite + SCSS stack.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `webapp/src/lib/firebase.ts` | `initializeApp`, `getAuth`, `GoogleAuthProvider` — hardcoded config for `pantarhei-int-sandbox-prd`. |
| `webapp/src/context/AuthContext.tsx` | `AuthProvider` + `useAuth()` exposing `{ user, loading }` from `onAuthStateChanged`. |
| `webapp/src/components/common/RequireAuth.tsx` | Route guard: loading state / `<Navigate to="/login" />` / render children. |

### Modified

| File | Change |
|---|---|
| `webapp/package.json` | Add `firebase` dependency. |
| `webapp/src/App.tsx` | Wrap router in `<AuthProvider>`; wrap every route except `/login` in `<RequireAuth>`. |
| `webapp/src/screens/Login/Login.tsx` | Replace no-op navigation with `signInWithPopup`; add `isSigningIn`/`error` state and the three error cases from the design doc; redirect to `/mode-select` immediately if already authenticated. |
| `webapp/src/screens/Login/Login.scss` | Add error-text style (reuse `color-error` token). |
| `webapp/src/screens/Settings/Settings.tsx` | Add the fourth "アカウント / ログアウト" row calling `signOut(auth)` then navigating to `/login`. |
| `webapp/src/screens/Settings/Settings.scss` | Add `&__logout` (or reuse `&__change` with a color override) style for the red logout link. |
| `docs/spec/screens/Login.md` | Update to describe the real sign-in call and error states (current-state spec must reflect this once implemented). |
| `docs/spec/screens/Settings.md` | Add the fourth row to the layout/navigation description. |

### Reused without modification

| File | Why |
|---|---|
| `webapp/src/context/OnboardingContext.tsx` | Pattern (not code) reused for `AuthContext` — same plain function + hook shape, no changes needed to the file itself. |
| `webapp/src/components/common/PrimaryButton.tsx`, `BackLink.tsx` | No changes needed; Login/Settings compose with existing pieces. |

---

## Steps

- [x] Add `firebase` to `webapp/package.json`, `npm install`.
- [x] Create `webapp/src/lib/firebase.ts` with the hardcoded config from the Firebase console.
- [x] Create `AuthContext` + `useAuth()`.
- [x] Create `RequireAuth` and wire it into `App.tsx` alongside `AuthProvider`.
- [x] Update `Login.tsx`/`.scss` for the real sign-in flow and error states.
- [x] Update `Settings.tsx`/`.scss` for the logout row.
- [x] Verified via Playwright (no real Google account available in this environment, so the full popup → success round-trip was **not** driven end-to-end):
  - Direct URL to `/session` and `/settings` while logged out → both redirect to `/login`. ✓
  - Login page renders with no console/page errors (confirms Firebase initializes correctly with the hardcoded config). ✓
  - Clicking "Googleでログイン" opens a real popup to `pantarhei-int-sandbox-prd.firebaseapp.com/__/auth/handler` with no errors, confirming the `signInWithPopup` wiring reaches Firebase correctly. ✓
  - **Not verified in this environment**: completing a real Google sign-in and confirming the post-login redirect to `/mode-select`, and the logout round-trip. Needs a manual pass with a real Google account.
- [x] Update `docs/spec/screens/Login.md` and `docs/spec/screens/Settings.md` to match.
