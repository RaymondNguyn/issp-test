import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidenav";
import { TopNav } from "../../components/topnav";

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          throw new Error("Session expired. Please login again.");
        }
        throw new Error("Network response was not ok");
      }
      const jsonData = await response.json();
      setData(jsonData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen overflow-auto bg-gray-100">
      {/* Sidebar - Fixed on the left */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Fixed Top Navigation */}
        <TopNav />

        {/* Content below TopNav */}
        <div className={`p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-0"}`}>
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
              {data.map((project, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300"
                >
                  <h2 className="text-xl font-semibold mb-2">{project.project_name}</h2>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {project.created_at}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Description:</strong> {project.description || "No description available."}
                  </p>
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)} // Navigate to project details
                    className="block mt-4 bg-green-500 text-white text-center px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No projects found. Add one!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Projects;
