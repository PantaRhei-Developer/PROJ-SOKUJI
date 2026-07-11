import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import RequireAuth from './components/common/RequireAuth';
import Login from './screens/Login/Login';
import ModeSelect from './screens/ModeSelect/ModeSelect';
import LanguageStep from './screens/SetupWizard/LanguageStep';
import DevicesStep from './screens/SetupWizard/DevicesStep';
import ConfirmStep from './screens/SetupWizard/ConfirmStep';
import Session from './screens/Session/Session';
import Settings from './screens/Settings/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/mode-select"
              element={
                <RequireAuth>
                  <ModeSelect />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/language"
              element={
                <RequireAuth>
                  <LanguageStep />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/audio"
              element={
                <RequireAuth>
                  <DevicesStep />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/confirm"
              element={
                <RequireAuth>
                  <ConfirmStep />
                </RequireAuth>
              }
            />
            <Route
              path="/session"
              element={
                <RequireAuth>
                  <Session />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />
          </Routes>
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
