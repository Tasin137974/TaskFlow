import { Navigate, Route, Routes } from 'react-router-dom';
import { Protected, PublicOnly } from './components/RouteGuards.jsx';
import AuthPage from './pages/AuthPage.jsx';
import TasksPage from './pages/TasksPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>
      <Route element={<Protected />}>
        <Route path="/" element={<TasksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
