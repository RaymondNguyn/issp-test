import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";

function Assets({ onLogout }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to fetch project details");
      }

      const projectData = await response.json();
      setProject(projectData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBackToProjects = () => {
    navigate("/projects");
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
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

  if (error) {
    return (
      <Layout
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      >
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      onLogout={onLogout}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      <div className={`p-6 ${isCollapsed ? "ml-[52px]" : "ml-0"}`}>
        <h1 className="text-2xl font-bold mb-6">Assets</h1>

        {project && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* <h2 className="text-xl font-semibold mb-4">
              {project.project_name}
            </h2> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 mb-2">Project Name:</p>
                <p className="font-medium">{project.project_name}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Project ID:</p>
                <p className="font-mono text-sm">{project.id}</p>
              </div>
              {project.description && (
                <div className="col-span-1 md:col-span-2">
                  <p className="text-gray-600 mb-2">Description:</p>
                  <p>{project.description}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600 mb-2">Created Date:</p>
                <p className="font-medium">{formatDate(project.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Project Date:</p>
                <p className="font-medium">{formatDate(project.date)}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Number of Sensors:</p>
                <p className="font-medium">
                  {project.sensors && project.sensors.length > 0
                    ? project.sensors.length
                    : "None"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-start">
              <button
                onClick={handleBackToProjects}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200 cursor-pointer"
              >
                Back to Projects
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Assets;
