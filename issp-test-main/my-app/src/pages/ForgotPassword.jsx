import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("A password reset link has been sent to your email.");
      } else {
        throw new Error(data.detail || "Something went wrong!");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800">Forgot Password</h2>
        <p className="text-sm text-gray-600 text-center mt-2">
          Enter your email and we'll send you a password reset link.
        </p>

        {message && <p className="text-green-600 text-center mt-4">{message}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6">
          <label className="block text-gray-700 font-medium">Email Address</label>
          <input
            type="email"
            className="w-full px-4 py-2 mt-2 border rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full mt-4 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition duration-300"
          >
            Send Reset Link
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          Remembered your password?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-green-600 hover:underline"
          >
            Go back to login
          </button>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
