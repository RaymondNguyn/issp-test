import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProjectDetail = ({ onLogout, token }) => {
  const { projectId } = useParams(); // Get the projectId from the URL
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch project details
        const response = await fetch(
          `http://${backendUrl}:8000/api/projects/${projectId}/assets`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch project details");
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (projectId) {
      fetchProjectDetails(); // Fetch project details only if projectId is defined
    }
  }, [projectId]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <Layout
      onLogout={onLogout}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Project Details</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">{project.project_name}</h3>
          <p className="text-gray-700 mb-2">{project.description}</p>
          <p className="text-gray-500">Date: {project.date}</p>
          <p className="text-gray-500">
            Created At: {new Date(project.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;