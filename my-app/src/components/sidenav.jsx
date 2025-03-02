import { useState } from "react";
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
  { name: "Dashboard", href: "/", icon: Home },
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
    <a
      href={item.href}
      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors 
        text-gray-600 hover:bg-gray-200 hover:text-gray-900
        ${isCollapsed ? "justify-center px-2" : ""}`}
    >
      <item.icon className={`h-4 w-4 ${!isCollapsed ? "mr-3" : ""}`} />
      {!isCollapsed && <span>{item.name}</span>}
    </a>
  );

  return (
    <div
      className={`fixed inset-y-0 z-20 flex flex-col bg-white transition-all duration-300 ease-in-out lg:static
        ${isCollapsed ? "w-[72px]" : "w-72"}`}
    >
      <div className="border-b border-gray-200">
        <div
          className={`flex h-16 items-center gap-2 px-4 ${
            isCollapsed ? "justify-center px-2" : ""
          }`}
        >
          {!isCollapsed && (
            <a href="/" className="flex items-center font-semibold text-lg">
              <span className="text-lg">SETU Tecnology</span>
            </a>
          )}
          <button
            className="ml-auto h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
            <span className="sr-only">
              {isCollapsed ? "Expand" : "Collapse"} Sidebar
            </span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
      </div>
      <div className="border-t border-gray-200 p-2">
        <nav className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
