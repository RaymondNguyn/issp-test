import * as React from "react";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

// **Flatten nested objects into columns**
const flattenSensorData = (data) => {
  return data.map((sensor) => ({
    ADC: sensor.adc ?? "N/A",
    Position: sensor.position
      ? sensor.position
          .split(",")
          .map((coord) => parseFloat(coord).toFixed(2))
          .join(", ")
      : "N/A",
    Roll: sensor.roll?.toFixed(2) ?? "N/A",
    Pitch: sensor.pitch?.toFixed(2) ?? "N/A",
    Temperature: sensor.temperature?.toFixed(2) ?? "N/A",
    Timestamp: sensor.timestamp ? new Date(sensor.timestamp).toLocaleString() : "N/A",

    // Group X, Y, Z under one column for each sensor type
    Accelerometer: sensor.accelerometer
      ? `X: ${sensor.accelerometer.x.toFixed(2)}, Y: ${sensor.accelerometer.y.toFixed(2)}, Z: ${sensor.accelerometer.z.toFixed(2)}`
      : "N/A",

    Magnetometer: sensor.magnetometer
      ? `X: ${sensor.magnetometer.x.toFixed(2)}, Y: ${sensor.magnetometer.y.toFixed(2)}, Z: ${sensor.magnetometer.z.toFixed(2)}`
      : "N/A",

    Gyroscope: sensor.gyroscope
      ? `X: ${sensor.gyroscope.x.toFixed(2)}, Y: ${sensor.gyroscope.y.toFixed(2)}, Z: ${sensor.gyroscope.z.toFixed(2)}`
      : "N/A",
  }));
};

// **Main Table Component**
export function SensorDataTable({ sensorData }) {
  const flattenedData = flattenSensorData(sensorData);
  const headers = Object.keys(flattenedData[0] || {});

  return (
    <div className="w-full">
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((key) => (
                <TableHead key={key}>{key.replace("_", " ")}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedData.length ? (
              flattenedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((key) => (
                    <TableCell key={key}>{row[key] ?? "-"}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
