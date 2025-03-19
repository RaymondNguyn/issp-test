// ApprovedUserRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

const ApprovedUserRoute = ({ auth }) => {
  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!auth.isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
};

export default ApprovedUserRoute;