import React, { useState, useMemo } from "react";
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

// **Dynamic Sensor Chart Component**
export const SensorChart = ({ data }) => {
  const [selectedChartType, setSelectedChartType] = useState("line");
  const [selectedColumns, setSelectedColumns] = useState([]);

  // Function to recursively extract numeric sensor fields
  const extractNumericFields = (obj, prefix = "") => {
    let fields = {};
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}_${key}` : key; // Flatten nested keys (e.g., "gyroscope_x")

      if (typeof value === "number") {
        fields[newKey] = value;
      } else if (typeof value === "object" && value !== null) {
        Object.assign(fields, extractNumericFields(value, newKey)); // Recursively flatten nested objects
      }
    });
    return fields;
  };

  // Extract all available sensor options dynamically
  const sensorOptions = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let keys = new Set();
    data.forEach((item) => {
      const numericFields = extractNumericFields(item.readings || item); // Extract from "readings" or root object
      Object.keys(numericFields).forEach((key) => keys.add(key));
    });

    return [...keys];
  }, [data]);

  // Format data for charting
  const formattedData = useMemo(() => {
    return data.map((item) => {
      const numericFields = extractNumericFields(item.readings || item);
      return {
        timestamp: new Date(item.timestamp).toLocaleString(),
        ...numericFields,
      };
    });
  }, [data]);

  // Toggle column selection
  const toggleColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((key) => key !== col) : [...prev, col]
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Sensor Data Graph</h2>

      {/* Buttons to select data columns dynamically */}
      <div className="mb-4 flex flex-wrap gap-2">
        {sensorOptions.map((col) => (
          <button
            key={col}
            className={`px-2 py-1 rounded-md ${
              selectedColumns.includes(col) ? "bg-blue-500 text-white" : "bg-gray-300"
            }`}
            onClick={() => toggleColumn(col)}
          >
            {col.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Buttons to switch between chart types */}
      <div className="mb-4 flex gap-2">
        {["line", "bar", "area"].map((type) => (
          <button
            key={type}
            className={`px-2 py-1 rounded-md ${
              selectedChartType === type ? "bg-green-500 text-white" : "bg-gray-300"
            }`}
            onClick={() => setSelectedChartType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Chart
          </button>
        ))}
      </div>

      {/* Display Chart */}
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
