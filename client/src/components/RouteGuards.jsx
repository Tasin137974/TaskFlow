import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from './Layout.jsx';

function Splash() {
  return (
    <div className="splash" role="status">
      Loading…
    </div>
  );
}

export function Protected() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
