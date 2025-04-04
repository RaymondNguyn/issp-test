import { useLocation } from "react-router-dom";
import React from "react";
import { User, LogOut, Settings } from "lucide-react";
import NotificationBell from './NotificationBell/NotificationBell';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";



export function TopNav({ onLogout,token,userData }) {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const handleLogoutClick = (e) => {
    e.preventDefault(); // Prevent default navigation
    onLogout(); // Call the onLogout function passed as prop
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-600 bg-zinc-800">
      <div className="flex h-16 items-center px-6 justify-between w-full">
        {/* Breadcrumb Navigation (Left) */}
        <div className="hidden md:block">
          <nav className="flex items-center space-x-2">
            <a href="/" className="text-sm font-medium text-white">
              Home
            </a>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={segment}>
                <span className="text-gray-400">/</span>
                <a
                  href={`/${pathSegments.slice(0, index + 1).join("/")}`}
                  className="text-sm font-medium text-white hover:text-white"
                >
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </a>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Navigation Icons (Right) */}
        <div className="ml-auto flex items-center space-x-6">
        {userData && userData.isAdmin && (
            <a
            href="/admin"
            className="text-white hover:text-gray-900 transition-colors"
            title="Admin Dashboard"
          >
            Admin
          </a>
        )}
          <NotificationBell auth={{ token }} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-white hover:text-gray-900">
                <User className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">

              <DropdownMenuLabel>Profile</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <a href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> View Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <button 
                  onClick={handleLogoutClick} 
                  className="flex items-center gap-2 text-red-500 w-full text-left"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
          </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
