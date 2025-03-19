// AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = ({ auth }) => {
  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!auth.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;