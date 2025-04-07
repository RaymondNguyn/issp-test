import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Sidebar } from "../components/sidenav";
import { TopNav } from "../components/topnav";
import { SensorChart } from "../components/Graph";
import { SensorDataTable } from "../components/Table"; 

function SensorDetail({ auth }) {
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
      const response = await fetch(`http://localhost:8000/api/sensor-data/${sensorId}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sensor details");
      }

      const data = await response.json();
      console.log(data)
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

    // Define the fields we want to include
    const fields = [
      'sensor_id',
      'timestamp',
      'status',
      'adc',
      'position',
      'roll',
      'pitch',
      'temperature'
    ];

    // Create header
    let csv = fields.join(',') + '\n';

    // Add data rows
    data.forEach(item => {
      const row = fields.map(field => {
        let value = '';
        // Special handling for each field
        if (field === 'sensor_id') {
          value = item.sensor_id || '';
        } else if (field === 'timestamp') {
          value = item.timestamp || '';
        } else if (field === 'status') {
          value = item.status || '';
        } else {
          // All other fields come from readings
          value = item.readings?.[field] ?? '';
        }
        
        // Format the value
        if (typeof value === 'number') {
          value = value.toFixed(2);
        }
        
        // Escape commas and quotes
        if (value.toString().includes(',') || value.toString().includes('"')) {
          value = `"${value.toString().replace(/"/g, '""')}"`;
        }
        
        return value;
      });

      csv += row.join(',') + '\n';
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
    <div className="flex h-screen overflow-auto bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-col flex-1 ">
        <TopNav />
        <div className="flex-1 overflow-auto p-6">


        
        <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
            Sensor Details: {sensorData.length > 0 ? sensorData[0]?.sensor_id : "No Data"}
          </h1>
          <button
            onClick={downloadSensorData}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={sensorData.length === 0}
          >
            Download CSV
          </button>
        </div>

        {sensorData.length > 0 && <SensorChart data={sensorData} />}
        <SensorDataTable sensorData={sensorData} />
      </div>

    </div>
    </div>
  );
}

export default SensorDetail;