import * as React from "react";

// Define the fields we want to show in the table
const DISPLAY_FIELDS = [
  'sensor_id',
  'timestamp',
  'status',
  'adc',
  'position',
  'roll',
  'pitch',
  'temperature'
];

// Format field names for display
const formatFieldName = (field) => {
  return field.split('_').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');
};

// Format field values
const formatFieldValue = (value) => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  if (value instanceof Date) {
    return new Date(value).toLocaleString();
  }
  return value;
};

// Main Table Component
export function SensorDataTable({ sensorData }) {
  if (!sensorData || sensorData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No sensor data available.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 shadow-md">
        {/* Table Header */}
        <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
          <tr>
            {DISPLAY_FIELDS.map((field) => (
              <th key={field} className="border border-gray-300 px-4 py-2 text-left">
                {formatFieldName(field)}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {sensorData.map((row, rowIndex) => {
            const readings = row.readings || {};
            return (
              <tr
                key={rowIndex}
                className={`${
                  rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-200 transition`}
              >
                {DISPLAY_FIELDS.map((field) => {
                  const value = readings[field] !== undefined ? readings[field] : row[field];
                  return (
                    <td key={field} className="border border-gray-300 px-4 py-2">
                      {formatFieldValue(value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
