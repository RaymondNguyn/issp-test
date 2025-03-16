import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidenav";
import { TopNav } from "../../components/topnav";

const AddProject = () => {
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  
    try {
      const projectData = {
        project_name: projectName,
        email: "placeholder@example.com",
        sensors: []
      };
  
      console.log("Sending project data:", projectData);
  
      const response = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(projectData),
      });
  
      const responseData = await response.json();
      console.log("Response from server:", responseData);
  
      if (response.ok) {
        const projectId = responseData.id;
        navigate(`/projects/${projectId}`);
      } else {
        if (responseData.detail && Array.isArray(responseData.detail)) {
          setError(responseData.detail[0]?.msg || "Validation error");
        } else {
          setError(responseData.detail || "Something went wrong");
        }
      }
    } catch (err) {
      setError("Something went wrong with the request");
    }
  };

  return (
    <div className="flex h-screen overflow-auto bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-col flex-1">
        <TopNav />

        <div className={`flex-1 flex items-center justify-center transition-all ${isCollapsed ? "ml-[52px]" : "ml-0"}`}>
          <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Add New Project</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {typeof error === 'object' ? error.msg : error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
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

              <button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md transition duration-200"
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProject;