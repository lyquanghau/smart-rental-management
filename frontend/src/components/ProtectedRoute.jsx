import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredUser, getToken } from '../services/sessionStorage.js';

export function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
