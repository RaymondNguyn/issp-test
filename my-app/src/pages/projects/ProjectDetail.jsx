import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";

const ProjectDetail = ({ onLogout, token }) => {
  const { projectId } = useParams();
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
          `http://localhost:8000/api/projects/${projectId}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch project details");
        }

        const data = await response.json();
        console.log("Project details:", data); // Debug log
        setProject(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";

    try {
      const options = { year: "numeric", month: "long", day: "numeric" };
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date error";
    }
  };

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
          <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
          <p className="text-gray-700 mb-2">
            {project.description || "No description"}
          </p>
          <p className="text-gray-500">Date: {formatDate(project.date)}</p>
          <p className="text-gray-500">Project ID: {project.project_id}</p>
          <p className="text-gray-500">
            Sensors:{" "}
            {project.sensor_ids && project.sensor_ids.length > 0
              ? project.sensor_ids.length
              : "None"}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;
