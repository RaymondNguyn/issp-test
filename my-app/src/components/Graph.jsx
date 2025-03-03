import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

export const SensorChart = ({ data }) => {
  const [selectedColumns, setSelectedColumns] = useState(["temperature"]);
  const [selectedChartType, setSelectedChartType] = useState("line");

  // Available sensor options (each gyroscope axis is now separate)
  const sensorOptions = ["temperature", "roll", "pitch", "gyroscope_x", "gyroscope_y", "gyroscope_z"];

  // Format data for the chart
  const formattedData = data.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleString(),
    temperature: item.temperature,
    roll: item.roll,
    pitch: item.pitch,
    gyroscope_x: item.gyroscope?.x,
    gyroscope_y: item.gyroscope?.y,
    gyroscope_z: item.gyroscope?.z,
  }));

  // Toggle column selection
  const toggleColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((key) => key !== col) : [...prev, col]
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Sensor Data Graph</h2>

      {/* Buttons to select data columns */}
      <div className="mb-4 space-x-2">
        {sensorOptions.map((col) => (
          <button
            key={col}
            className={`px-4 py-2 rounded-md ${
              selectedColumns.includes(col) ? "bg-blue-500 text-white" : "bg-gray-300"
            }`}
            onClick={() => toggleColumn(col)}
          >
            {col.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Buttons to switch between chart types */}
      <div className="mb-4 space-x-2">
        {["line", "bar", "area"].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded-md ${
              selectedChartType === type ? "bg-green-500 text-white" : "bg-gray-300"
            }`}
            onClick={() => setSelectedChartType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Chart
          </button>
        ))}
      </div>

      {/* Graph Display */}
      <ResponsiveContainer width="100%" height={400}>
        {selectedChartType === "line" && (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedColumns.map((col, index) => (
              <Line key={col} type="monotone" dataKey={col} stroke={["#FF0000", "#00FF00", "#0000FF", "#8884d8", "#FF8800", "#00AAAA"][index % 6]} />
            ))}
          </LineChart>
        )}

        {selectedChartType === "bar" && (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedColumns.map((col, index) => (
              <Bar key={col} dataKey={col} fill={["#FF0000", "#00FF00", "#0000FF", "#8884d8", "#FF8800", "#00AAAA"][index % 6]} />
            ))}
          </BarChart>
        )}

        {selectedChartType === "area" && (
          <AreaChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedColumns.map((col, index) => (
              <Area key={col} type="monotone" dataKey={col} stroke={["#FF0000", "#00FF00", "#0000FF", "#8884d8", "#FF8800", "#00AAAA"][index % 6]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
