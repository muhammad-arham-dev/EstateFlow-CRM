const CLIENTS_KEY = 'estateflow_clients_v1'

export const CLIENT_TYPES = [
  'Buyer',
  'Seller',
  'Investor',
  'Renter',
  'Landlord',
]

export const CLIENT_PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Townhouse',
  'Multi-Family',
  'Land',
  'Commercial',
  'Apartment',
  'Other',
]

export const CLIENT_AGENTS = [
  'Alex Morgan',
  'Sarah Johnson',
  'Daniel Carter',
  'Emily Davis',
]

const initialClients = [
  {
    id: 'client-2001',
    name: 'Grace Mitchell',
    email: 'grace.mitchell@example.com',
    phone: '+1 (415) 555-0142',
    address: 'San Francisco, CA',
    clientType: 'Buyer',
    budget: 780000,
    preferredLocation: 'San Francisco, CA',
    propertyType: 'Condo',
    bedrooms: 2,
    bathrooms: 2,
    assignedTo: 'Sarah Johnson',
    source: 'Referral',
    sourceLeadId: null,
    notes: [],
    createdAt: '2026-10-03T10:00:00.000Z',
    activities: [
      {
        id: 'client-activity-2001-1',
        type: 'created',
        text: 'Client record created.',
        createdAt: '2026-10-03T10:00:00.000Z',
      },
      {
        id: 'client-activity-2001-2',
        type: 'call',
        text: 'Discussed preferred neighborhoods and budget.',
        createdAt: '2026-10-05T14:30:00.000Z',
      },
    ],
  },
  {
    id: 'client-2002',
    name: 'Benjamin Foster',
    email: 'ben.foster@example.com',
    phone: '+1 (212) 555-0173',
    address: 'Brooklyn, NY',
    clientType: 'Seller',
    budget: 620000,
    preferredLocation: 'Brooklyn, NY',
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    assignedTo: 'Alex Morgan',
    source: 'Website',
    sourceLeadId: null,
    notes: [],
    createdAt: '2026-10-06T09:15:00.000Z',
    activities: [
      {
        id: 'client-activity-2002-1',
        type: 'created',
        text: 'Client record created.',
        createdAt: '2026-10-06T09:15:00.000Z',
      },
    ],
  },
  {
    id: 'client-2003',
    name: 'Chloe Richardson',
    email: 'chloe.richardson@example.com',
    phone: '+1 (512) 555-0198',
    address: 'Austin, TX',
    clientType: 'Investor',
    budget: 950000,
    preferredLocation: 'Austin, TX',
    propertyType: 'Multi-Family',
    bedrooms: 4,
    bathrooms: 3,
    assignedTo: 'Emily Davis',
    source: 'Zillow',
    sourceLeadId: null,
    notes: [],
    createdAt: '2026-10-08T12:00:00.000Z',
    activities: [
      {
        id: 'client-activity-2003-1',
        type: 'created',
        text: 'Client record created.',
        createdAt: '2026-10-08T12:00:00.000Z',
      },
      {
        id: 'client-activity-2003-2',
        type: 'meeting',
        text: 'Reviewed investment property criteria.',
        createdAt: '2026-10-11T16:00:00.000Z',
      },
    ],
  },
  {
    id: 'client-2004',
    name: 'Ethan Brooks',
    email: 'ethan.brooks@example.com',
    phone: '+1 (305) 555-0164',
    address: 'Miami, FL',
    clientType: 'Renter',
    budget: 3600,
    preferredLocation: 'Miami, FL',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    assignedTo: 'Daniel Carter',
    source: 'Referral',
    sourceLeadId: null,
    notes: [],
    createdAt: '2026-10-10T08:45:00.000Z',
    activities: [
      {
        id: 'client-activity-2004-1',
        type: 'created',
        text: 'Client record created.',
        createdAt: '2026-10-10T08:45:00.000Z',
      },
    ],
  },
]

function readStorage() {
  try {
    const stored = localStorage.getItem(CLIENTS_KEY)
    return stored === null ? null : JSON.parse(stored)
  } catch {
    return null
  }
}

