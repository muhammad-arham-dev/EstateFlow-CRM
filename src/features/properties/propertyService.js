import { dispatchDataChanged } from '../../utils/appEvents.js'

const PROPERTIES_KEY = 'estateflow_properties_v1'

export const PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Townhouse',
  'Multi-Family',
  'Land',
  'Commercial',
  'Apartment',
  'Other',
]

export const PROPERTY_STATUSES = [
  'Available',
  'Under Contract',
  'Sold',
  'Off Market',
  'For Rent',
]

export const PROPERTY_AGENTS = [
  'Alex Morgan',
  'Sarah Johnson',
  'Daniel Carter',
  'Emily Davis',
]

const initialProperties = [
  {
    id: 'property-3001',
    title: 'Modern waterfront condo',
    propertyType: 'Condo',
    status: 'Available',
    price: 785000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1480,
    address: '120 Harbor View Drive',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    assignedTo: 'Sarah Johnson',
    description: 'Bright waterfront home with an open floor plan and private balcony.',
    images: [],
    createdAt: '2026-10-08T12:00:00.000Z',
  },
  {
    id: 'property-3002',
    title: 'Brooklyn brownstone',
    propertyType: 'Townhouse',
    status: 'Under Contract',
    price: 1125000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2360,
    address: '48 Bergen Street',
    city: 'Brooklyn',
    state: 'NY',
    zipCode: '11201',
    assignedTo: 'Alex Morgan',
    description: 'Classic brownstone with updated interiors and a private garden.',
    images: [],
    createdAt: '2026-10-11T09:30:00.000Z',
  },
  {
    id: 'property-3003',
    title: 'East Austin family home',
    propertyType: 'Single Family',
    status: 'Available',
    price: 549000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1920,
    address: '811 Willow Creek Lane',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    assignedTo: 'Emily Davis',
    description: 'Move-in-ready home near neighborhood parks and local shops.',
    images: [],
    createdAt: '2026-10-14T14:15:00.000Z',
  },
  {
    id: 'property-3004',
    title: 'Miami garden apartment',
    propertyType: 'Apartment',
    status: 'For Rent',
    price: 3200,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1160,
    address: '725 Palm Avenue',
    city: 'Miami',
    state: 'FL',
    zipCode: '33130',
    assignedTo: 'Daniel Carter',
    description: 'Furnished apartment with a private patio and secure parking.',
    images: [],
    createdAt: '2026-10-17T08:45:00.000Z',
  },
]

function readStorage() {
  let stored

  try {
    stored = localStorage.getItem(PROPERTIES_KEY)
  } catch {
    throw new Error('Unable to access saved property records.')
  }

  if (stored === null) return null

  try {
    return JSON.parse(stored)
  } catch {
    throw new Error('Property data is invalid. Please clear the demo data.')
  }
}

function writeStorage(properties) {
  try {
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties))
    dispatchDataChanged()
  } catch {
    throw new Error('Unable to save property records in this browser.')
  }
}

function makeId() {
  return `property-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const propertyService = {
  async getAll() {
    const stored = readStorage()

    if (stored === null) {
      writeStorage(initialProperties)
      return initialProperties
    }

    if (!Array.isArray(stored)) {
      throw new Error('Property data is invalid. Please clear the demo data.')
    }

    return stored
  },

  async getById(id) {
    const properties = await this.getAll()
    return properties.find((property) => property.id === id) || null
  },

  async create(values) {
    const properties = await this.getAll()
    const timestamp = new Date().toISOString()
    const property = {
      ...values,
      id: makeId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    writeStorage([property, ...properties])
    return property
  },

  async update(id, values) {
    const properties = await this.getAll()
    const existing = properties.find((property) => property.id === id)

    if (!existing) throw new Error('Property not found.')

    const updated = {
      ...existing,
      ...values,
      updatedAt: new Date().toISOString(),
    }

    writeStorage(
      properties.map((property) =>
        property.id === id ? updated : property,
      ),
    )
    return updated
  },

  async remove(id) {
    const properties = await this.getAll()
    const existing = properties.find((property) => property.id === id)

    if (!existing) throw new Error('Property not found.')

    writeStorage(properties.filter((property) => property.id !== id))
    return existing
  },
}
