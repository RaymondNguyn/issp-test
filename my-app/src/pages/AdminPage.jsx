import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { UsersTable } from "../components/adminUI/UserTable";

function AdminPage({ auth, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        onLogout();
        return;
      }

      if (!auth?.isApproved) {
        navigate("/pending-approval", { replace: true });
      } else if (!auth?.isAdmin) {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  }, [auth, navigate, onLogout]);

  return (
    <Layout onLogout={onLogout} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
      <div className={`p-6 ${isCollapsed ? "ml-[52px]" : "ml-0"}`}></div>

      {error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <UsersTable />
      )}
    </Layout>
  );
}

export default AdminPage;