function writeStorage(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients))
}

function makeId(prefix = 'client') {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function withActivity(client, type, text) {
  return {
    ...client,
    activities: [
      {
        id: makeId('activity'),
        type,
        text,
        createdAt: new Date().toISOString(),
      },
      ...(client.activities || []),
    ],
  }
}

export const clientService = {
  async getAll() {
    const stored = readStorage()

    if (stored === null) {
      writeStorage(initialClients)
      return initialClients
    }

    if (!Array.isArray(stored)) {
      throw new Error(
        'Client data is invalid. Please refresh or clear the demo data.',
      )
    }

    return stored
  },

  async getById(id) {
    const clients = await this.getAll()
    return clients.find((client) => client.id === id) || null
  },

  async create(values, author = 'EstateFlow user') {
    const clients = await this.getAll()
    const email = values.email.trim().toLowerCase()

    if (
      clients.some(
        (client) => client.email?.toLowerCase() === email,
      )
    ) {
      throw new Error(
        'A client with this email address already exists.',
      )
    }

    const timestamp = new Date().toISOString()

    const client = withActivity(
      {
        ...values,
        name: values.name.trim(),
        email,
        phone: values.phone.trim(),
        id: makeId(),
        sourceLeadId: null,
        notes: [],
        activities: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      'created',
      `Client record created by ${author}.`,
    )

    writeStorage([client, ...clients])
    return client
  },

  async update(id, values, author = 'EstateFlow user') {
    const clients = await this.getAll()
    const existing = clients.find(
      (client) => client.id === id,
    )

    if (!existing) {
      throw new Error('Client not found.')
    }

    const email = values.email.trim().toLowerCase()

    if (
      clients.some(
        (client) =>
          client.id !== id &&
          client.email?.toLowerCase() === email,
      )
    ) {
      throw new Error(
        'Another client already uses this email address.',
      )
    }

    const updated = withActivity(
      {
        ...existing,
        ...values,
        name: values.name.trim(),
        email,
        phone: values.phone.trim(),
        updatedAt: new Date().toISOString(),
      },
      'updated',
      `Client details updated by ${author}.`,
    )

    writeStorage(
      clients.map((client) =>
        client.id === id ? updated : client,
      ),
    )

    return updated
  },

  async remove(id) {
    const clients = await this.getAll()
    const existing = clients.find(
      (client) => client.id === id,
    )

    if (!existing) {
      throw new Error('Client not found.')
    }

    writeStorage(
      clients.filter((client) => client.id !== id),
    )

    return existing
  },

  async addNote(
    id,
    text,
    author = 'EstateFlow user',
  ) {
    const clients = await this.getAll()
    const existing = clients.find(
      (client) => client.id === id,
    )

    if (!existing) {
      throw new Error('Client not found.')
    }

    const timestamp = new Date().toISOString()

    const note = {
      id: makeId('note'),
      text: text.trim(),
      author,
      createdAt: timestamp,
    }

    const updated = withActivity(
      {
        ...existing,
        notes: [note, ...(existing.notes || [])],
        updatedAt: timestamp,
      },
      'note',
      `Note added by ${author}: ${text.trim()}`,
    )

    writeStorage(
      clients.map((client) =>
        client.id === id ? updated : client,
      ),
    )

    return updated
  },

  async addActivity(
    id,
    type,
    text,
    author = 'EstateFlow user',
  ) {
    const clients = await this.getAll()
    const existing = clients.find(
      (client) => client.id === id,
    )

    if (!existing) {
      throw new Error('Client not found.')
    }

    const updated = withActivity(
      existing,
      type,
      `${text} (${author})`,
    )

    writeStorage(
      clients.map((client) =>
        client.id === id ? updated : client,
      ),
    )

    return updated
  },

  async replaceFromConversion(client) {
    const clients = await this.getAll()

    const existing = clients.find(
      (item) =>
        item.sourceLeadId &&
        item.sourceLeadId === client.sourceLeadId,
    )

    if (existing) return existing

    writeStorage([client, ...clients])
    return client
  },
}
