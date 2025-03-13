// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import DisplaySensor from "./pages/Display-sensor";
import SensorDetail from "./pages/SensorDetail";
import Projects from "./pages/projects/Projects";
import AddProject from "./pages/projects/Add-project";
import ProjectDetail from "./pages/projects/ProjectDetail";
import ForgotPassword from "./pages/passwords/ForgotPass"; // Updated path
import ResetPassword from "./pages/passwords/ResetPass"; // Updated path
import Assets from "./pages/projects/Assets";
import { useNavigate } from "react-router-dom";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();

  const handleLogin = (newToken, userEmail) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("userEmail", userEmail);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <Routes>
      {/* Default route */}
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login route */}
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

      {/* Forgot Password route */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Reset Password route */}
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Dashboard route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute token={token}>
            <Dashboard onLogout={handleLogout} token={token} />
          </ProtectedRoute>
        }
      />

      {/* Other routes */}
      <Route path="/register" element={<Register />} />
      <Route
        path="/sensors"
        element={
          <ProtectedRoute token={token}>
            <DisplaySensor onLogout={handleLogout} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sensors/:sensorId"
        element={
          <ProtectedRoute token={token}>
            <SensorDetail onLogout={handleLogout} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute token={token}>
            <Projects onLogout={handleLogout} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-projects"
        element={
          <ProtectedRoute token={token}>
            <AddProject onLogout={handleLogout} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/sensors"
        element={
          <ProtectedRoute token={token}>
            <ProjectDetail onLogout={handleLogout} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets/:projectId"
        element={
          <ProtectedRoute token={token}>
            <Assets onLogout={handleLogout} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/assets"
        element={<Assets onLogout={handleLogout} />}
      />
    </Routes>
  );
}

export default App;
