import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from "../components/sidenav";
import { TopNav } from "../components/topnav";

function DisplaySensor({ auth }) {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sensorName, setSensorName] = useState("");  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { assetId, projectId } = useParams(); // Get assetId from the URL params

  useEffect(() => {
    if (assetId) {
      fetchSensors(assetId);
    } else {
      setError("No asset ID provided.");
      setLoading(false);
    }
  }, [assetId]);

  const fetchSensors = async (assetId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/sensors/${assetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch sensors');
      }

      const sensorData = await response.json();
      console.log(sensorData)
      setSensors(sensorData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }

  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/add-sensors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          sensorName,
          assetId,
          projectId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add sensor');
      }

      const data = await response.json();
      alert("Sensor added successfully");
      setSensorName(""); 
      fetchSensors(assetId);
      console.log(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-col flex-1">
        <TopNav />

        <div className={`p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-[260px]"}`}>
          <h1 className="text-2xl font-bold mb-4">Your Sensors</h1>

          {/* Add Sensor Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <label htmlFor="sensorName" className="block text-sm font-medium text-gray-900">
              Add Sensor
            </label>
            <input
              type="text"
              id="sensorName"
              value={sensorName}
              onChange={(e) => setSensorName(e.target.value)}
              className="block w-[300px] rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
            />
            <button type="submit" className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded">
              Add Sensor
            </button>
          </form>

          {sensors.length === 0 ? (
            <p className="text-gray-500">No sensors added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map((sensor) => (
                <button
                  key={sensor.sensor_id}
                  onClick={() => navigate(`/projects/${projectId}/assets/${assetId}/sensors/${sensor.sensor_id}`)}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow w-full text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold">{sensor.name}</h2>
                  </div>
                  <p className="text-gray-600 mt-2">Sensor ID: {sensor.sensor_id}</p>

                  {/* Display alerts */}
                  {sensor.alerts && Object.keys(sensor.alerts).length > 0 ? (
                    <div className="mt-2">
                      <p className="font-semibold">Alerts:</p>
                      <ul className="text-sm">
                        {Object.entries(sensor.alerts).map(([key, status]) => {
                          if (typeof status === 'object') {
                            // Handle nested alerts (e.g., accelerometer)
                            return (
                              <li key={key}>
                                <span className="font-medium">{key}:</span>
                                <ul className="ml-4">
                                  {Object.entries(status).map(([subKey, subStatus]) => (
                                    <li
                                      key={`${key}-${subKey}`}
                                      className={`${subStatus === "danger" ? "text-red-500" : 
                                                 subStatus === "warning" ? "text-yellow-500" : 
                                                 "text-gray-700"}`}
                                    >
                                      {subKey}: {subStatus}
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            );
                          } else {
                            // Handle simple alerts
                            return (
                              <li
                                key={key}
                                className={`${status === "danger" ? "text-red-500" : 
                                           status === "warning" ? "text-yellow-500" : 
                                           "text-gray-700"}`}
                              >
                                {key}: {status}
                              </li>
                            );
                          }
                        })}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">No alerts</p>
                  )}
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
