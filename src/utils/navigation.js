import {
  LayoutDashboard,
  Users,
  UserRound,
  House,
  GitBranch,
  Handshake,
  ClipboardCheck,
  CalendarDays,
  ContactRound,
  ChartNoAxesCombined,
  Bell,
  Settings,
} from 'lucide-react'

export const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Clients', path: '/clients', icon: UserRound },
  { label: 'Properties', path: '/properties', icon: House },
  { label: 'Sales Pipeline', path: '/pipeline', icon: GitBranch },
  { label: 'Deals', path: '/deals', icon: Handshake },
  { label: 'Tasks & Follow-ups', path: '/tasks', icon: ClipboardCheck },
  { label: 'Appointments', path: '/appointments', icon: CalendarDays },
  { label: 'Agents', path: '/agents', icon: ContactRound },
  { label: 'Reports & Analytics', path: '/reports', icon: ChartNoAxesCombined },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
]
