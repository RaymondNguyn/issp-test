import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidenav";
import { TopNav } from "../../components/topnav";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [sensors, setSensors] = useState([]);
  const [newSensor, setNewSensor] = useState({
    sensor_id: "",
    status: "",
    temperature: "",
    position: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await fetch(`http://localhost:8000/api/projects/${projectId}`, { headers });

        setSensors(response.data.sensors_owned); // Assuming API returns the sensors
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch project details");
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleAddSensor = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `http://localhost:8000/api/projects/${projectId}/add-sensor`,
        newSensor,
        { headers }
      );

      if (response.status === 200) {
        setSensors([...sensors, newSensor]); // Update local state
        setNewSensor({
          sensor_id: "",
          status: "",
          temperature: "",
          position: "",
        }); // Reset sensor form fields
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add sensor");
    }
  };

  return (
    <div>
      <Sidebar />
      <TopNav />
      <div className="container">
        <h2>Project Details</h2>
        {error && <div className="error">{error}</div>}

        <h3>Sensors</h3>
        <ul>
          {sensors.map((sensor, index) => (
            <li key={index}>
              Sensor ID: {sensor.sensor_id} - Status: {sensor.status} - Temperature: {sensor.temperature}°C - Position: {sensor.position}
            </li>
          ))}
        </ul>

        <h3>Add New Sensor</h3>
        <div className="form-group">
          <label>Sensor ID</label>
          <input
            type="text"
            name="sensor_id"
            value={newSensor.sensor_id}
            onChange={(e) => setNewSensor({ ...newSensor, sensor_id: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <input
            type="text"
            name="status"
            value={newSensor.status}
            onChange={(e) => setNewSensor({ ...newSensor, status: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Temperature</label>
          <input
            type="number"
            name="temperature"
            value={newSensor.temperature}
            onChange={(e) => setNewSensor({ ...newSensor, temperature: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Position</label>
          <input
            type="text"
            name="position"
            value={newSensor.position}
            onChange={(e) => setNewSensor({ ...newSensor, position: e.target.value })}
          />
        </div>

        <button type="button" onClick={handleAddSensor}>
          Add Sensor
        </button>
      </div>
    </div>
  );
};

export default ProjectDetail;
