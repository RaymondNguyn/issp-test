import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from "../components/sidenav";
import { TopNav } from "../components/topnav";

function DisplaySensor({ token }) {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    try {
      console.log("Token being used", token);
      const response = await fetch('http://localhost:8000/api/displaySensor', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch sensors');
      }

      const sensorData = await response.json();
      setSensors(sensorData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    // Side nav 
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-col flex-1">
        <TopNav />

        {/* Main content wrapper */}
        <div className='p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-[260px]"}'>
        <h1 className="text-2xl font-bold mb-4">Your Sensors</h1>
        {sensors.length === 0 ? (
          <p className="text-gray-500">No sensors added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map((sensor, index) => (
              <button
                key={index}
                onClick={() => navigate(`/sensors/${sensor}`)} // Navigate to details page
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow w-full text-left cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <h2 className="text-lg font-semibold">{sensor}</h2>
                </div>
                <p className="text-gray-600 mt-2">Sensor ID: {index + 1}</p>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>

  );
}

export default DisplaySensor;
