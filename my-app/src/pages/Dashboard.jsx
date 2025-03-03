import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/sidenav";
import { TopNav } from "../components/topnav";
import { SensorTable } from "../components/SensorTable";

function Dashboard({ onLogout, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sensorName, setSensorName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user", {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:8000/api/user/add-sensor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sensorName }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add sensor");
      }

      alert("Sensor added successfully");
      setSensorName("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen overflow-auto bg-gray-100">
      {/* Sidebar - Fixed on the left */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 ">
        {/* Fixed Top Navigation */}
        <TopNav />

        {/* Content below TopNav */}
        <div
          className={`p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-0"
            }`}
        >
          <div className="flex justify-between items-center mb-4">
            {data && (
              <div>
                <h1 className="text-2xl font-bold">{data.name}'s Dashboard</h1>
              </div>
            )}
            {/* <button
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Logout
            </button> */}


          </div>

          <div>

            <div className="flex-grow flex flex-col md:flex-row justify-center items-center py-24 bg-gray-100 space-y-6 md:space-y-0 md:space-x-12">

              <div className="flex justify-center items-center p-6">
                <img src="/setu.webp" alt="Setu Logo" className="w-64 h-auto object-contain" />
              </div>

              <div className="bg-white text-center p-12 rounded-lg shadow-xl max-w-lg w-full border border-gray-300">
                <h1 className="text-4xl font-bold text-green-500 mb-4">SETU TECHNOLOGIES INC</h1>
                <p className="text-xl text-gray-800 mb-6">
                  BUILDING BETTER, SAFER AND GREENER INFRASTRUCTURE
                </p>
                <a
                  href="https://www.setutech.ca"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition duration-300"
                >
                  www.setutech.ca
                </a>
              </div>
            </div>



            <div
              class="container mx-auto mt-12 px-4 grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center"
            >
              <a
                href="/view-projects"
                class="bg-green-600 text-white text-center py-5 px-6 max-w-xs w-full rounded-lg shadow-lg hover:bg-green-700 transition duration-300 text-lg flex justify-center mx-auto"
              >
                View Projects
              </a>
              <a
                href="/add-projects"
                class="bg-green-600 text-white text-center py-5 px-6 max-w-xs w-full rounded-lg shadow-lg hover:bg-green-700 transition duration-300 text-lg flex justify-center mx-auto"
              >
                Add Projects
              </a>
            </div>



            <form onSubmit={handleSubmit}>
              <label
                htmlFor="sensorName"
                className="block text-sm font-medium text-gray-900"
              >
                Sensor
              </label>
              <input
                type="text"
                id="sensorName"
                value={sensorName}
                onChange={(e) => setSensorName(e.target.value)}
                className="block w-[300px] rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
              />
              <button
                type="submit"
                className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded"
              >
                Add Sensor
              </button>
            </form>
            <SensorTable ></SensorTable>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
