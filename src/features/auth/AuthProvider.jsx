import { AuthContext } from './AuthContext'
import {
  useCallback,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'real-estate-crm-session'

const validRoles = [
  'Super Admin',
  'Agency Admin',
  'Manager/Broker',
  'Agent',
]

function readSession() {
  try {
    const session = localStorage.getItem(STORAGE_KEY)
    return session ? JSON.parse(session) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  const saveUser = useCallback((nextUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const login = useCallback(
    async ({ email, password, role }) => {
      if (!email || !password) {
        throw new Error('Enter your email and password.')
      }

      // Development only: replace this with the backend login API.
      const nextUser = {
        id: email.toLowerCase(),
        name: email.split('@')[0].replace(/[._-]/g, ' '),
        email: email.toLowerCase(),
        role: import.meta.env.DEV && validRoles.includes(role)
          ? role
          : 'Agent',
      }

      saveUser(nextUser)
      return nextUser
    },
    [saveUser],
  )

  const register = useCallback(
    async ({ name, email, password, role }) => {
      if (!name.trim() || !email.trim() || !password) {
        throw new Error('Complete all required fields.')
      }

      if (password.length < 8) {
        throw new Error('Use a password with at least 8 characters.')
      }

      // Mock only. Real registration must be handled by the backend.
      const nextUser = {
        id: email.toLowerCase(),
        name: name.trim(),
        email: email.toLowerCase(),
        role: import.meta.env.DEV && validRoles.includes(role)
          ? role
          : 'Agent',
      }

      saveUser(nextUser)
      return nextUser
    },
    [saveUser],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    (updates) => {
      if (!user) return
      saveUser({ ...user, ...updates })
    },
    [saveUser, user],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, login, register, logout, updateProfile],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}