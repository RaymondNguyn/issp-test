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
          element={token ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
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
        <Route path="/sensors/:sensorId" element={<SensorDetail token={token} />} />




        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
