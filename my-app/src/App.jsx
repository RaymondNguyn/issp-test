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
import AddProject from "./pages/projects/Add-project";
import ProjectDetail from "./pages/projects/ProjectDetail";
import AdminDashboard from "./pages/AdminDashboard";
import EditUser from "./pages/EditUser";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");

  const handleLogin = (newToken, admin = false) => {
    setToken(newToken);
    setIsAdmin(admin);
    localStorage.setItem("token", newToken);
    localStorage.setItem("isAdmin", admin);
  };

  const handleLogout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute token={token}>
              {isAdmin ? (
                <AdminDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-user/:userId"
          element={
            <ProtectedRoute token={token}>
              {isAdmin ? (
                <EditUser />
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <Dashboard onLogout={handleLogout} token={token} />
            </ProtectedRoute>
          }
        />

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
          path="/sensors/:sensorId"
          element={<SensorDetail token={token} />}
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
          element={<Navigate to={token ? (isAdmin ? "/admin" : "/dashboard") : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
