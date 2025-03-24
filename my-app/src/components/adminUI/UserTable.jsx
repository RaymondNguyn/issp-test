import { useState, useEffect } from "react";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { MoreHorizontal, KeyRound, LogIn } from "lucide-react";

export function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://${backendUrl}:8000/api/admin/dashboard/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch users");
      setLoading(false);
      console.error("Error fetching users:", err);
    }
  };

  // Toggle admin status
  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`http://${backendUrl}:8000/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update the local state after successful API call
      setUsers(users.map((user) =>
        user.id === userId || user._id === userId ? { ...user, isAdmin: !user.isAdmin } : user
      ));
    } catch (err) {
      console.error("Error updating admin status:", err);
      // Show error message to user
    }
  };


  // Toggle approval status
  const toggleApprovalStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`http://${backendUrl}:8000/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isApproved: !currentStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update the local state after successful API call
      setUsers(users.map((user) =>
        user.id === userId || user._id === userId ? { ...user, isApproved: !user.isApproved } : user
      ));
    } catch (err) {
      console.error("Error updating approval status:", err);
      // Show error message to user
    }
  };

  // Reset password
  const resetPassword = async (userId) => {
    try {
      const response = await fetch(`http://${backendUrl}:8000/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      alert("Password reset successful");
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Failed to reset password");
    }
  };

  // Login as user
  const loginAsUser = async (userId) => {
    try {
      const response = await fetch(`http://${backendUrl}:8000/api/admin/users/${userId}/login-as`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      // Store the new token and redirect as needed
      localStorage.setItem("impersonation-token", data.token);
      alert("Logged in as user");
    } catch (err) {
      console.error("Error logging in as user:", err);
      alert("Failed to login as user");
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id || user._id || user.email}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={user.isApproved}
                    onCheckedChange={() => toggleApprovalStatus(user.id || user._id, user.isApproved)}
                    className={`${
                      user.isApproved ? "bg-green-500" : "bg-red-500"
                    } [&>span]:bg-white border border-gray-300`}
                  />
                  <Badge 
                    className={`${
                      user.isApproved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    } rounded-full px-3`}
                  >
                    {user.isApproved ? "Approved" : "Suspended"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={user.isAdmin}
                    onCheckedChange={() => toggleAdminStatus(user.id || user._id, user.isAdmin)}
                    className={`${
                      user.isAdmin ? "bg-green-500" : "bg-red-500"
                    } [&>span]:bg-white border border-gray-300`}
                  />
                  <Badge 
                    className={`${
                      user.isAdmin ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                    } rounded-full px-3`}
                  >
                    {user.isAdmin ? "Admin" : "Non-Admin"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => resetPassword(user.id || user._id)}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Reset Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loginAsUser(user.id || user._id)}>
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>Login as User</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}