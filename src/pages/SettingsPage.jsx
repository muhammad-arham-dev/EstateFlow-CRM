import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ImagePlus, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../features/auth/AuthContext'

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024
const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PROFILE_IMAGE_DIMENSION = 512

function resizeProfileImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected profile picture.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read the selected profile picture.'))
        return
      }

      const image = new Image()
      image.onerror = () => reject(new Error('The selected file is not a valid image.'))
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_PROFILE_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
        )
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Your browser cannot process this profile picture.'))
          return
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const photoInput = useRef(null)

  const requestedTab = searchParams.get('tab')
  const activeTab = requestedTab === 'security' ? 'security' : 'profile'

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [country, setCountry] = useState(user?.country || '')
  const [city, setCity] = useState(user?.city || '')
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '')
  const [profileImage, setProfileImage] = useState(user?.profileImage || '')
  const [photoError, setPhotoError] = useState('')
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function selectProfileImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setPhotoError('')
    if (!file) return

    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      setPhotoError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setPhotoError('Profile pictures must be 5 MB or smaller.')
      return
    }

    setProcessingPhoto(true)
    try {
      setProfileImage(await resizeProfileImage(file))
    } catch (error) {
      setPhotoError(error.message || 'Unable to process the selected profile picture.')
    } finally {
      setProcessingPhoto(false)
    }
  }

  function saveProfile(event) {
    event.preventDefault()

    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.')
      return
    }

    setSavingProfile(true)
    try {
      updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        country: country.trim(),
        city: city.trim(),
        dateOfBirth,
        profileImage,
      })
      toast.success('Profile updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to save your profile.')
    } finally {
      setSavingProfile(false)
    }
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

          <form className="settings-form settings-profile-form" onSubmit={saveProfile}>
            <div className="settings-photo-field">
              <span className="settings-photo-preview">
                {profileImage
                  ? <img src={profileImage} alt="Profile preview" />
                  : <UserRound size={30} />}
              </span>
              <div className="settings-photo-copy">
                <strong>Profile picture</strong>
                {photoError && <small role="alert">{photoError}</small>}
              </div>
              <div className="settings-photo-actions">
                <label className="settings-photo-upload">
                  <ImagePlus size={15} />
                  <span>{profileImage ? 'Change picture' : 'Upload picture'}</span>
                  <input
                    ref={photoInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selectProfileImage}
                    aria-label="Upload profile picture"
                  />
                </label>
                {profileImage && (
                  <button
                    className="settings-photo-remove"
                    type="button"
                    onClick={() => {
                      setProfileImage('')
                      setPhotoError('')
                    }}
                  >
                    <X size={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>

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
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </label>

            <label>
              Address
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                autoComplete="street-address"
              />
            </label>

            <label>
              Country
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                autoComplete="country-name"
              />
            </label>

            <label>
              City
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
              />
            </label>

            <label>
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                max={(() => {
                  const today = new Date()
                  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
                  return today.toISOString().slice(0, 10)
                })()}
                autoComplete="bday"
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
              <button className="settings-primary-button" type="submit" disabled={savingProfile || processingPhoto}>
                {processingPhoto ? 'Processing picture…' : savingProfile ? 'Saving…' : 'Save changes'}
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
