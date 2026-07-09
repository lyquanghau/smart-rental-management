import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getToken } from '../services/sessionStorage.js';

export function ProtectedRoute() {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
