import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OnboardingProvider } from './context/OnboardingContext';
import Login from './screens/Login/Login';
import ModeSelect from './screens/ModeSelect/ModeSelect';

function App() {
  return (
    <BrowserRouter>
      <OnboardingProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mode-select" element={<ModeSelect />} />
        </Routes>
      </OnboardingProvider>
    </BrowserRouter>
  );
}

export default App;
