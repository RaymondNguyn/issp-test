import * as React from "react";

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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 shadow-md">
        {/* Table Header */}
        <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
          <tr>
            {headers.map((key) => (
              <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                {key.replace("_", " ")}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {flattenedData.length ? (
            flattenedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-200 transition`}
              >
                {headers.map((key) => (
                  <td key={key} className="border border-gray-300 px-4 py-2">
                    {row[key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="text-center py-4 text-gray-500">
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
