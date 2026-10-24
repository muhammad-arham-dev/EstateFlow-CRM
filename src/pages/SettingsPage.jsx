import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ImagePlus, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../features/auth/AuthContext'

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024
const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PROFILE_IMAGE_DIMENSION = 512

function readProfileImage(file) {
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
        resolve({
          src: reader.result,
          width: image.naturalWidth,
          height: image.naturalHeight,
        })
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
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
  const [cropSource, setCropSource] = useState(null)
  const [cropViewportSize, setCropViewportSize] = useState(280)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const cropDrag = useRef(null)

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
      const image = await readProfileImage(file)
      setCropSource(image)
      setCropZoom(1)
      setCropOffset({ x: 0, y: 0 })
    } catch (error) {
      setPhotoError(error.message || 'Unable to process the selected profile picture.')
    } finally {
      setProcessingPhoto(false)
    }
  }

  function cropBounds(zoom = cropZoom) {
    const viewportSize = cropViewportSize
    const scale = viewportSize / Math.min(cropSource.width, cropSource.height) * zoom
    return {
      viewportSize,
      scale,
      maxX: Math.max(0, (cropSource.width * scale - viewportSize) / 2),
      maxY: Math.max(0, (cropSource.height * scale - viewportSize) / 2),
    }
  }

  function updateCropZoom(value) {
    const zoom = Number(value)
    const bounds = cropBounds(zoom)
    setCropZoom(zoom)
    setCropOffset((offset) => ({
      x: clamp(offset.x, -bounds.maxX, bounds.maxX),
      y: clamp(offset.y, -bounds.maxY, bounds.maxY),
    }))
  }

  function startCropDrag(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    event.currentTarget.setPointerCapture(event.pointerId)
    cropDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset: cropOffset,
    }
  }

  function moveCrop(event) {
    const drag = cropDrag.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const bounds = cropBounds()
    setCropOffset({
      x: clamp(drag.offset.x + event.clientX - drag.startX, -bounds.maxX, bounds.maxX),
      y: clamp(drag.offset.y + event.clientY - drag.startY, -bounds.maxY, bounds.maxY),
    })
  }

  function nudgeCrop(event) {
    const nudges = {
      ArrowLeft: [-10, 0],
      ArrowRight: [10, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10],
    }
    const nudge = nudges[event.key]
    if (!nudge) return
    event.preventDefault()
    const bounds = cropBounds()
    setCropOffset((offset) => ({
      x: clamp(offset.x + nudge[0], -bounds.maxX, bounds.maxX),
      y: clamp(offset.y + nudge[1], -bounds.maxY, bounds.maxY),
    }))
  }

  function finishCropDrag(event) {
    if (cropDrag.current?.pointerId === event.pointerId) cropDrag.current = null
  }

  function cancelCrop() {
    setCropSource(null)
    setCropOffset({ x: 0, y: 0 })
  }

  function applyCrop() {
    const image = new Image()
    image.onerror = () => setPhotoError('Could not crop the selected profile picture.')
    image.onload = () => {
      try {
        const { viewportSize, scale } = cropBounds()
        const sourceSize = viewportSize / scale
        const sourceX = clamp(
          (image.naturalWidth - sourceSize) / 2 - cropOffset.x / scale,
          0,
          image.naturalWidth - sourceSize,
        )
        const sourceY = clamp(
          (image.naturalHeight - sourceSize) / 2 - cropOffset.y / scale,
          0,
          image.naturalHeight - sourceSize,
        )
        const canvas = document.createElement('canvas')
        canvas.width = PROFILE_IMAGE_DIMENSION
        canvas.height = PROFILE_IMAGE_DIMENSION
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Your browser cannot process this profile picture.')
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          PROFILE_IMAGE_DIMENSION,
          PROFILE_IMAGE_DIMENSION,
        )
        setProfileImage(canvas.toDataURL('image/jpeg', 0.82))
        cancelCrop()
      } catch (error) {
        setPhotoError(error.message || 'Unable to crop the selected profile picture.')
      }
    }
    image.src = cropSource.src
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
              <button
                className="settings-photo-preview"
                type="button"
                onClick={() => profileImage && setPreviewOpen(true)}
                disabled={!profileImage}
                aria-label={profileImage ? 'View full-size profile picture' : 'No profile picture uploaded'}
              >
                {profileImage ? <img src={profileImage} alt="" /> : <UserRound size={30} />}
              </button>
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
      {cropSource && (
        <div
          className="settings-photo-modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && cancelCrop()}
        >
          <section className="settings-photo-modal" role="dialog" aria-modal="true" aria-labelledby="profile-crop-title">
            <header>
              <div>
                <span className="settings-photo-modal-kicker">PROFILE PICTURE</span>
                <h2 id="profile-crop-title">Crop your picture</h2>
              </div>
              <button type="button" className="settings-photo-modal-close" onClick={cancelCrop} aria-label="Cancel crop">
                <X size={17} />
              </button>
            </header>
            <p>Drag the image to position it, then adjust the zoom to fit the circle.</p>
            <div
              className="settings-photo-crop-stage"
              tabIndex={0}
              aria-label="Image crop area. Drag or use arrow keys to reposition the picture."
              ref={(node) => {
                if (node) setCropViewportSize(node.clientWidth)
              }}
              onKeyDown={nudgeCrop}
              onPointerDown={startCropDrag}
              onPointerMove={moveCrop}
              onPointerUp={finishCropDrag}
              onPointerCancel={finishCropDrag}
              onLostPointerCapture={finishCropDrag}
            >
              <img
                src={cropSource.src}
                alt="Adjustable profile picture crop"
                draggable="false"
                style={{
                  width: `${cropSource.width * cropBounds().scale}px`,
                  transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px))`,
                }}
              />
            </div>
            <label className="settings-photo-zoom">
              Zoom
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={cropZoom}
                onChange={(event) => updateCropZoom(event.target.value)}
              />
            </label>
            <footer>
              <button type="button" className="settings-photo-cancel" onClick={cancelCrop}>Cancel</button>
              <button type="button" className="settings-primary-button" onClick={applyCrop}>Use picture</button>
            </footer>
          </section>
        </div>
      )}
      {previewOpen && profileImage && (
        <div
          className="settings-photo-viewer-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setPreviewOpen(false)}
        >
          <button type="button" className="settings-photo-viewer-close" onClick={() => setPreviewOpen(false)} aria-label="Close profile picture preview">
            <X size={20} />
          </button>
          <img src={profileImage} alt="Full-size profile picture" />
        </div>
      )}
    </section>
  )
}
