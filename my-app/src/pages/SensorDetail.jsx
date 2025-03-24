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
      const response = await fetch(`http://${window.location.hostname}:8000/api/sensor-data/${sensorId}`, {
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