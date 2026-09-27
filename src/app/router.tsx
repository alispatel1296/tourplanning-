import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom'
import { TravelerShell } from '@/components/layout/TravelerShell'
import { OperatorShell } from '@/components/layout/OperatorShell'
import { homeFor } from '@/lib/auth'
import { useAppState } from '@/state/AppState'
import type { Role } from '@/types'

// Public & Auth routes (lazy-loaded)
const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })))
const Login = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.Signup })))

// Traveler pages (lazy-loaded)
const TravelerDashboard = lazy(() => import('@/pages/traveler/Dashboard').then((m) => ({ default: m.TravelerDashboard })))
const PlanTrip = lazy(() => import('@/pages/traveler/PlanTrip').then((m) => ({ default: m.PlanTrip })))
const PlanBuilder = lazy(() => import('@/pages/traveler/plan/builder/PlanBuilder').then((m) => ({ default: m.PlanBuilder })))
const Prep = lazy(() => import('@/pages/traveler/Prep').then((m) => ({ default: m.Prep })))
const CarryBrief = lazy(() => import('@/pages/traveler/carry/CarryBrief').then((m) => ({ default: m.CarryBrief })))
const Trips = lazy(() => import('@/pages/traveler/Trips').then((m) => ({ default: m.Trips })))
const TravelerProfile = lazy(() => import('@/pages/traveler/Profile').then((m) => ({ default: m.TravelerProfile })))
const Itinerary = lazy(() => import('@/pages/traveler/Itinerary').then((m) => ({ default: m.Itinerary })))
const Checkout = lazy(() => import('@/pages/traveler/Checkout').then((m) => ({ default: m.Checkout })))
const TripDetail = lazy(() => import('@/pages/traveler/TripDetail').then((m) => ({ default: m.TripDetail })))
const LiveTrip = lazy(() => import('@/pages/traveler/LiveTrip').then((m) => ({ default: m.LiveTrip })))
const TravelerMap = lazy(() => import('@/pages/traveler/TravelerMap').then((m) => ({ default: m.TravelerMap })))
const TravelerExplore = lazy(() => import('@/pages/traveler/TravelerExplore').then((m) => ({ default: m.TravelerExplore })))
const TwinStudio = lazy(() => import('@/pages/traveler/twin/TwinStudio').then((m) => ({ default: m.TwinStudio })))
const PredictiveStudio = lazy(() => import('@/pages/traveler/predict/PredictiveStudio').then((m) => ({ default: m.PredictiveStudio })))
const Review = lazy(() => import('@/pages/traveler/Review').then((m) => ({ default: m.Review })))
const TravelerNotifications = lazy(() =>
  import('@/pages/traveler/Notifications').then((m) => ({ default: m.TravelerNotifications })),
)

// Operator pages (lazy-loaded)
const OperatorDashboard = lazy(() => import('@/pages/operator/Dashboard').then((m) => ({ default: m.OperatorDashboard })))
const OperatorCustomers = lazy(() => import('@/pages/operator/Lists').then((m) => ({ default: m.OperatorCustomers })))
const OperatorTours = lazy(() => import('@/pages/operator/tours/ToursBoard').then((m) => ({ default: m.OperatorTours })))
const TourDetail = lazy(() => import('@/pages/operator/tours/TourDetail').then((m) => ({ default: m.TourDetail })))
const CustomerProfile = lazy(() =>
  import('@/pages/operator/customers/CustomerProfile').then((m) => ({ default: m.CustomerProfile })),
)
const OperatorVendors = lazy(() =>
  import('@/pages/operator/vendors/VendorsBoard').then((m) => ({ default: m.OperatorVendors })),
)
const VendorDetail = lazy(() => import('@/pages/operator/vendors/VendorDetail').then((m) => ({ default: m.VendorDetail })))
const MatchingStudio = lazy(() =>
  import('@/pages/operator/vendors/MatchingStudio').then((m) => ({ default: m.MatchingStudio })),
)
const OperatorCoordinators = lazy(() =>
  import('@/pages/operator/coordinators/CoordinatorsBoard').then((m) => ({ default: m.OperatorCoordinators })),
)
const AssignStudio = lazy(() =>
  import('@/pages/operator/coordinators/AssignStudio').then((m) => ({ default: m.AssignStudio })),
)
const OperatorBookings = lazy(() =>
  import('@/pages/operator/bookings/BookingsBoard').then((m) => ({ default: m.OperatorBookings })),
)
const BookingDetail = lazy(() =>
  import('@/pages/operator/bookings/BookingDetail').then((m) => ({ default: m.BookingDetail })),
)
const OperatorGroups = lazy(() =>
  import('@/pages/operator/groups/GroupsBoard').then((m) => ({ default: m.OperatorGroups })),
)
const GroupSync = lazy(() => import('@/pages/operator/groups/GroupSync').then((m) => ({ default: m.GroupSync })))
const OperatorAnalytics = lazy(() =>
  import('@/pages/operator/analytics/AnalyticsBoard').then((m) => ({ default: m.OperatorAnalytics })),
)
const OperatorNotifications = lazy(() =>
  import('@/pages/intelligence/OperatorInbox').then((m) => ({ default: m.OperatorNotifications })),
)
const OperatorConflicts = lazy(() =>
  import('@/pages/operator/Workspace').then((m) => ({ default: m.OperatorConflicts })),
)
const OperatorSettings = lazy(() =>
  import('@/pages/operator/Workspace').then((m) => ({ default: m.OperatorSettings })),
)
const OperatorIntegrations = lazy(() =>
  import('@/pages/operator/settings/Integrations').then((m) => ({ default: m.OperatorIntegrations })),
)
const SerpApiMonitor = lazy(() =>
  import('@/pages/operator/settings/SerpApiMonitor').then((m) => ({ default: m.SerpApiMonitor })),
)
const OperatorTwin = lazy(() => import('@/pages/operator/twin/OperatorTwin').then((m) => ({ default: m.OperatorTwin })))

