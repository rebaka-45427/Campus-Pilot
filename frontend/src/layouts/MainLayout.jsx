import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarClock, 
  GraduationCap, 
  BookOpen, 
  PieChart, 
  Menu, 
  X,
  Settings,
  UserCircle,
  CalendarDays,
  StickyNote,
  Search
} from 'lucide-react';
import { cn } from '../utils/cn';
import GlobalSearch from '../components/GlobalSearch';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Attendance', path: '/attendance', icon: GraduationCap },
    { name: 'Assignments', path: '/assignments', icon: BookOpen },
    { name: 'Weekly Timetable', path: '/timetable', icon: CalendarClock },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Notes', path: '/notes', icon: StickyNote },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
  ];

  const bottomNavItems = [
    { name: 'Profile', path: '/profile', icon: UserCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-soft">
              CP
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">CampusPilot<span className="text-primary">.os</span></span>
          </div>
          <button onClick={toggleSidebar} className="ml-auto lg:hidden text-gray-400 hover:text-gray-900">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Productivity</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-white shadow-soft" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon size={20} className={cn("mr-4", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                <span className="font-semibold text-sm">{item.name}</span>
              </NavLink>
            );
          })}

          <div className="px-4 mt-8 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">System</div>
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-white shadow-soft" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon size={20} className={cn("mr-4", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                <span className="font-semibold text-sm">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAFBFF]">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-soft">
              CP
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">CampusPilot</span>
          </div>
          <div className="flex items-center">
            <button className="text-gray-400 hover:text-gray-900 mr-2 flex items-center justify-center bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
              <Search size={16} className="mr-1" /> Search
            </button>
            <button onClick={toggleSidebar} className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-xl">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Global Search Component */}
        <GlobalSearch />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
