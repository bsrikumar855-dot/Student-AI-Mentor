import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  Navigate,
} from '@tanstack/react-router';
import { AppShell } from '../components/layout/AppShell';

// Student Pages
import TodayPage from '../pages/student/TodayPage';
import MePage from '../pages/student/MePage';
import ReviewsPage from '../pages/student/ReviewsPage';
import PredictionsPage from '../pages/student/PredictionsPage';
import InternshipsPage from '../pages/student/InternshipsPage';
import CodingPage from '../pages/student/CodingPage';
import AIMentorPage from '../pages/student/AIMentorPage';

// Faculty/Mentor Pages
import ConsolePage from '../pages/mentor/ConsolePage';
import IngestPage from '../pages/mentor/IngestPage';
import DriftHeroPage from '../pages/mentor/DriftHeroPage';
import InterventionsPage from '../pages/mentor/InterventionsPage';

// Root Route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// App Shell Route
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'app',
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

// Redirect / to /app/today
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/app/today" replace />,
});

// Student Subroutes
const todayRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'today',
  component: TodayPage,
});

const meRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'me',
  component: MePage,
});

const reviewsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'reviews',
  component: ReviewsPage,
});

const predictionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'predictions',
  component: PredictionsPage,
});

const internshipsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'internships',
  component: InternshipsPage,
});

const codingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'coding',
  component: CodingPage,
});

const mentorRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'mentor',
  component: AIMentorPage,
});

// Faculty/Mentor Subroutes
const consoleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'console',
  component: ConsolePage,
});

const consoleIngestRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'console/ingest',
  component: IngestPage,
});

const consoleDriftHeroRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'console/drift-hero',
  component: DriftHeroPage,
});

const consoleInterventionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'console/interventions',
  component: InterventionsPage,
});

// Combine route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  appRoute.addChildren([
    todayRoute,
    meRoute,
    reviewsRoute,
    predictionsRoute,
    internshipsRoute,
    codingRoute,
    mentorRoute,
    consoleRoute,
    consoleIngestRoute,
    consoleDriftHeroRoute,
    consoleInterventionsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