// Field roles (lazy-loaded)
const CoordinatorHome = lazy(() => import('@/pages/FieldRoles').then((m) => ({ default: m.CoordinatorHome })))
const VendorHome = lazy(() => import('@/pages/FieldRoles').then((m) => ({ default: m.VendorHome })))

function RequireRole({ allow }: { allow: Role[] }) {
  const { role, signIn } = useAppState()
  const location = useLocation()
  const fieldRole = allow.includes('coordinator') || allow.includes('vendor')

  useEffect(() => {
    if (fieldRole && (!role || !allow.includes(role))) {
      signIn(allow[0])
    }
  }, [role, allow, signIn, fieldRole])

  if (!fieldRole && !role) {
    const next = encodeURIComponent(location.pathname + location.search)
    const asRole = allow.includes('operator') ? 'operator' : 'traveler'
    return <Navigate to={`/login?next=${next}&role=${asRole}`} replace />
  }

  if (!fieldRole && role && !allow.includes(role)) {
    return <Navigate to={homeFor(role)} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  )
}

function Suspended({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <div className="ai-generating w-full max-w-sm rounded-xl border border-brand-100 bg-brand-50 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-brand-900">Loading workspace…</p>
        <p className="mt-1 text-[13px] text-slate-600">Opening the next operating surface.</p>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <Suspended><Landing /></Suspended> },
  { path: '/login', element: <Suspended><Login /></Suspended> },
  { path: '/signup', element: <Suspended><Signup /></Suspended> },
  {
    element: <RequireRole allow={['traveler']} />,
    children: [
      {
        path: '/traveler',
        element: <TravelerShell />,
        children: [
          { index: true, element: <TravelerDashboard /> },
          { path: 'explore', element: <TravelerExplore /> },
          { path: 'map', element: <TravelerMap /> },
          { path: 'plan', element: <PlanTrip /> },
          { path: 'plan/build', element: <PlanBuilder /> },
          { path: 'itinerary', element: <Itinerary /> },
          { path: 'carry', element: <CarryBrief /> },
          { path: 'prep', element: <Prep /> },
          { path: 'checkout', element: <Checkout /> },
          { path: 'trips', element: <Trips /> },
          { path: 'trips/:id', element: <TripDetail /> },
          { path: 'live/:id', element: <LiveTrip /> },
          { path: 'twin/:id', element: <TwinStudio /> },
          { path: 'predict/:id', element: <PredictiveStudio /> },
          { path: 'review/:id', element: <Review /> },
          { path: 'profile', element: <TravelerProfile /> },
          { path: 'notifications', element: <TravelerNotifications /> },
        ],
      },
    ],
  },
  {
    element: <RequireRole allow={['operator']} />,
    children: [
      {
        path: '/operator',
        element: <OperatorShell />,
        children: [
          { index: true, element: <OperatorDashboard /> },
          { path: 'tours', element: <OperatorTours /> },
          { path: 'tours/:id', element: <TourDetail /> },
          { path: 'customers', element: <OperatorCustomers /> },
          { path: 'customers/:id', element: <CustomerProfile /> },
          { path: 'vendors', element: <OperatorVendors /> },
          { path: 'vendors/match', element: <MatchingStudio /> },
          { path: 'vendors/:id', element: <VendorDetail /> },
          { path: 'coordinators', element: <OperatorCoordinators /> },
          { path: 'coordinators/assign', element: <AssignStudio /> },
          { path: 'bookings', element: <OperatorBookings /> },
          { path: 'bookings/:id', element: <BookingDetail /> },
          { path: 'groups', element: <OperatorGroups /> },
          { path: 'groups/:id', element: <GroupSync /> },
          { path: 'conflicts', element: <OperatorConflicts /> },
          { path: 'twin', element: <OperatorTwin /> },
          { path: 'analytics', element: <OperatorAnalytics /> },
          { path: 'notifications', element: <OperatorNotifications /> },
          { path: 'settings', element: <OperatorSettings /> },
          { path: 'settings/integrations', element: <OperatorIntegrations /> },
          { path: 'settings/integrations/serpapi', element: <SerpApiMonitor /> },
        ],
      },
    ],
  },
  {
    element: <RequireRole allow={['coordinator']} />,
    children: [{ path: '/coordinator', element: <CoordinatorHome /> }],
  },
  {
    element: <RequireRole allow={['vendor']} />,
    children: [{ path: '/vendor', element: <VendorHome /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
