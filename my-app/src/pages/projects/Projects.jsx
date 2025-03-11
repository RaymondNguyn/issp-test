import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";

function Projects({ onLogout, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error("Network response was not ok");
      }

      const projects = await response.json();

      // Fetch sensor data for each project
      const projectsWithSensors = await Promise.all(
        projects.map(async (project) => {
          const sensorResponse = await fetch(
            `http://localhost:8000/api/projects/${project.id}/sensors`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const sensors = sensorResponse.ok ? await sensorResponse.json() : [];
          return { ...project, sensors };
        })
      );

      setData(projectsWithSensors);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleViewDetails = (projectId) => {
    console.log("Button clicked! Navigating to project ID:", projectId); // Log the button click
    if (!projectId) {
      console.error("Project ID is undefined");
      return;
    }
    console.log("Navigating to:", `/projects/${projectId}`); // Log the navigation path
    navigate(`/projects/${projectId}/sensors`); // Navigate to the project detail page
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Layout
      onLogout={onLogout}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      <div
        className={`p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-0"}`}
      >
        <div className="flex justify-between items-center mb-4">
          {data && (
            <div>
              <h1 className="text-2xl font-bold">Your Projects</h1>
            </div>
          )}
        </div>

        {/* Display Projects */}
        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.map((project, index) => {
              console.log("Project:", project); // Log the project object
              console.log("Project ID:", project.id); // Log the project ID
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 relative"
                >
                  <h2 className="text-xl font-semibold mb-2">
                    {project.project_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {project.created_at}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Description:</strong>{" "}
                    {project.description || "No description available."}
                  </p>
                  <button
                    onClick={() => {
                      console.log("Project ID:", project.id); // Log the project ID
                      handleViewDetails(project.id);
                    }}
                    className="block mt-4 bg-green-500 text-white text-center px-4 py-2 rounded-md hover:bg-green-600 w-full"
                  >
                    View Details
                  </button>
                  {project.sensors.length > 0 ? (
                    <div className="text-sm text-gray-600">
                      <strong>Sensors:</strong>
                      <ul>
                        {project.sensors.map((sensor) => (
                          <li key={sensor.sensor_id}>
                            {sensor.sensorName} (Status: {sensor.status}, Temp:{" "}
                            {sensor.temperature}°C)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No sensors linked</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-600">
            No projects found. Add one!
          </p>
        )}
      </div>
    </Layout>
  );
}

export default Projects;
