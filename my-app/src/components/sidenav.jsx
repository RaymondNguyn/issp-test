import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  BarChart2,
  Folder,
  Settings,
  HelpCircle,
  ThermometerSun,
  ChevronLeft,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Sensors", href: "/sensors", icon: ThermometerSun },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const NavItem = ({ item }) => (
    <Link
      to={item.href}
      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors 
        text-white hover:bg-zinc-900 hover:text-gray-200
        ${isCollapsed ? "justify-center px-2" : ""}`}
    >
      <item.icon className={`h-4 w-4 text-white ${!isCollapsed ? "mr-3" : ""}`} />
      {!isCollapsed && <span>{item.name}</span>}
    </Link>
  );

  return (
    <div
      className={`flex flex-col bg-zinc-800 shadow-sm transition-all duration-300 ease-in-out h-screen sticky top-0
        ${isCollapsed ? "w-16" : "w-64"}`}
    >
      <div className="border-b border-zinc-600">
        <div
          className={`flex h-16 items-center gap-2 px-4 ${
            isCollapsed ? "justify-center px-2" : ""
          }`}
        >
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center font-bold text-white">
              <span className="text-lg">SETU TECHNOLOGIES INC</span>
            </Link>
          )}
          <button
            className="ml-auto h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-900 "
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform text-white ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
            <span className="sr-only ">
              {isCollapsed ? "Expand" : "Collapse"} Sidebar
            </span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <nav className="flex-1 space-y-1 px-2 py-4 ">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
      </div>
      <div className="border-t border-zinc-600 p-2">
        <nav className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
