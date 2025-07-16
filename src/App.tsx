import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import { getCurrentUser, getUserRole } from './lib/auth';
import type { UserRole } from './types';
import EditPage from './pages/Edit';
import AdminPage from './pages/Admin';
import Welcome from './pages/Welcome';

function PrivateRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function fetchRole() {
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error('No user');
        const role = await getUserRole(user.id);
        setRole(role as UserRole);
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRole();
  }, []);

  if (loading) return <div className="text-center text-white">Cargando...</div>;
  if (!role || !allowedRoles.includes(role as UserRole)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<PrivateRoute allowedRoles={['admin', 'editor']} />}>
        <Route path="/welcome" element={<Welcome />} />
      </Route>
      <Route element={<PrivateRoute allowedRoles={['editor', 'admin']} />}>
        <Route path="/edit" element={<EditPage />} />
      </Route>
      <Route element={<PrivateRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
