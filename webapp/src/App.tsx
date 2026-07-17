import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import RequireAuth from './components/common/RequireAuth';
import Login from './screens/Login/Login';
import ModeSelect from './screens/ModeSelect/ModeSelect';

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
          </Routes>
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
