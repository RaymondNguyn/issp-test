import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
// Authorize Routes
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from './components/AdminRoute';
import ApprovedUserRoutes from './components/ApprovedUserRoutes';
// Pages
import DisplaySensor from "./pages/Display-sensor";
import SensorDetail from "./pages/SensorDetail";
import Projects from "./pages/projects/Projects";
import AddProject from "./pages/projects/Add-project"; // Import AddProject page
import ProjectDetail from "./pages/projects/ProjectDetail"; // Import ProjectDetail page
import Assets from "./pages/projects/Assets";
import PendingApproval from "./pages/PendingApproval";
import AdminPage from "./pages/AdminPage";

function App() {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token"),
    isAdmin: JSON.parse(localStorage.getItem("isAdmin") || "false"),
    isApproved: JSON.parse(localStorage.getItem("isApproved") || "false")
  });

  const handleLogin = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("isAdmin", JSON.stringify(userData.isAdmin));
    localStorage.setItem("isApproved", JSON.stringify(userData.isApproved));
    
    setAuth({
      token: userData.token,
      isAdmin: userData.isAdmin,
      isApproved: userData.isApproved
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("isApproved");
    
    setAuth({ token: null, isAdmin: false, isApproved: false });
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
        path="/login"
        element={
          auth.token ? (
            auth.isApproved ? <Navigate to="/dashboard" replace /> : <Navigate to="/pending-approval" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

        <Route path="/register" element={<Register />} />
        <Route path="/pending-approval" element={<PendingApproval onLogout={handleLogout} />} />

        {/* Protected Routes - Basic Authentication */}
        <Route element={<ProtectedRoute auth={auth} />}>
          {/* Dashboard is accessible to all authenticated users */}
          <Route 
            path="/dashboard" 
            element={<Dashboard onLogout={handleLogout} auth={auth} />} 
          />

          {/* Routes requiring approved status */}
          <Route element={<ApprovedUserRoutes auth={auth} />}>
            {/* Sensor routes */}
            <Route path="/sensors" element={<DisplaySensor auth={auth} />} />
            <Route 
              path="/projects/:projectId/assets/:assetId/sensors" 
              element={<DisplaySensor auth={auth} />} 
            />
            <Route 
              path="/projects/:projectId/assets/:assetId/sensors/:sensorId" 
              element={<SensorDetail auth={auth} />} 
            />
            
            {/* Project routes for all approved users */}
            <Route path="/projects">
              <Route index element={<Projects auth={auth} />} />
              <Route path=":projectId" element={<ProjectDetail auth={auth} />} />
            </Route>
            <Route path="/add-projects" element={<AddProject auth={auth} />} />
            <Route path="/projects/:projectId/assets" element={<Assets onLogout={handleLogout} auth={auth} />} />
          </Route>

          {/* Admin-only routes */}


          <Route element={<AdminRoute auth={auth} />}>
            <Route path="/admin" element={<AdminPage auth={auth} />} />
          </Route>
        </Route>

        {/* Root and fallback routes */}
        <Route
          path="/"
          element={
            <Navigate 
              to={
                auth.token 
                  ? (auth.isApproved ? "/dashboard" : "/pending-approval") 
                  : "/login"
              } 
              replace 
            />
          }
        />
        <Route
          path="*"
          element={
            <Navigate 
              to={
                auth.token 
                  ? (auth.isApproved ? "/dashboard" : "/pending-approval") 
                  : "/login"
              } 
              replace 
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
