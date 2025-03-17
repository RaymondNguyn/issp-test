import { TopNav } from "../components/topnav";
import { Sidebar } from "../components/sidenav";

export function Layout({ children, onLogout, isCollapsed, setIsCollapsed }) {
  return (
    <div className="flex h-screen overflow-auto bg-gray-100">
      {/* Sidebar - Fixed on the left */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Fixed Top Navigation */}
        <TopNav onLogout={onLogout} /> {/* Pass onLogout to TopNav */}
        {/* Content below TopNav */}
        <div
          className={`p-6 transition-all ${isCollapsed ? "ml-[52px]" : "ml-0"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}