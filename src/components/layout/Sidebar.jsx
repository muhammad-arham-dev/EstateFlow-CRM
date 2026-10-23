import { NavLink } from 'react-router-dom'
import { Building2, ChevronLeft, X } from 'lucide-react'
import { navigationItems } from '../../utils/navigation'
import { useAuth } from '../../features/auth/AuthContext'
import { useUnreadNotificationCount } from '../../features/notifications/useUnreadNotificationCount'

const hiddenForAgents = new Set(['/agents', '/reports'])

export default function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  const { user } = useAuth()
  const unreadCount = useUnreadNotificationCount()

  const visibleItems = navigationItems.filter((item) => {
    if (user?.role === 'Agent' && hiddenForAgents.has(item.path)) {
      return false
    }
    return true
  })

  return (
    <>
      <button
        className={`sidebar-overlay ${mobileOpen ? "is-visible" : ""}`}
        aria-label="Close navigation menu"
        onClick={onClose}
        tabIndex={mobileOpen ? 0 : -1}
      />

      <aside
        className={[
          "sidebar",
          mobileOpen ? "sidebar-mobile-open" : "",
          collapsed ? "sidebar-collapsed" : "",
        ].join(" ")}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Building2 size={22} strokeWidth={2.4} />
          </div>

          {!collapsed && (
            <div className="brand-copy">
              <span className="brand-name">EstateFlow</span>
              <span className="brand-subtitle">REAL ESTATE CRM</span>
            </div>
          )}

          <button
            className="icon-button sidebar-close-mobile"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-label">{!collapsed && "WORKSPACE"}</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/dashboard"}
              title={collapsed ? label : undefined}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              {!collapsed && <span className="nav-link-label">{label}</span>}
              {path === '/notifications' && unreadCount > 0 && (
                <span className="nav-count nav-count-unread" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {!collapsed && (
            <div className="sidebar-help-card">
              <div className="help-icon">✦</div>
              <p className="help-title">Keep deals moving</p>
              <p className="help-copy">
                Stay on top of follow-ups and keep your pipeline healthy.
              </p>
            </div>
          )}

          <button
            type="button"
            className="collapse-button sidebar-collapse-desktop"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={17}
              className={collapsed ? "chevron-flipped" : ""}
            />
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
