import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AddProject = ({ onLogout }) => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = date ? date.toISOString().split("T")[0] : null;

    const projectData = {
      project_name: projectName,
      description: description,
      date: formattedDate,
      sensor_ids: sensors || [], // Ensure it's always an array
    };
    console.log(projectData)

    try {
      const response = await fetch(`http://${backendUrl}:8000/api/add-projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });
      
      const responseData = await response.json();
      console.log("Response from server:", responseData);

      if (response.ok) {
        navigate(`/projects/`);
      } else {
        setError(responseData.detail || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to create project");
      console.error("Error:", err);
    }
  };

  return (
    <Layout
      onLogout={onLogout}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      <div
        className={`flex-1 flex items-center justify-center transition-all ${
          isCollapsed ? "ml-[52px]" : "ml-0"
        }`}
      >
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Add New Project
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter project description"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                Date
              </label>
              <DatePicker
                selected={date}
                onChange={(date) => setDate(date)}
                dateFormat="yyyy-MM-dd"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                placeholderText="Select a date"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md transition duration-200 cursor-pointer"
            >
              Create Project
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddProject;
