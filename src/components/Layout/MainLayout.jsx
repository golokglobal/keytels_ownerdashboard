import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Full-width header spanning above sidebar + content */}
      <Header onMenuClick={() => setSidebarOpen((o) => !o)} />

      {/* Body row: sidebar + page content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar wrapper — collapses width smoothly */}
        <div
          className={`transition-all duration-300 shrink-0 overflow-hidden ${
            sidebarOpen ? 'w-56' : 'w-0'
          }`}
        >
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
