import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { UserRole } from '../../types';

export const Topbar: React.FC = () => {
  const { role, setRole, studentId } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as UserRole);
  };

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-drishta-steel/20 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-drishta-dark hover:bg-drishta-blue/20"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-2 text-xs font-mono text-drishta-stone">
          <ShieldCheck className="h-4 w-4 text-drishta-steel" />
          <span>Active Context: <strong className="text-drishta-dark">{studentId}</strong></span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <label className="text-xs font-mono text-drishta-stone font-medium hidden sm:inline">Role Simulator:</label>
        <select
          value={role}
          onChange={handleRoleChange}
          className="text-xs font-mono bg-drishta-cream border border-drishta-steel/30 text-drishta-dark rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-drishta-blue"
        >
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </header>
  );
};

export default Topbar;
