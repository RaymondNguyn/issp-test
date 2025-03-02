import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Sidebar } from "../components/sidenav";
import { TopNav } from "../components/topnav";

function SensorDetail({ token }) {
  const { sensorId } = useParams(); // Get sensorId from URL
  const [sensorData, setSensorData] = useState([]); // Now an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchSensorData();
  }, []);

  const fetchSensorData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/sensors/${sensorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sensor details");
      }

      const data = await response.json();
      setSensorData(data);
      console.log("Fetched sensor data:", data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };


  const convertToCSV = (data) => {
    if (data.length === 0) return "";


    const sample = data[0];
    const fields = Object.keys(sample).filter(key =>
      !['_id', 'accelerometer', 'magnetometer', 'gyroscope'].includes(key)
    );


    const nestedFields = [
      'accelerometer.x', 'accelerometer.y', 'accelerometer.z',
      'magnetometer.x', 'magnetometer.y', 'magnetometer.z',
      'gyroscope.x', 'gyroscope.y', 'gyroscope.z'
    ];

    const allFields = [...fields, ...nestedFields];
    let csv = allFields.join(',') + '\n';
    data.forEach(item => {
      const row = allFields.map(field => {
        if (field.includes('.')) {

          const [parent, child] = field.split('.');
          return item[parent] && item[parent][child] !== undefined
            ? item[parent][child]
            : '';
        } else {
          return item[field] !== undefined ? item[field] : '';
        }
      });


      csv += row.map(value => {
        if (value.toString().includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',') + '\n';
    });

    return csv;
  };

  const downloadSensorData = () => {
    const csvData = convertToCSV(sensorData);

    const blob = new Blob([csvData], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-${sensorId}-data.csv`;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-col flex-1">
        <TopNav />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Sensor Details</h1>
          <button
            onClick={downloadSensorData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={sensorData.length === 0}
          >
            Download CSV
          </button>
        </div>

        {sensorData.length > 0 ? (
          sensorData.map((sensor, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow mb-4">
              <p><strong>Sensor ID:</strong> {sensor.sensor_id}</p>
              <p><strong>ADC:</strong> {sensor.adc}</p>
              <p><strong>Position:</strong> {sensor.position}</p>
              <p><strong>Roll:</strong> {sensor.roll}</p>
              <p><strong>Pitch:</strong> {sensor.pitch}</p>
              <p><strong>Temperature:</strong> {sensor.temperature}°C</p>
              <p><strong>Timestamp:</strong> {new Date(sensor.timestamp).toLocaleString()}</p>

              <h3 className="font-bold mt-4">Accelerometer:</h3>
              <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(sensor.accelerometer, null, 2)}</pre>

              <h3 className="font-bold mt-4">Magnetometer:</h3>
              <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(sensor.magnetometer, null, 2)}</pre>

              <h3 className="font-bold mt-4">Gyroscope:</h3>
              <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(sensor.gyroscope, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p>No data available for this sensor.</p>
        )}
      </div>

    </div>

  );
}

export default SensorDetail;