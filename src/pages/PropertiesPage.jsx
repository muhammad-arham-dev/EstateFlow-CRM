import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronDown,
  Edit3,
  Eye,
  Filter,
  Home,
  ImagePlus,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../features/auth/AuthContext'
import {
  PROPERTY_AGENTS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  propertyService,
} from '../features/properties/propertyService'
import '../styles/clients.css'

const emptyForm = {
  title: '',
  propertyType: PROPERTY_TYPES[0],
  status: 'Available',
  price: '',
  bedrooms: '0',
  bathrooms: '0',
  squareFeet: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  assignedTo: PROPERTY_AGENTS[0],
  description: '',
  images: [],
}

const MAX_PROPERTY_IMAGES = 6
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`Could not read ${file.name}.`))
        return
      }

      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        dataUrl: reader.result,
      })
    }
    reader.readAsDataURL(file)
  })
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatPrice(value, status) {
  const price = Number(value)

  if (!Number.isFinite(price)) return 'Not specified'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price) + (status === 'For Rent' ? ' / mo' : '')
}

function fullAddress(property) {
  return [
    property.address,
    [property.city, property.state].filter(Boolean).join(', '),
    property.zipCode,
  ]
    .filter(Boolean)
    .join(', ')
}

function PropertyFormModal({
  property,
  form,
  setForm,
  agents,
  saving,
  onClose,
  onSubmit,
  onAddImages,
  onRemoveImage,
  addingImages,
}) {
  const editing = Boolean(property)
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))

  return (
    <div
      className="clients-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        className="clients-modal clients-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-modal-title"
      >
        <header className="clients-modal-header">
          <div>
            <span className="clients-eyebrow">PROPERTY RECORD</span>
            <h2 id="property-modal-title">
              {editing ? 'Edit property' : 'Add a property'}
            </h2>
            <p>Keep listing details organized in your workspace.</p>
          </div>
          <button
            className="clients-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close form"
            disabled={saving || addingImages}
          >
            <X size={19} />
          </button>
        </header>

        <form className="clients-form" onSubmit={onSubmit}>
          <div className="clients-form-grid">
            <label className="clients-form-full">
              Listing title <span>*</span>
              <input
                autoFocus
                required
                maxLength={120}
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="e.g. Modern waterfront condo"
              />
            </label>

            <label>
              Property type <span>*</span>
              <select
                value={form.propertyType}
                onChange={(event) => update('propertyType', event.target.value)}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Listing status <span>*</span>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
              >
                {PROPERTY_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              {form.status === 'For Rent' ? 'Monthly rent' : 'Price'} <span>*</span>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={form.price}
                onChange={(event) => update('price', event.target.value)}
                placeholder="e.g. 650000"
              />
            </label>

            <label>
              Bedrooms
              <input
                type="number"
                min="0"
                step="1"
                value={form.bedrooms}
                onChange={(event) => update('bedrooms', event.target.value)}
              />
            </label>

            <label>
              Bathrooms
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.bathrooms}
                onChange={(event) => update('bathrooms', event.target.value)}
              />
            </label>

            <label>
              Square feet
              <input
                type="number"
                min="0"
                step="1"
                value={form.squareFeet}
                onChange={(event) => update('squareFeet', event.target.value)}
                placeholder="e.g. 1800"
              />
            </label>

            <label className="clients-form-full">
              Street address
              <input
                maxLength={180}
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
                placeholder="Street address"
              />
            </label>

            <label>
              City
              <input
                maxLength={100}
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
                placeholder="City"
              />
            </label>

            <label>
              State
              <input
                maxLength={60}
                value={form.state}
                onChange={(event) => update('state', event.target.value)}
                placeholder="State"
              />
            </label>

            <label>
              ZIP code
              <input
                maxLength={15}
                value={form.zipCode}
                onChange={(event) => update('zipCode', event.target.value)}
                placeholder="ZIP code"
              />
            </label>

            <label>
              Assigned agent
              <select
                value={form.assignedTo}
                onChange={(event) => update('assignedTo', event.target.value)}
              >
                {agents.map((agent) => (
                  <option key={agent}>{agent}</option>
                ))}
              </select>
            </label>

            <label className="clients-form-full">
              Description
              <textarea
                rows={3}
                maxLength={2000}
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Add a short description of the property…"
              />
            </label>

            <label className="clients-form-full property-image-upload">
              Property photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={addingImages || (form.images || []).length >= MAX_PROPERTY_IMAGES}
                onChange={(event) => {
                  onAddImages(event.target.files)
                  event.target.value = ''
                }}
                aria-describedby="property-image-help"
              />
              <small id="property-image-help">
                Add up to {MAX_PROPERTY_IMAGES} JPG, PNG, or WebP images. Each image must be 5 MB or smaller.
              </small>
            </label>
            {(form.images || []).length > 0 && (
              <div className="property-image-editor clients-form-full">
                {form.images.map((image) => (
                  <figure className="property-image-preview" key={image.id}>
                    <img src={image.dataUrl} alt={image.name} />
                    <figcaption title={image.name}>{image.name}</figcaption>
                    <button
                      type="button"
                      className="clients-row-action clients-row-delete"
                      onClick={() => onRemoveImage(image.id)}
                      aria-label={`Remove ${image.name}`}
                    >
                      <X size={14} />
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </div>

          <div className="clients-form-actions">
            <button
              className="clients-secondary-button"
              type="button"
              onClick={onClose}
              disabled={saving || addingImages}
            >
              Cancel
            </button>
            <button
              className="clients-primary-button"
              type="submit"
              disabled={saving || addingImages}
            >
              {addingImages ? 'Adding photos…' : saving ? 'Saving…' : editing ? 'Save changes' : 'Add property'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function PropertyDetail({ property, onBack, onEdit, onDelete, isAgent }) {
  const images = Array.isArray(property.images) ? property.images : []
  const [expandedImage, setExpandedImage] = useState(null)

  useEffect(() => {
    if (!expandedImage) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setExpandedImage(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedImage])

  return (
    <>
    <section className="clients-page clients-detail-page">
      <button className="clients-back-link" type="button" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to properties
      </button>

      <header className="clients-detail-hero">
        <div className="clients-detail-identity">
          <div className="clients-avatar clients-avatar-large">
            <Home size={24} />
          </div>
          <div className="clients-detail-title">
            <span className="clients-eyebrow">PROPERTY LISTING</span>
            <h1>{property.title}</h1>
            <div className="clients-detail-meta">
              <span className="clients-type-pill">{property.status}</span>
              <span>{property.propertyType}</span>
              <span>Added {formatDate(property.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="clients-detail-actions">
          <button
            className="clients-secondary-button"
            type="button"
            onClick={() => onEdit(property)}
          >
            <Edit3 size={15} />
            Edit property
          </button>
          {!isAgent && (
            <button
              className="clients-danger-button"
              type="button"
              onClick={() => onDelete(property)}
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}
        </div>
      </header>

      <div className="clients-detail-grid">
        <div className="clients-detail-main">
          <section className="clients-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Property photos</h2>
                <p>{images.length ? `${images.length} listing ${images.length === 1 ? 'photo' : 'photos'}` : 'No listing photos yet.'}</p>
              </div>
              <ImagePlus size={19} />
            </div>
            {images.length ? (
              <div className="property-image-gallery">
                {images.map((image) => (
                  <button
                    key={image.id}
                    className="property-image-gallery-button"
                    type="button"
                    onClick={() => setExpandedImage(image)}
                    aria-label={`View full-size ${image.name || property.title} photo`}
                  >
                    <img
                      src={image.dataUrl}
                      alt={image.name || property.title}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="clients-empty-inline">
                <ImagePlus size={22} />
                <p>No property photos added.</p>
                <span>Edit the listing to upload photos.</span>
              </div>
            )}
          </section>

          <section className="clients-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Property overview</h2>
                <p>Listing details and key features.</p>
              </div>
              <Building2 size={19} />
            </div>
            <div className="clients-preference-grid">
              <div>
                <span>Price</span>
                <strong>{formatPrice(property.price, property.status)}</strong>
              </div>
              <div>
                <span>Property type</span>
                <strong>{property.propertyType}</strong>
              </div>
              <div>
                <span>Bedrooms</span>
                <strong>{property.bedrooms || 0}</strong>
              </div>
              <div>
                <span>Bathrooms</span>
                <strong>{property.bathrooms || 0}</strong>
              </div>
              <div>
                <span>Square feet</span>
                <strong>{property.squareFeet || 'Not specified'}</strong>
              </div>
              <div>
                <span>Listing status</span>
                <strong>{property.status}</strong>
              </div>
            </div>
          </section>

          <section className="clients-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Location</h2>
                <p>Property address and market.</p>
              </div>
              <MapPin size={19} />
            </div>
            <div className="clients-contact-grid">
              <div className="clients-contact-item">
                <MapPin size={17} />
                <div>
                  <span>Full address</span>
                  <strong>{fullAddress(property) || 'Not provided'}</strong>
                </div>
              </div>
              <div className="clients-contact-item">
                <UserRound size={17} />
                <div>
                  <span>Assigned agent</span>
                  <strong>{property.assignedTo || 'Unassigned'}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="clients-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Description</h2>
                <p>Additional information about this listing.</p>
              </div>
              <Home size={19} />
            </div>
            {property.description ? (
              <div className="clients-preference-grid">
                <div>
                  <strong>{property.description}</strong>
                </div>
              </div>
            ) : (
              <div className="clients-empty-inline">
                <p>No description added.</p>
                <span>Edit the listing to add more details.</span>
              </div>
            )}
          </section>
        </div>

        <aside className="clients-detail-side">
          <section className="clients-panel clients-summary-panel">
            <h2>Listing summary</h2>
            <div>
              <span>Price</span>
              <strong>{formatPrice(property.price, property.status)}</strong>
            </div>
            <div>
              <span>Added</span>
              <strong>{formatDate(property.createdAt)}</strong>
            </div>
            {property.updatedAt && (
              <div>
                <span>Last updated</span>
                <strong>{formatDate(property.updatedAt)}</strong>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
    {expandedImage && createPortal(
      <div
        className="property-image-lightbox"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setExpandedImage(null)
        }}
      >
        <section
          className="property-image-lightbox-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={`Full-size ${expandedImage.name || property.title} photo`}
        >
          <button
            className="property-image-lightbox-close"
            type="button"
            onClick={() => setExpandedImage(null)}
            aria-label="Close full-size photo"
          >
            <X size={20} />
          </button>
          <img
            src={expandedImage.dataUrl}
            alt={expandedImage.name || property.title}
          />
          {expandedImage.name && <p>{expandedImage.name}</p>}
        </section>
      </div>,
      document.body,
    )}
    </>
  )
}

export default function PropertiesPage() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAgent = user?.role === 'Agent'
  const agents = user?.name && !PROPERTY_AGENTS.includes(user.name)
    ? [...PROPERTY_AGENTS, user.name]
    : PROPERTY_AGENTS

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [sortOrder, setSortOrder] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingImages, setAddingImages] = useState(false)

  async function loadProperties() {
    setLoadError('')
    try {
      setProperties(await propertyService.getAll())
    } catch (error) {
      setLoadError(error.message || 'Unable to load properties.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    propertyService.getAll()
      .then((data) => {
        if (!cancelled) setProperties(data)
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message || 'Unable to load properties.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const scopedProperties = useMemo(
    () =>
      properties.filter(
        (property) => !isAgent || property.assignedTo === user?.name,
      ),
    [properties, isAgent, user?.name],
  )

  const visibleProperties = useMemo(() => {
    const query = search.trim().toLowerCase()

    return scopedProperties
      .filter((property) => {
        const matchesSearch =
          !query ||
          [
            property.title,
            property.address,
            property.city,
            property.state,
            property.zipCode,
            property.assignedTo,
          ].some((value) => String(value || '').toLowerCase().includes(query))
        const matchesType =
          typeFilter === 'All types' || property.propertyType === typeFilter
        const matchesStatus =
          statusFilter === 'All statuses' || property.status === statusFilter

        return matchesSearch && matchesType && matchesStatus
      })
      .sort((a, b) =>
        sortOrder === 'oldest'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : sortOrder === 'price-low'
            ? Number(a.price) - Number(b.price)
            : sortOrder === 'price-high'
              ? Number(b.price) - Number(a.price)
              : sortOrder === 'name'
                ? a.title.localeCompare(b.title)
                : new Date(b.createdAt) - new Date(a.createdAt),
      )
  }, [scopedProperties, search, typeFilter, statusFilter, sortOrder])

  const pageCount = Math.max(1, Math.ceil(visibleProperties.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginatedProperties = visibleProperties.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )
  const selectedProperty =
    properties.find((property) => property.id === propertyId) || null

  const stats = useMemo(
    () => [
      {
        label: 'Total properties',
        value: scopedProperties.length,
        detail: 'Property records',
        icon: Home,
        tone: 'blue',
      },
      {
        label: 'Available',
        value: scopedProperties.filter((property) => property.status === 'Available').length,
        detail: 'Ready to show',
        icon: Building2,
        tone: 'green',
      },
      {
        label: 'Under contract',
        value: scopedProperties.filter((property) => property.status === 'Under Contract').length,
        detail: 'In progress',
        icon: CalendarDays,
        tone: 'purple',
      },
      {
        label: 'For rent',
        value: scopedProperties.filter((property) => property.status === 'For Rent').length,
        detail: 'Rental listings',
        icon: MapPin,
        tone: 'orange',
      },
    ],
    [scopedProperties],
  )

  function openCreate() {
    setEditingProperty(null)
    setForm({
      ...emptyForm,
      assignedTo: isAgent ? user?.name || PROPERTY_AGENTS[0] : agents[0],
    })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(property) {
    setEditingProperty(property)
    setForm({
      ...emptyForm,
      ...property,
      images: Array.isArray(property.images) ? property.images : [],
      price: String(property.price ?? ''),
      bedrooms: String(property.bedrooms ?? 0),
      bathrooms: String(property.bathrooms ?? 0),
      squareFeet: String(property.squareFeet ?? ''),
    })
    setFormError('')
    setModalOpen(true)
  }

  async function addImages(files) {
    const selectedFiles = Array.from(files || [])
    if (!selectedFiles.length) return

    const existingCount = (form.images || []).length
    if (existingCount + selectedFiles.length > MAX_PROPERTY_IMAGES) {
      toast.error(`A property can have up to ${MAX_PROPERTY_IMAGES} photos.`)
      return
    }

    const invalidType = selectedFiles.find(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type),
    )
    if (invalidType) {
      toast.error(`${invalidType.name} is not a supported image. Use JPG, PNG, or WebP.`)
      return
    }

    const oversized = selectedFiles.find((file) => file.size > MAX_IMAGE_SIZE)
    if (oversized) {
      toast.error(`${oversized.name} is larger than 5 MB.`)
      return
    }

    setAddingImages(true)
    try {
      const newImages = await Promise.all(selectedFiles.map(readImageFile))
      setForm((current) => ({
        ...current,
        images: [...(current.images || []), ...newImages],
      }))
    } catch (error) {
      toast.error(error.message || 'Unable to read the selected image.')
    } finally {
      setAddingImages(false)
    }
  }

  function removeImage(id) {
    setForm((current) => ({
      ...current,
      images: (current.images || []).filter((image) => image.id !== id),
    }))
  }

  async function submitProperty(event) {
    event.preventDefault()
    setFormError('')

    if (!form.title.trim()) {
      setFormError('A listing title is required.')
      return
    }

    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      setFormError('Price must be a valid non-negative number.')
      return
    }

    setSaving(true)

    const values = {
      ...form,
      title: form.title.trim(),
      price: Number(form.price),
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      squareFeet: Number(form.squareFeet) || 0,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zipCode.trim(),
      assignedTo: isAgent ? user?.name || '' : form.assignedTo,
      description: form.description.trim(),
      images: form.images || [],
    }

    try {
      const saved = editingProperty
        ? await propertyService.update(editingProperty.id, values)
        : await propertyService.create(values)
      await loadProperties()
      setModalOpen(false)
      setEditingProperty(null)
      toast.success(editingProperty ? 'Property updated.' : 'Property added.')
      if (propertyId) navigate(`/properties/${saved.id}`)
    } catch (error) {
      setFormError(error.message || 'Unable to save this property.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProperty(property) {
    if (
      !window.confirm(
        `Delete "${property.title}"? This action cannot be undone.`,
      )
    ) {
      return
    }

    try {
      await propertyService.remove(property.id)
      await loadProperties()
      toast.success('Property deleted.')
      if (propertyId === property.id) navigate('/properties')
    } catch (error) {
      toast.error(error.message || 'Unable to delete this property.')
    }
  }

  function resetFilters() {
    setSearch('')
    setTypeFilter('All types')
    setStatusFilter('All statuses')
    setSortOrder('newest')
    setPage(1)
  }

  if (propertyId) {
    if (loading) {
      return (
        <section className="clients-page">
          <div className="clients-state-card" role="status">
            Loading property…
          </div>
        </section>
      )
    }

    if (loadError || !selectedProperty || (isAgent && selectedProperty.assignedTo !== user?.name)) {
      return (
        <section className="clients-page">
          <div className="clients-state-card">
            <h2>{loadError ? 'Unable to load property' : 'Property not found'}</h2>
            <p>{loadError || 'This property may have been removed or you may not have access to it.'}</p>
            <button
              className="clients-primary-button"
              type="button"
              onClick={() => (loadError ? loadProperties() : navigate('/properties'))}
            >
              {loadError ? 'Try again' : 'Back to properties'}
            </button>
          </div>
          {modalOpen && (
            <PropertyFormModal
              property={editingProperty}
              form={form}
              setForm={setForm}
              agents={isAgent ? [user?.name].filter(Boolean) : agents}
              saving={saving}
              onClose={() => setModalOpen(false)}
              onSubmit={submitProperty}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              addingImages={addingImages}
            />
          )}
        </section>
      )
    }

    return (
      <>
        <PropertyDetail
          property={selectedProperty}
          onBack={() => navigate('/properties')}
          onEdit={openEdit}
          onDelete={deleteProperty}
          isAgent={isAgent}
        />
        {modalOpen && (
          <PropertyFormModal
            property={editingProperty}
            form={form}
            setForm={setForm}
            agents={isAgent ? [user?.name].filter(Boolean) : agents}
            saving={saving}
            onClose={() => setModalOpen(false)}
            onSubmit={submitProperty}
            onAddImages={addImages}
            onRemoveImage={removeImage}
            addingImages={addingImages}
          />
        )}
        {modalOpen && formError && (
          <div className="clients-form-error-global" role="alert">
            {formError}
          </div>
        )}
      </>
    )
  }

  return (
    <section className="clients-page">
      <header className="clients-page-header">
        <div>
          <span className="clients-eyebrow">CRM WORKSPACE</span>
          <b><h1>Properties</h1></b>
          <p>Manage listings, pricing, availability, and assigned agents.</p>
        </div>
        <button
          className="clients-primary-button"
          type="button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Add property
        </button>
      </header>

      <div className="clients-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <article className="clients-stat-card" key={stat.label}>
              <div className={`clients-stat-icon tone-${stat.tone}`}>
                <Icon size={19} />
              </div>
              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            </article>
          )
        })}
      </div>

      <section className="clients-list-card">
        <div className="clients-list-heading">
          <div>
            <h2>All properties</h2>
            <p>Browse and manage your property listings.</p>
          </div>
          <span className="clients-result-count">
            {visibleProperties.length}{' '}
            {visibleProperties.length === 1 ? 'property' : 'properties'}
          </span>
        </div>

        <div className="clients-toolbar">
          <label className="clients-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search title, address, city…"
              aria-label="Search properties"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>

          <label className="clients-filter">
            <Filter size={15} />
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by property type"
            >
              <option>All types</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>

          <label className="clients-filter">
            <Filter size={15} />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by property status"
            >
              <option>All statuses</option>
              {PROPERTY_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>

          <label className="clients-filter clients-sort">
            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value)
                setPage(1)
              }}
              aria-label="Sort properties"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
            </select>
            <ChevronDown size={14} />
          </label>

          {(search ||
            typeFilter !== 'All types' ||
            statusFilter !== 'All statuses' ||
            sortOrder !== 'newest') && (
            <button
              className="clients-reset-button"
              type="button"
              onClick={resetFilters}
            >
              Reset
            </button>
          )}
        </div>

        {loading ? (
          <div className="clients-state-card" role="status">
            <span className="clients-spinner" />
            Loading properties…
          </div>
        ) : loadError ? (
          <div className="clients-state-card">
            <h2>Couldn’t load properties</h2>
            <p>{loadError}</p>
            <button
              className="clients-primary-button"
              type="button"
              onClick={loadProperties}
            >
              Try again
            </button>
          </div>
        ) : paginatedProperties.length === 0 ? (
          <div className="clients-empty-state">
            <div className="clients-empty-icon">
              <Home size={24} />
            </div>
            <h3>
              {scopedProperties.length === 0
                ? 'No properties yet'
                : 'No matching properties'}
            </h3>
            <p>
              {scopedProperties.length === 0
                ? 'Add a property listing to get started.'
                : 'Try a different search or clear your filters.'}
            </p>
            {scopedProperties.length === 0 ? (
              <button className="clients-primary-button" onClick={openCreate}>
                <Plus size={16} />
                Add your first property
              </button>
            ) : (
              <button
                className="clients-secondary-button"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Details</th>
                    <th>Agent</th>
                    <th>Added</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedProperties.map((property) => (
                    <tr key={property.id}>
                      <td>
                        <button
                          className="clients-name-cell"
                          type="button"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <span className="clients-avatar">
                            {property.images?.[0]?.dataUrl ? (
                              <img
                                className="property-table-thumbnail"
                                src={property.images[0].dataUrl}
                                alt=""
                              />
                            ) : (
                              <Home size={15} />
                            )}
                          </span>
                          <span>
                            <strong>{property.title}</strong>
                            <small>{fullAddress(property) || 'Address not specified'}</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="clients-type-pill">{property.status}</span>
                      </td>
                      <td>{property.propertyType}</td>
                      <td>
                        <strong className="clients-budget">
                          {formatPrice(property.price, property.status)}
                        </strong>
                      </td>
                      <td>
                        <span className="clients-contact-cell">
                          <span>{property.bedrooms || 0} bd · {property.bathrooms || 0} ba</span>
                          <small>{property.squareFeet ? `${property.squareFeet} sq ft` : 'Size not specified'}</small>
                        </span>
                      </td>
                      <td>
                        <span className="clients-agent-cell">
                          <span className="clients-agent-avatar">
                            {initials(property.assignedTo || '?')}
                          </span>
                          {property.assignedTo || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span className="clients-date-cell">
                          {formatDate(property.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div className="clients-row-actions">
                          <button
                            type="button"
                            className="clients-row-action"
                            aria-label={`View ${property.title}`}
                            title="View property"
                            onClick={() => navigate(`/properties/${property.id}`)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="clients-row-action"
                            aria-label={`Edit ${property.title}`}
                            title="Edit property"
                            onClick={() => openEdit(property)}
                          >
                            <Edit3 size={15} />
                          </button>
                          {!isAgent && (
                            <button
                              type="button"
                              className="clients-row-action clients-row-delete"
                              aria-label={`Delete ${property.title}`}
                              title="Delete property"
                              onClick={() => deleteProperty(property)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="clients-pagination">
              <span>
                Showing{' '}
                <strong>
                  {(safePage - 1) * pageSize + 1}–
                  {Math.min(safePage * pageSize, visibleProperties.length)}
                </strong>{' '}
                of <strong>{visibleProperties.length}</strong> properties
              </span>
              <div className="clients-pagination-controls">
                <label>
                  Rows{' '}
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    aria-label="Rows per page"
                  >
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                  </select>
                </label>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <ArrowLeft size={15} />
                </button>
                <span>
                  Page {safePage} of {pageCount}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {modalOpen && (
        <>
          <PropertyFormModal
            property={editingProperty}
            form={form}
            setForm={setForm}
            agents={isAgent ? [user?.name].filter(Boolean) : agents}
            saving={saving}
            onClose={() => {
              setModalOpen(false)
              setFormError('')
            }}
            onSubmit={submitProperty}
            onAddImages={addImages}
            onRemoveImage={removeImage}
            addingImages={addingImages}
          />
          {formError && (
            <div className="clients-form-error-global" role="alert">
              {formError}
            </div>
          )}
        </>
      )}
    </section>
  )
}
