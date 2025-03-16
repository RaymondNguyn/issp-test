import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function Assets({ onLogout }) {
  const [assets, setAssets] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Add Asset States
  const [showForm, setShowForm] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchProjectAndAssets();
  }, [projectId]);

  const deleteAsset = async (assetId, assetName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete asset "${assetName}"? This cannot be undone.`
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
        `http://localhost:8000/api/projects/${projectId}/assets/${assetId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }

      await response.json();
      alert("Asset successfully deleted");

      // Remove the deleted asset from the state
      setAssets(assets.filter((asset) => asset.id !== assetId));
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProjectAndAssets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        onLogout();
        setError("Session expired. Please login again.");
        return;
      }

      // Fetch project details
      const projectResponse = await fetch(
        `http://localhost:8000/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!projectResponse.ok) {
        if (projectResponse.status === 401) {
          onLogout();
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to fetch project details");
      }

      const projectData = await projectResponse.json();
      setProject(projectData);

      // Fetch assets for the project
      const assetsResponse = await fetch(
        `http://localhost:8000/api/projects/${projectId}/assets`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!assetsResponse.ok) {
        if (assetsResponse.status === 401) {
          onLogout();
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to fetch assets");
      }

      const assetsData = await assetsResponse.json();
      setAssets(assetsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBackToProjects = () => {
    navigate("/projects");
  };

  const handleViewSensors = () => {
    navigate("/sensors");
  };

  const handleAddAssetClick = () => {
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userEmail) {
      setFormError("User not authenticated. Please log in again.");
      return;
    }

    try {
      const newAsset = {
        asset_name: assetName,
        description: description,
        date: date ? date.toISOString().split("T")[0] : null,
        project_id: projectId,
      };

      console.log("Sending asset data:", newAsset);

      const response = await fetch(
        `http://localhost:8000/api/projects/${projectId}/assets`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newAsset),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create asset");
      }

      const responseData = await response.json();
      console.log("Response:", responseData);

      // Add the new asset to the list without reloading
      setAssets((prevAssets) => [...prevAssets, responseData]);

      // Reset form
      setShowForm(false);
      setAssetName("");
      setDescription("");
      setDate(null);
      setFormError(null);
    } catch (err) {
      setFormError("Failed to create asset: " + err.message);
      console.error("Error:", err);
    }
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Project Assets</h1>
          <button
            onClick={handleBackToProjects}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md transition duration-200 cursor-pointer"
          >
            Back to Projects
          </button>
        </div>

        {/* Project Details Section */}
        {project && (
          <div className="bg-green-50 p-6 rounded-lg shadow-md mb-8 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold mb-3 text-green-800">
              {project.project_name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Project Date:</p>
                <p className="font-medium">
                  {project.date ? formatDate(project.date) : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Created:</p>
                <p className="font-medium">
                  {project.created_at
                    ? formatDate(project.created_at)
                    : "Unknown"}
                </p>
              </div>
              <div className="col-span-1 md:col-span-2">
                <p className="text-gray-600 text-sm mb-1">Description:</p>
                <p className="font-medium bg-white p-3 rounded border border-green-100">
                  {project.description || "No description available."}
                </p>
              </div>
              {project.sensors && project.sensors.length > 0 && (
                <div>
                  <p className="text-gray-600 text-sm mb-1">Sensors:</p>
                  <p className="font-medium">{project.sensors.length}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600 text-sm mb-1">Project ID:</p>
                <p className="font-mono text-sm">{project.id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assets Section Header */}
        <h2 className="text-xl font-semibold mb-4 mt-6 text-gray-800 border-b pb-2">
          Assets
        </h2>

        {/* Display existing assets */}
        {assets.length > 0 ? (
          <div className="space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 mb-1 text-sm">Asset Name:</p>
                    <p className="font-medium">{asset.asset_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1 text-sm">Asset ID:</p>
                    <p className="font-mono text-sm">{asset.id}</p>
                  </div>
                  {asset.description && (
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-gray-600 mb-1 text-sm">Description:</p>
                      <p className="font-medium">{asset.description}</p>
                    </div>
                  )}
                  {asset.date && (
                    <div>
                      <p className="text-gray-600 mb-1 text-sm">Date:</p>
                      <p className="font-medium">{formatDate(asset.date)}</p>
                    </div>
                  )}
                  {asset.created_at && (
                    <div>
                      <p className="text-gray-600 mb-1 text-sm">Created At:</p>
                      <p className="font-medium">
                        {formatDate(asset.created_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* View Sensors Button */}
                {/* View Sensors and Delete Buttons */}
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={handleViewSensors}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200 cursor-pointer"
                  >
                    View Sensors
                  </button>
                  <button
                    onClick={() => deleteAsset(asset.id, asset.asset_name)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500">No assets found for this project.</p>
          </div>
        )}

        {/* Button to show/hide form */}
        <button
          className="mt-6 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md transition duration-200 cursor-pointer"
          onClick={handleAddAssetClick}
        >
          Add New Asset
        </button>

        {/* Form for adding new assets */}
        {showForm && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-8 max-w-md">
            <h2 className="text-lg font-bold mb-6">Add New Asset</h2>

            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter asset name"
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
                  placeholder="Enter asset description"
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
                  dateFormat="MM/dd/yyyy"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  placeholderText="Select a date"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md transition duration-200 cursor-pointer"
                >
                  Add Asset
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-md transition duration-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Assets;
