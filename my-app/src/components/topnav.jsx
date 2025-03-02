import { useLocation } from "react-router-dom";
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

const navigation = [
  { name: "Analytics", href: "/notification", icon: Bell },
];

export function TopNav() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center px-6 justify-between w-full">
        {/* Breadcrumb Navigation (Left) */}
        <div className="hidden md:block">
          <nav className="flex items-center space-x-2">
            <a href="/" className="text-sm font-medium">
              Home
            </a>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={segment}>
                <span className="text-gray-400">/</span>
                <a
                  href={`/${pathSegments.slice(0, index + 1).join("/")}`}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </a>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Navigation Icons (Right) */}
        <div className="ml-auto flex items-center space-x-6">
          {navigation.map(({ name, href, icon: Icon }) => (
            <a
              key={name}
              href={href}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title={name}
            >
              <Icon className="h-6 w-6" />
            </a>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-gray-600 hover:text-gray-900">
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
              <DropdownMenuItem asChild>
                <a href="/logout" className="flex items-center gap-2 text-red-500">
                  <LogOut className="h-4 w-4" /> Logout
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
