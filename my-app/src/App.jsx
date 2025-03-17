import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import DisplaySensor from "./pages/Display-sensor";
import SensorDetail from "./pages/SensorDetail";
import Projects from "./pages/projects/Projects";
import AddProject from "./pages/projects/Add-project"; // Import AddProject page
import ProjectDetail from "./pages/projects/ProjectDetail"; // Import ProjectDetail page
import Assets from "./pages/projects/Assets";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <Router>
      <Routes>
        {/* If user is logged in, redirect from login to dashboard */}
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* If user is logged in, show the dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <Dashboard onLogout={handleLogout} token={token} />
            </ProtectedRoute>
          }
        />

        {/* Register page */}
        <Route path="/register" element={<Register />} />

        <Route
          path="/sensors"
          element={
            <ProtectedRoute token={token}>
              <DisplaySensor token={token} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/assets/:assetId/sensors/:sensorId"
          element={<SensorDetail token={token} />}
        />

        <Route
            path="/projects/:projectId/assets/:assetId/sensors"
            element={
              <ProtectedRoute token={token}>
                <DisplaySensor token={token} />
              </ProtectedRoute>
            }
          />

          {/* Route for a specific sensor */}
          <Route
            path="/projects/:projectId/assets/:assetId/sensors/:sensorId"
            element={
              <ProtectedRoute token={token}>
                <SensorDetail token={token} />
              </ProtectedRoute>
            }
          />

        <Route
          path="/projects"
          element={
            <ProtectedRoute token={token}>
              <Projects token={token} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-projects"
          element={
            <ProtectedRoute token={token}>
              <AddProject token={token} />
            </ProtectedRoute>
          }
        />

        {/* Project Detail page (where sensors can be added) */}
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute token={token}>
              <ProjectDetail token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />
         <Route
        path="/projects/:projectId/assets"
        element={<Assets onLogout={handleLogout} />}
      />
        
      </Routes>
    </Router>
  );
}

export default App;
