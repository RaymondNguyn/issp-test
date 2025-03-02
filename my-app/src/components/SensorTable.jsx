import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export function SensorTable() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/user/display-sensor-dash",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensors");
      }
      const data = await response.json();
      setSensors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading sensor data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="border rounded-xl overflow-hidden p-4 border-gray-300">
    <Table>
      <TableCaption>Latest Sensor Data</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Sensor ID</TableHead>
          <TableHead>Temperature</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Accelerometer</TableHead>
          <TableHead>Magnetometer</TableHead>
          <TableHead>Gyroscope</TableHead>
          <TableHead className="text-right">Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sensors.map((sensor) => (
          <TableRow key={sensor.sensor_id}>
            <TableCell>{sensor.sensor_id}</TableCell>
            <TableCell>{sensor.temperature?.toFixed(2)}°C</TableCell>
            <TableCell>
              {sensor.position
                ? sensor.position
                  .split(",") // Split by comma
                  .map((coord) => parseFloat(coord).toFixed(2)) // Convert to float and round
                  .join(", ") // Join back with a comma
                : "No Data"}
            </TableCell>
            {/* Accelerometer */}
            <TableCell>{`X: ${sensor.accelerometer.x.toFixed(
              2
            )}, Y: ${sensor.accelerometer.y.toFixed(
              2
            )}, Z: ${sensor.accelerometer.z.toFixed(2)}`}</TableCell>

            
            {/* Magnetometer */}
            <TableCell>{`X: ${sensor.magnetometer.x.toFixed(
              2
            )}, Y: ${sensor.magnetometer.y.toFixed(
              2
            )}, Z: ${sensor.magnetometer.z.toFixed(2)}`}</TableCell>

            {/* Gyroscope */}
            <TableCell>{`X: ${sensor.gyroscope.x.toFixed(
              2
            )}, Y: ${sensor.gyroscope.y.toFixed(
              2
            )}, Z: ${sensor.gyroscope.z.toFixed(2)}`}</TableCell>
            <TableCell className="text-right">
              {new Date(sensor.timestamp).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total Sensors: {sensors.length}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
    </div>
  );
}
