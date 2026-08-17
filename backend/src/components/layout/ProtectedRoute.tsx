import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const redirectUrl = location.pathname + location.search;
    return <Navigate to={'/auth?redirect=' + encodeURIComponent(redirectUrl)} replace />;
  }

  return <>{children}</>;
}
