import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";

const AddProject = ({ onLogout, token }) => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState(""); // Add description state
  const [date, setDate] = useState(""); // Add date state
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userEmail) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const projectData = {
        project_name: projectName,
        description: description, // Include description
        date: date, // Include date
        email: userEmail,
        sensors: [],
      };

      console.log("Sending project data:", projectData); // Log the data being sent

      const response = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(projectData),
      });

      const responseData = await response.json();
      console.log("Response from server:", responseData); // Log the server response

      if (response.ok) {
        const projectId = responseData.id;
        navigate(`/projects/${projectId}`);
      } else {
        setError(responseData.detail || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to create project");
      console.error("Error:", err); // Log the error
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
              {typeof error === "object" ? error.msg : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                name="project_name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md transition duration-200 cursor-pointer"
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
