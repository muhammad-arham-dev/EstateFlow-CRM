import { useState } from 'react'
import {
  Outlet,
  useLocation,
} from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import { navigationItems } from '../utils/navigation'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const currentPage =
    navigationItems.find(
      (item) => item.path === location.pathname,
    ) ||
    navigationItems.find((item) =>
      location.pathname.startsWith(
        `${item.path}/`,
      ),
    )

  return (
    <div className="app-shell">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() =>
          setCollapsed((value) => !value)
        }
      />

      <div
        className={`main-shell ${
          collapsed ? 'main-shell-expanded' : ''
        }`}
      >
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
        />

        <main
          className="page-content"
          id="main-content"
        >
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="breadcrumb-separator">
              /
            </span>
            <strong>
              {currentPage?.label ?? 'Page'}
            </strong>
          </div>

          <Outlet />
        </main>

        <footer className="app-footer">
          <span>EstateFlow CRM</span>
          <span>
            Real estate operations, all in one place.
          </span>
        </footer>
      </div>
    </div>
  )
}
