import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useParams,
  useRouterState
} from '@tanstack/react-router';
import { LoginPage } from '../routes/app/login';
import { ConsentPage } from '../routes/app/consent';
import { TodayPage } from '../routes/app/today';
import { MePage } from '../routes/app/me';
import { ReviewsPage } from '../routes/app/reviews';
import { InternshipsPage } from '../routes/app/internships';
import { MentorPage } from '../routes/app/mentor';
import { PredictionsPage } from '../routes/app/predictions';
import { ConsolePage } from '../routes/app/console';
import { ConsoleDetailPage } from '../routes/app/console/$id';
import { ConsoleReviewsPage } from '../routes/app/console/reviews';
import { LandingPage } from '../routes/landing';
import { useInterventions, useReviews } from '../api/hooks';
import { useTheme } from './ThemeContext';
import { 
  Sparkles, 
  Brain, 
  Briefcase, 
  TrendingUp, 
  User, 
  Shield, 
  Compass, 
  LogOut, 
  CheckSquare,
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

// ----------------------------------------------------
// Authentication and State Helpers (Unified AppShell Layout)
// ----------------------------------------------------

const AppShell: React.FC<{ children: React.ReactNode; activePath: string; role: 'student' | 'faculty' }> = ({
  children,
  activePath,
  role
}) => {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();

  // Top Bar Search Parameter Binding
  const searchParams = routerState.location.search as { q?: string };
  const searchQuery = searchParams.q || '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate({
      to: '/app/console',
      search: { q: e.target.value }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate({ to: '/app/login' });
  };

  // Nav items based on role
  const studentNav = [
    { label: 'Today Tasks', to: '/app/today', icon: CheckSquare },
    { label: 'Academic Standing', to: '/app/me', icon: User },
    { label: 'Spaced Reviews', to: '/app/reviews', icon: Brain },
    { label: 'Job Matching', to: '/app/internships', icon: Briefcase },
    { label: 'GPA Forecast', to: '/app/predictions', icon: TrendingUp },
    { label: 'AI Mentor Chat', to: '/app/mentor', icon: Sparkles },
    { label: 'Data & Consent', to: '/app/consent', icon: Compass }
  ];

  const facultyNav = [
    { label: 'Cohort Console', to: '/app/console', icon: User },
    { label: 'Oversight Queue', to: '/app/console/reviews', icon: Shield },
    { label: 'Student View', to: '/app/today', icon: Compass }
  ];

  const navLinks = role === 'faculty' ? facultyNav : studentNav;

  // Real data counts from hooks for notifications
  // Faculty: count of pending interventions
  const facultyInterventions = useInterventions();
  const pendingInterventionsCount = role === 'faculty' && facultyInterventions.data
    ? facultyInterventions.data.filter(i => !i.approved).length
    : 0;

  // Student: count of reviews due today
  const studentReviews = useReviews('STU_HERO');
  const reviewsDueCount = role === 'student' && studentReviews.data
    ? studentReviews.data.length
    : 0;

  const notificationCount = role === 'faculty' ? pendingInterventionsCount : reviewsDueCount;

  return (
    <div className="min-h-screen flex bg-bg w-full">
      {/* 1. Sidebar for Desktop (visible on md and up) */}
      <aside className="hidden md:flex md:w-[300px] md:flex-col md:fixed md:inset-y-0 left-0 bg-surface border-r border-line z-30">
        <div
          className="flex items-center space-x-2 px-6 py-5 border-b border-line shrink-0 cursor-pointer hover:bg-surface-2 transition-colors group"
          onClick={() => navigate({ to: '/' })}
          title="Back to landing page"
        >
          <div className="w-3 h-3 rounded-full bg-decide animate-pulse" />
          <span className="text-lg font-display italic font-bold text-text group-hover:text-decide transition-colors">Drishta</span>
          {role === 'faculty' && (
            <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-guard bg-guard-lo px-1.5 py-0.2 rounded border border-guard/10">
              Console
            </span>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = activePath === link.to;
            const Icon = link.icon;
            return (
              <button
                key={link.to}
                onClick={() => navigate({ to: link.to })}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-decide-lo text-decide'
                    : 'text-text-dim hover:text-text hover:bg-surface-2'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{link.label}</span>
                
                {/* Specific count badges */}
                {link.to === '/app/console/reviews' && pendingInterventionsCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-risk-high text-white w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                    {pendingInterventionsCount}
                  </span>
                )}
                {link.to === '/app/reviews' && reviewsDueCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-decide text-white w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                    {reviewsDueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile bottom bar */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-surface-2/50 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-decide-lo text-decide flex items-center justify-center font-bold text-sm shrink-0 font-mono">
              {role === 'faculty' ? 'FA' : 'AM'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">
                {role === 'faculty' ? 'Advisor Dean' : 'Alex Mercer'}
              </p>
              <p className="text-xs text-text-dim truncate">
                {role === 'faculty' ? 'Faculty Admin' : 'Student Account'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-surface-2 border border-line rounded-lg text-text-dim hover:text-text transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Sidebar Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/25" onClick={() => setMobileMenuOpen(false)} />
          
          <aside className="relative flex w-64 max-w-xs flex-col bg-surface border-r border-line p-5 shadow-xl animate-slide-in">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-decide animate-pulse" />
                <span className="text-sm font-display italic font-bold text-text">Drishta</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-surface-2 rounded border border-line cursor-pointer">
                <X className="w-4 h-4 text-text-dim" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5">
              {navLinks.map((link) => {
                const isActive = activePath === link.to;
                const Icon = link.icon;
                return (
                  <button
                    key={link.to}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate({ to: link.to });
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer text-left ${
                      isActive ? 'bg-decide-lo text-decide' : 'text-text-dim hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1">{link.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-line mt-auto flex items-center justify-between">
              <span className="text-[10px] text-text-dim font-mono">Role: {role}</span>
              <button onClick={handleLogout} className="text-xs text-text-dim hover:text-text cursor-pointer flex items-center gap-1">
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Main Chrome Panel */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[300px]">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 border-b border-line bg-surface px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 border border-line rounded-lg hover:bg-surface-2 text-text-dim hover:text-text cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {activePath === '/app/console' ? (
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search cohort by name..."
                  className="w-full pl-9 pr-4 py-1.5 border border-line rounded-lg text-xs bg-surface-2 text-text focus:bg-surface focus:outline-none transition-colors"
                />
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 text-xs text-text-dim">
                <span className="font-semibold text-text font-display italic">Drishta</span>
                <span className="font-mono text-[10px]">▎ {navLinks.find(link => activePath === link.to)?.label || 'Clear Sight Platform'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Theme switcher toggle button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 border border-line rounded-lg hover:bg-surface-2 text-text-dim hover:text-text transition cursor-pointer"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            <div className="relative" title={`${notificationCount} pending alerts`}>
              <button 
                onClick={() => navigate({ to: role === 'faculty' ? '/app/console/reviews' : '/app/reviews' })}
                className="p-1.5 border border-line rounded-lg hover:bg-surface-2 text-text-dim hover:text-text transition cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-risk-high text-white text-[8px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => navigate({ to: '/app/consent' })}
              className="p-1.5 border border-line rounded-lg hover:bg-surface-2 text-text-dim hover:text-text transition cursor-pointer"
              title="Data Rights Toggles"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-full bg-decide/10 border border-decide/20 text-decide flex items-center justify-center font-bold text-xs font-mono select-none">
              {role === 'faculty' ? 'FA' : 'AM'}
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 py-8 px-6 w-full max-w-6xl mx-auto pb-24 md:pb-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// TanStack Router Setup
// ----------------------------------------------------

const rootRoute = createRootRoute({
  component: () => {
    const navigate = useNavigate();
    const routerState = useRouterState();
    const activePath = routerState.location.pathname;
    
    const token = localStorage.getItem('drishta_auth_token');
    const role = localStorage.getItem('drishta_role') as 'student' | 'faculty' | null;

    React.useEffect(() => {
      if (activePath === '/') {
        return;
      }

      if (activePath === '/app') {
        if (token) {
          navigate({ to: role === 'faculty' ? '/app/console' : '/app/today' });
        } else {
          navigate({ to: '/app/login' });
        }
        return;
      }

      if (activePath.startsWith('/app') && activePath !== '/app/login' && !token) {
        navigate({ to: '/app/login' });
      } 
      else if (token && activePath === '/app/login') {
        navigate({ to: role === 'faculty' ? '/app/console' : '/app/today' });
      }
    }, [token, activePath, role, navigate]);

    const isLogin = activePath === '/app/login';
    const isLanding = activePath === '/';

    return (
      <div className="relative min-h-screen text-text">
        <div className="env-bg" />
        
        {isLanding || isLogin ? (
          <Outlet />
        ) : (
          <AppShell activePath={activePath} role={role || 'student'}>
            <Outlet />
          </AppShell>
        )}
      </div>
    );
  }
});

// Route definitions:
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: () => <Outlet />
});

const loginRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/login',
  component: () => {
    const navigate = useNavigate();
    return (
      <LoginPage
        onLoginSuccess={(role) => navigate({ to: role === 'faculty' ? '/app/console' : '/app/today' })}
      />
    );
  }
});

const consentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/consent',
  component: ConsentPage
});

const todayRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/today',
  component: TodayPage
});

const meRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/me',
  component: MePage
});

const reviewsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/reviews',
  component: ReviewsPage
});

const internshipsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/internships',
  component: () => {
    const navigate = useNavigate();
    return (
      <InternshipsPage
        onNavigateToConsent={() => navigate({ to: '/app/consent' })}
        onNavigateToMissions={() => navigate({ to: '/app/today' })}
      />
    );
  }
});

const mentorRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/mentor',
  component: MentorPage
});

const predictionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/predictions',
  component: PredictionsPage
});

const consoleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/console',
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || ''
    };
  },
  component: () => {
    const navigate = useNavigate();
    return (
      <ConsolePage
        onNavigateToStudentDetail={(id) => navigate({ to: `/app/console/${id}` })}
      />
    );
  }
});

const consoleDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/console/$id',
  component: () => {
    const { id } = useParams({ from: '/app/console/$id' });
    const navigate = useNavigate();
    return (
      <ConsoleDetailPage
        studentId={id}
        onBackToCohort={() => navigate({ to: '/app/console', search: { q: '' } })}
        onNavigateToReviews={() => navigate({ to: '/app/console/reviews' })}
      />
    );
  }
});

const consoleReviewsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/console/reviews',
  component: ConsoleReviewsPage
});

// Combine routes into tree
const routeTree = rootRoute.addChildren([
  landingRoute,
  appRoute.addChildren([
    loginRoute,
    consentRoute,
    todayRoute,
    meRoute,
    reviewsRoute,
    internshipsRoute,
    mentorRoute,
    predictionsRoute,
    consoleRoute,
    consoleDetailRoute,
    consoleReviewsRoute
  ])
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
export default AppRouter;
