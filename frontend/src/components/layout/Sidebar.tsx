import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Calendar,
  User,
  BookOpen,
  TrendingUp,
  Briefcase,
  Code,
  MessageSquare,
  Users,
  Upload,
  Zap,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { role } = useAuthStore();
  const location = useLocation();

  const studentNav = [
    { label: 'Today Dashboard', to: '/app/today', icon: Calendar },
    { label: 'My Plan & Standing', to: '/app/me', icon: User },
    { label: 'Spaced Reviews', to: '/app/reviews', icon: BookOpen },
    { label: 'Predictions', to: '/app/predictions', icon: TrendingUp },
    { label: 'Career & Internships', to: '/app/internships', icon: Briefcase },
    { label: 'Coding Activity', to: '/app/coding', icon: Code },
    { label: 'AI Mentor Chat', to: '/app/mentor', icon: MessageSquare },
  ];

  const facultyNav = [
    { label: 'Cohort Console', to: '/app/console', icon: Users },
    { label: 'Import Cohort', to: '/app/console/ingest', icon: Upload },
    { label: 'Drift Hero Demo', to: '/app/console/drift-hero', icon: Zap },
    { label: 'Interventions', to: '/app/console/interventions', icon: Shield },
  ];

  const navItems = role === 'student' ? studentNav : facultyNav;

  return (
    <aside className="w-64 bg-drishta-dark text-drishta-cream flex flex-col min-h-screen border-r border-drishta-stone/20">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-drishta-stone/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-drishta-blue/20 rounded-lg text-drishta-blue">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-sm text-drishta-cream">STUDENT AI MENTOR</div>
            <div className="text-[10px] font-mono text-drishta-steel uppercase tracking-wider">{role} MODE</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-drishta-stone font-semibold">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-drishta-blue text-drishta-dark font-semibold shadow-sm'
                  : 'text-drishta-steel hover:text-drishta-cream hover:bg-drishta-stone/20'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System info */}
      <div className="p-4 border-t border-drishta-stone/20 text-xs font-mono text-drishta-stone">
        v1.0.0 • Drishta Engine
      </div>
    </aside>
  );
};

export default Sidebar;
