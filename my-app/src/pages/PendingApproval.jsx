import React from "react";
import { useNavigate } from "react-router-dom";



const PendingApproval = ({ onLogout }) => {
    const navigate = useNavigate();
    const handleLogoutClick = (e) => {
      e.preventDefault(); // Prevent default navigation
      onLogout(); // Call the onLogout function
      navigate("/login");
    };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Account Pending Approval</h1>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700">
              Your account is currently awaiting approval from an administrator.
            </p>
          </div>
          
          <div className="mt-6">
            <p className="text-gray-600">
              You'll be able to access the full features of the application once your account has been approved.
            </p>
            <p className="mt-2 text-gray-600">
              Please check back later or contact the administrator if you believe this is an error.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-500">
              For assistance, please contact: 
              <a href="mailto:support@example.com" className="ml-1 text-blue-500 hover:underline">
                support@example.com
              </a>
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Check Status Again
            </button>
            
            <button
              onClick={handleLogoutClick}
              className="w-full py-2 text-sm font-medium text-center text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;