import React, { createContext, useContext, useState } from 'react';
import { type Role, getRole, setRole as setApiRole } from '../lib/api';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(getRole());

  const setRole = (newRole: Role) => {
    setApiRole(newRole);
    setRoleState(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Dev utility to switch roles
export const DevRoleSwitcher: React.FC = () => {
  const { role, setRole } = useRole();
  
  if (import.meta.env.MODE === 'production') return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-surface p-2 rounded-full border border-hairline shadow-lg">
      <span className="text-xs font-mono uppercase text-ink-soft ml-2">Role:</span>
      <div className="flex bg-bg rounded-full p-1">
        <button
          onClick={() => setRole('student')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${role === 'student' ? 'bg-primary text-bg' : 'text-ink-soft hover:bg-surface'}`}
        >
          Student
        </button>
        <button
          onClick={() => setRole('faculty')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${role === 'faculty' ? 'bg-primary text-bg' : 'text-ink-soft hover:bg-surface'}`}
        >
          Faculty
        </button>
      </div>
    </div>
  );
};
