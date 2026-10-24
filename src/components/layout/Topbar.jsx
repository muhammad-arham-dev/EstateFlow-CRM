import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../features/auth/AuthContext'
import { useUnreadNotificationCount } from '../../features/notifications/useUnreadNotificationCount'

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U'
}

export default function Topbar({ onMenuClick }) {
  const [search, setSearch] = useState('')
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const unreadCount = useUnreadNotificationCount()

  function handleSearch(event) {
    event.preventDefault()
    const query = search.trim()

    if (!query) {
      toast.info('Enter a name, email, phone, or record to search.')
      return
    }

    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const quickActions = [
    { label: 'New lead', path: '/leads' },
    { label: 'New client', path: '/clients' },
    { label: 'New property', path: '/properties' },
    { label: 'New task', path: '/tasks' },
    { label: 'New appointment', path: '/appointments' },
    { label: 'New deal', path: '/deals' },
  ]

  function handleQuickAdd(path) {
    setQuickAddOpen(false)
    navigate(path, { state: { quickAdd: true } })
  }

  function openSettings(tab) {
    setProfileOpen(false)
    navigate(`/settings?tab=${tab}`)
  }

  function handleLogout() {
    setProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
    toast.success('You have been signed out.')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={21} />
        </button>

        <form className="global-search" onSubmit={handleSearch} role="search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search anything..."
            aria-label="Search CRM records"
          />
          <kbd>↵</kbd>
        </form>
      </div>

      <div className="topbar-actions">
        <div className="quick-add-wrap">
          <button
            className="button button-primary quick-add-button"
            onClick={() => {
              setProfileOpen(false);
              setQuickAddOpen((open) => !open);
            }}
            aria-expanded={quickAddOpen}
          >
            <Plus size={17} />
            <span>Quick add</span>
            <ChevronDown size={15} />
          </button>

          {quickAddOpen && (
            <>
              <button
                className="dropdown-dismiss"
                aria-label="Close quick add menu"
                onClick={() => setQuickAddOpen(false)}
              />
              <div className="quick-add-menu">
                <p className="dropdown-heading">CREATE NEW</p>
                {quickActions.map((action) => (
                  <button
                    key={action.path}
                    className="quick-add-item"
                    onClick={() => handleQuickAdd(action.path)}
                  >
                    <Plus size={15} />
                    {action.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          className="icon-button notification-button"
          onClick={() => navigate("/notifications")}
          aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          title={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell size={19} />
          {unreadCount > 0 && <span className="notification-count-badge">{unreadCount}</span>}
        </button>

        <div className="profile-menu-wrap">
          <button
            type="button"
            className="profile-menu"
            onClick={() => {
              setQuickAddOpen(false);
              setProfileOpen((open) => !open);
            }}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            <span className="avatar avatar-topbar">
              {user?.profileImage
                ? <img src={user.profileImage} alt="" />
                : getInitials(user?.name)}
            </span>
            <span className="profile-copy">
              <strong>{user?.name || "User"}</strong>
              <small>{user?.role || "Agent"}</small>
            </span>
            <ChevronDown size={15} className="profile-chevron" />
            <UserRound size={1} className="visually-hidden" />
          </button>

          {profileOpen && (
            <>
              <button
                className="dropdown-dismiss"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
              />
              <div className="profile-dropdown">
                <div className="profile-dropdown-heading">
                  <strong>{user?.name || "User"}</strong>
                  <span>{user?.email}</span>
                  <small>{user?.role || "Agent"}</small>
                </div>

                <button
                  className="profile-dropdown-item"
                  onClick={() => openSettings("profile")}
                >
                  <UserRound size={16} />
                  Edit profile
                </button>

                <button
                  className="profile-dropdown-item"
                  onClick={() => openSettings("security")}
                >
                  <Settings size={16} />
                  Password & security
                </button>

                <button
                  className="profile-dropdown-item profile-dropdown-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
