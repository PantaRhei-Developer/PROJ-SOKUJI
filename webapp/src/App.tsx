import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OnboardingProvider } from './context/OnboardingContext';
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
      <OnboardingProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mode-select" element={<ModeSelect />} />
          <Route path="/setup/language" element={<LanguageStep />} />
          <Route path="/setup/audio" element={<DevicesStep />} />
          <Route path="/setup/confirm" element={<ConfirmStep />} />
          <Route path="/session" element={<Session />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </OnboardingProvider>
    </BrowserRouter>
  );
}

export default App;
