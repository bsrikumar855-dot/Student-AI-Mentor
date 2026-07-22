import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../../contexts/RoleContext';

export const NavBar: React.FC = () => {
  const { setRole } = useRole();
  const location = useLocation();

  return (
    <nav className="bg-bg border-b border-hairline py-4 px-8 shadow-sm z-30 relative">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex flex-col group">
          <span className="font-ceremonial text-2xl font-bold tracking-wider text-primary group-hover:text-brass transition-colors">Drishta</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">Sees the student. Shows the reason.</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            to="/home" 
            className={`font-mono text-xs uppercase tracking-widest px-3 py-1.5 rounded transition-all ${location.pathname === '/home' ? 'text-primary border border-primary/20 bg-primary/5' : 'text-ink-soft hover:text-ink'}`}
            onClick={() => setRole('student')}
          >
            Student View
          </Link>
          <Link 
            to="/console" 
            className={`font-mono text-xs uppercase tracking-widest px-3 py-1.5 rounded transition-all ${location.pathname.startsWith('/console') ? 'text-primary border border-primary/20 bg-primary/5' : 'text-ink-soft hover:text-ink'}`}
            onClick={() => setRole('faculty')}
          >
            Faculty Console
          </Link>
        </div>
      </div>
    </nav>
  );
};
