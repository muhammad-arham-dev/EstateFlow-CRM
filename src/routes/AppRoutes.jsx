import { lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthProvider'
import ProtectedRoute, {
  PublicOnlyRoute,
} from './ProtectedRoute'
import RoleRoute from './RoleRoute'

const DashboardLayout = lazy(
  () => import('../layouts/DashboardLayout'),
)
const DashboardPage = lazy(
  () => import('../pages/DashboardPage'),
)
const PlaceholderPage = lazy(
  () => import('../pages/PlaceholderPage'),
)
const AuthPage = lazy(
  () => import('../pages/AuthPage'),
)
const SettingsPage = lazy(
  () => import('../pages/SettingsPage'),
)
const LeadsPage = lazy(
  () => import('../pages/LeadsPage'),
)
const ClientsPage = lazy(
  () => import('../pages/ClientsPage'),
)
const PropertiesPage = lazy(
  () => import('../pages/PropertiesPage'),
)
const SalesWorkflowPage = lazy(
  () => import('../pages/SalesWorkflowPage'),
)

const managementRoles = [
  'Super Admin',
  'Agency Admin',
  'Manager/Broker',
]

const modules = [
  {
    path: 'leads',
    title: 'Leads',
    description:
      'Capture, qualify, assign, and follow up with prospective customers.',
  },
  {
    path: 'clients',
    title: 'Clients',
    description:
      'Manage buyer, seller, investor, renter, and landlord relationships.',
  },
  {
    path: 'properties',
    title: 'Properties',
    description:
      'Manage property listings, availability, details, and ownership.',
  },
  {
    path: 'pipeline',
    title: 'Sales Pipeline',
    description:
      'Track opportunities as they move through each sales stage.',
  },
  {
    path: 'deals',
    title: 'Deals',
    description:
      'Manage transactions, expected closing dates, and deal values.',
  },
  {
    path: 'tasks',
    title: 'Tasks & Follow-ups',
    description:
      'Organize calls, emails, follow-ups, and outstanding work.',
  },
  {
    path: 'appointments',
    title: 'Appointments',
    description:
      'Coordinate client meetings, consultations, and property viewings.',
  },
  {
    path: 'agents',
    title: 'Agents',
    description:
      'Manage your agency team and monitor individual performance.',
    roles: managementRoles,
  },
  {
    path: 'reports',
    title: 'Reports & Analytics',
    description:
      'Review lead conversion, sales performance, and revenue.',
    roles: managementRoles,
  },
  {
    path: 'notifications',
    title: 'Notifications',
    description:
      'Review assignment updates, reminders, and important activity.',
  },
]

function RouteFallback() {
  return (
    <div className="route-loading" role="status">
      Loading workspace…
    </div>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="login" />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="register" />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="forgot-password" />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/reset-password"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="reset-password" />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/verify-email"
              element={
                <AuthPage mode="verify-email" />
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />

              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

              <Route
                path="/settings"
                element={<SettingsPage />}
              />

              {/* Dedicated CRM pages */}
              <Route
                path="leads"
                element={<LeadsPage />}
              />

              <Route
                path="clients"
                element={<ClientsPage />}
              />

              <Route
                path="clients/:clientId"
                element={<ClientsPage />}
              />

              <Route
                path="properties"
                element={<PropertiesPage />}
              />

              <Route
                path="properties/:propertyId"
                element={<PropertiesPage />}
              />

              <Route path="pipeline" element={<SalesWorkflowPage />} />
              <Route path="deals" element={<SalesWorkflowPage />} />
              <Route path="tasks" element={<SalesWorkflowPage />} />
              <Route path="appointments" element={<SalesWorkflowPage />} />

              {/* Remaining modules */}
              {modules
                .filter(
                  (module) =>
                    !['leads', 'clients', 'properties', 'pipeline', 'deals', 'tasks', 'appointments'].includes(
                      module.path,
                    ),
                )
                .map((module) => {
                  const page = (
                    <PlaceholderPage
                      title={module.title}
                      description={module.description}
                    />
                  )

                  return (
                    <Route
                      key={module.path}
                      path={module.path}
                      element={
                        module.roles ? (
                          <RoleRoute
                            allowedRoles={module.roles}
                          >
                            {page}
                          </RoleRoute>
                        ) : (
                          page
                        )
                      }
                    />
                  )
                })}
            </Route>

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
