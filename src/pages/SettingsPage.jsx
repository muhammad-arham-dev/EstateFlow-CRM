import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../features/auth/AuthContext'

export default function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const requestedTab = searchParams.get('tab')
  const activeTab = requestedTab === 'security' ? 'security' : 'profile'

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function saveProfile(event) {
    event.preventDefault()

    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.')
      return
    }

    updateProfile({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    })

    toast.success('Profile updated.')
  }

  function changePassword(event) {
    event.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Complete all password fields.')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Your new password must have at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('The new passwords do not match.')
      return
    }

    // This frontend-only demo cannot verify or change a real password.
    toast.info(
      'Password change requires the backend authentication API. No password was changed.',
    )
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <section className="settings-page">
      <div className="settings-page-heading">
        <div>
          <b><h1>Settings</h1></b>
          <p>Manage your account details and security preferences.</p>
        </div>
      </div>

      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          className={activeTab === 'profile' ? 'settings-tab active' : 'settings-tab'}
          onClick={() => setSearchParams({ tab: 'profile' })}
        >
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'security'}
          className={activeTab === 'security' ? 'settings-tab active' : 'settings-tab'}
          onClick={() => setSearchParams({ tab: 'security' })}
        >
          Password & security
        </button>
      </div>

      {activeTab === 'profile' ? (
        <section className="settings-card">
          <div className="settings-card-heading">
            <h2>Personal information</h2>
            <p>Update the details associated with your account.</p>
          </div>

          <form className="settings-form" onSubmit={saveProfile}>
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Account role
              <input value={user?.role || 'Agent'} readOnly />
              <small>
                Role changes are controlled by the development login selector.
              </small>
            </label>

            <div className="settings-form-actions">
              <button className="settings-primary-button" type="submit">
                Save changes
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="settings-card">
          <div className="settings-card-heading">
            <h2>Change password</h2>
            <p>
              Password updates will be enabled when the backend authentication
              service is connected.
            </p>
          </div>

          <form className="settings-form" onSubmit={changePassword}>
            <label>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <small>Use at least 8 characters.</small>
            </label>

            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <div className="settings-form-actions">
              <button className="settings-primary-button" type="submit">
                Request password change
              </button>
            </div>
          </form>
        </section>
      )}
    </section>
  )
}
