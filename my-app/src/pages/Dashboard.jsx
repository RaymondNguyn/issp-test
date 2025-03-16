import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/sidenav";
import { TopNav } from "../components/topnav";
import { SensorTable } from "../components/SensorTable";
import Notifications from "../components/Notifications"; // Import Notifications

function Dashboard({ onLogout, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [weather, setWeather] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchWeather();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user", {
        headers: { Authorization: `Bearer ${token}` },
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

  const fetchWeather = async () => {
    if (!navigator.geolocation) {
      setWeather({ error: "Geolocation is not supported by your browser." });
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=5ed3e9677354856cfba2054cfbf2feab`
        );
        const weatherData = await response.json();
        setWeather({
          temp: weatherData.main.temp,
          condition: weatherData.weather[0].description,
          location: weatherData.name,
        });
      } catch (error) {
        setWeather({ error: "Failed to fetch weather data." });
      }
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen overflow-auto bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex flex-col flex-1">
        <TopNav />
        <Notifications /> {/* Keep Notifications */}

        <div className={`p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-0"}`}>
          <div className="flex justify-between items-center mb-4">
            {data && <h1 className="text-2xl font-bold">{data.name}'s Dashboard</h1>}
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg shadow-lg max-w-md mx-auto mb-6 flex items-center justify-between">
            {weather ? (
              weather.error ? (
                <p className="text-red-300 font-semibold">{weather.error}</p>
              ) : (
                <div className="flex items-center space-x-4">
                  <img src={`https://openweathermap.org/img/wn/10d@2x.png`} alt="WeatherIcon" className="w-14 h-14" />
                  <div>
                    <h2 className="text-xl font-semibold">{weather.location}</h2>
                    <p className="text-lg">{weather.condition}</p>
                    <p className="text-2xl font-bold">{weather.temp}°C</p>
                  </div>
                </div>
              )
            ) : (
              <p>Loading weather...</p>
            )}
          </div>

          <div className="flex-grow flex flex-col md:flex-row justify-center items-center py-24 bg-gray-100 space-y-6 md:space-y-0 md:space-x-12">
            <div className="flex justify-center items-center p-6">
              <img src="/setu.webp" alt="Setu Logo" className="w-64 h-auto object-contain" />
            </div>

            <div className="bg-white text-center p-12 rounded-lg shadow-xl max-w-lg w-full border border-gray-300">
              <h1 className="text-4xl font-bold text-green-500 mb-4">SETU TECHNOLOGIES INC</h1>
              <p className="text-xl text-gray-800 mb-6">BUILDING BETTER, SAFER AND GREENER INFRASTRUCTURE</p>
              <a href="https://www.setutech.ca" className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition duration-300">
                www.setutech.ca
              </a>
            </div>
          </div>

          <div className="container mx-auto mt-12 px-4 grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center mb-8">
            <a href="projects" className="bg-green-600 text-white text-center py-5 px-6 max-w-xs w-full rounded-lg shadow-lg hover:bg-green-700 transition duration-300 text-lg flex justify-center mx-auto">
              View Projects
            </a>
            <a href="/add-projects" className="bg-green-600 text-white text-center py-5 px-6 max-w-xs w-full rounded-lg shadow-lg hover:bg-green-700 transition duration-300 text-lg flex justify-center mx-auto">
              Add Projects
            </a>
          </div>

          <SensorTable />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
