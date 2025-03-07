import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidenav";
import { TopNav } from "../components/topnav";

function Settings({ token }) {
  const [preferences, setPreferences] = useState({
    email: "",
    frequency: "instant",
    enabled: true,
    notify_on_status_change: true,
    notify_on_temperature_threshold: true,
    temperature_threshold: 30.0,
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user/notification-preferences", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setMessage({ text: "Failed to load preferences", type: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/user/notification-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage({ text: "Settings updated successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to update settings", type: "error" });
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      setMessage({ text: "Failed to update settings", type: "error" });
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="flex h-screen overflow-auto bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex flex-col flex-1">
        <TopNav />
        
        <div className={`p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-0"}`}>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Notification Settings</h1>

              {message.text && (
                <div className={`p-4 mb-6 rounded-md ${
                  message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={preferences.email}
                    onChange={handleChange("email")}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Frequency
                  </label>
                  <select
                    value={preferences.frequency}
                    onChange={handleChange("frequency")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="instant">Instant</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="off">Off</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={preferences.enabled}
                      onChange={handleChange("enabled")}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
                      Enable Email Notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="status_change"
                      checked={preferences.notify_on_status_change}
                      onChange={handleChange("notify_on_status_change")}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="status_change" className="ml-2 block text-sm text-gray-700">
                      Notify on Status Changes
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="temp_threshold"
                      checked={preferences.notify_on_temperature_threshold}
                      onChange={handleChange("notify_on_temperature_threshold")}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="temp_threshold" className="ml-2 block text-sm text-gray-700">
                      Notify on Temperature Threshold
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Threshold (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={preferences.temperature_threshold}
                    onChange={handleChange("temperature_threshold")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  Save Settings
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
