import React from 'react';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../stores/useUIStore';

export const MobileNav: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      <div
        className="fixed inset-0 bg-drishta-dark/60 backdrop-blur-sm"
        onClick={() => setSidebarOpen(false)}
      />
      <div className="relative z-10 w-64 max-w-xs">
        <Sidebar />
      </div>
    </div>
  );
};

export default MobileNav;
