import React from 'react';
import { useAuth } from './AuthContext';

/**
 * AdminRoute Component
 *
 * A wrapper component that only renders its children if the current user is an admin.
 * Otherwise, it renders an access denied message.
 */
const AdminRoute = ({ children }) => {
  const { isAdmin, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">🔒</div>
        <h2>Authentication Required</h2>
        <p>You need to log in to access this page.</p>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">⛔</div>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this area.</p>
        <p>This section is only available to administrators.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
