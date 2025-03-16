import * as React from "react";

// **Flatten nested objects into columns dynamically**
const flattenSensorData = (data) => {
  return data.map((sensor) => {
    const flattened = {};

    const flatten = (obj, prefix = "") => {
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === "object" && !Array.isArray(value)) {
          flatten(value, newKey); // Recursively flatten nested objects
        } else {
          flattened[newKey] =
            typeof value === "number" ? value.toFixed(2) : value ?? "N/A";
        }
      });
    };

    flatten(sensor);
    return flattened;
  });
};

// **Main Table Component**
export function SensorDataTable({ sensorData }) {
  if (!sensorData || sensorData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No sensor data available.
      </div>
    );
  }

  const flattenedData = flattenSensorData(sensorData);
  const headers = Object.keys(flattenedData[0]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 shadow-md">
        {/* Table Header */}
        <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
          <tr>
            {headers.map((key) => (
              <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                {key.replace(/\./g, " ")}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {flattenedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-gray-200 transition`}
            >
              {headers.map((key) => (
                <td key={key} className="border border-gray-300 px-4 py-2">
                  {row[key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
