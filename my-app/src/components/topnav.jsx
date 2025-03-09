import { useLocation, Link } from "react-router-dom";
import React from "react";
import { User, Bell, LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navigation = [{ name: "Analytics", href: "/notification", icon: Bell }];

export function TopNav({ onLogout }) {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const handleLogout = () => {
    console.log("Logout button clicked"); // Debugging
    if (typeof onLogout === "function") {
      onLogout(); // Call the onLogout function from App.jsx
    } else {
      console.error("onLogout is not a function"); // Debugging
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-600 bg-zinc-800">
      <div className="flex h-16 items-center px-6 justify-between w-full">
        {/* Breadcrumb Navigation (Left) */}
        <div className="hidden md:block">
          <nav className="flex items-center space-x-2">
            <Link
              to="/"
              className="text-sm font-medium text-white cursor-pointer"
            >
              Home
            </Link>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={segment}>
                <span className="text-gray-400">/</span>
                <Link
                  to={`/${pathSegments.slice(0, index + 1).join("/")}`}
                  className="text-sm font-medium text-white hover:text-white cursor-pointer"
                >
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Navigation Icons (Right) */}
        <div className="ml-auto flex items-center space-x-6">
          {navigation.map(({ name, href, icon: Icon }) => (
            <Link
              key={name}
              to={href}
              className="text-white hover:text-gray-900 transition-colors cursor-pointer"
              title={name}
            >
              <Icon className="h-6 w-6" />
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-white hover:text-gray-900 cursor-pointer">
                <User className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuLabel>Profile</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <User className="h-4 w-4" /> View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 text-red-500">
                  <LogOut className="h-4 w-4" /> Logout
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
