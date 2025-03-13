import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";

function Projects({ onLogout, token }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        onLogout();
        setError("Session expired. Please login again.");
        return;
      }

      const response = await fetch("http://localhost:8000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to fetch projects");
      }

      const projectsData = await response.json();
      setProjects(projectsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleViewAssets = (projectId) => {
    // Navigate to the assets page with the project ID
    navigate(`/projects/${projectId}/assets`);
  };

  const deleteProject = async (projectId, projectName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete project "${projectName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        onLogout();
        setError("Session expired. Please login again.");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      await response.json();
      alert("Project successfully deleted");

      // Remove the deleted project from the state
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Layout
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      >
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <Layout
      onLogout={onLogout}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      <div className={`p-6 ${isCollapsed ? "ml-[52px]" : "ml-0"}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <button
            onClick={() => navigate("/add-projects")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200 cursor-pointer"
          >
            Add New Project
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 relative"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {project.project_name}
                </h2>
                <p className="text-gray-600 mb-2 text-sm">
                  Created: {formatDate(project.created_at)}
                </p>
                <p className="text-gray-700 mb-2">
                  {project.description
                    ? project.description.length > 100
                      ? `${project.description.substring(0, 100)}...`
                      : project.description
                    : "No description"}
                </p>
                <p className="text-gray-600 mb-2 text-sm">
                  Project Date: {formatDate(project.date)}
                </p>
                <p className="text-gray-600 mb-2 text-sm">
                  Sensors:{" "}
                  {project.sensors && project.sensors.length > 0
                    ? project.sensors.length
                    : "None"}
                </p>
                <p className="text-gray-500 mb-4 text-xs">ID: {project.id}</p>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleViewAssets(project.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200 cursor-pointer"
                  >
                    View Assets
                  </button>
                  <button
                    onClick={() =>
                      deleteProject(project.id, project.project_name)
                    }
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200 cursor-pointer ml-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-lg mb-4">No projects found.</p>
            <p className="text-gray-600 mb-6">
              Create your first project to get started!
            </p>
            <button
              onClick={() => navigate("/add-projects")}
              className="bg-green-600 text-white text-center py-5 px-6 max-w-xs w-full rounded-lg shadow-lg hover:bg-green-700 transition duration-300 text-lg flex justify-center mx-auto cursor-pointer"
            >
              Create Project
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Projects;
