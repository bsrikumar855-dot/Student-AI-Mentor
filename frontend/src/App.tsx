import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RoleProvider, DevRoleSwitcher } from './contexts/RoleContext';

import Hero from './pages/Hero';
import Onboarding from './pages/Onboarding';
import StudentHome from './pages/StudentHome';
import FacultyConsole from './pages/FacultyConsole';
import FacultyDetailSlideOver from './components/FacultyDetailSlideOver';

const AppRoutes = () => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location };

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route path="/" element={<Hero />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<StudentHome />} />
        <Route path="/console" element={<FacultyConsole />}>
          {/* Nested routes for faculty if needed */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Slide-over routing using React Router state */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/console/:id" element={<FacultyDetailSlideOver />} />
        </Routes>
      )}
    </>
  );
};

function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <AppRoutes />
        <DevRoleSwitcher />
      </BrowserRouter>
    </RoleProvider>
  );
}

export default App;
