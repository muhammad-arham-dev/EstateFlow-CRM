import { dispatchDataChanged } from '../../utils/appEvents'

const STORAGE_KEYS = {
  deals: 'estateflow_deals_v1',
  tasks: 'estateflow_tasks_v1',
  appointments: 'estateflow_appointments_v1',
}

export const PIPELINE_STAGES = [
  'New',
  'Contacted',
  'Qualified',
  'Unqualified',
  'Appointment Scheduled',
  'Property Viewing',
  'Negotiation',
  'Converted',
  'Lost',
]

export const DEAL_STAGES = [
  'Prospecting',
  'Offer',
  'Under Contract',
  'Closed Won',
  'Closed Lost',
]

export const TASK_STATUSES = ['Open', 'In Progress', 'Completed']
export const TASK_PRIORITIES = ['Low', 'Medium', 'High']
export const TASK_TYPES = ['Call', 'Email', 'Follow-up', 'Document', 'Other']
export const APPOINTMENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled']
export const APPOINTMENT_TYPES = [
  'Client meeting',
  'Property viewing',
  'Consultation',
  'Inspection',
  'Other',
]

const initialDeals = [
  {
    id: 'deal-3001',
    title: 'Bennett condo purchase',
    contactName: 'Olivia Bennett',
    leadId: 'lead-1001',
    propertyName: 'Downtown condo',
    amount: 650000,
    stage: 'Offer',
    closeDate: '2026-11-20',
    assignedTo: 'Sarah Johnson',
    notes: [],
    activities: [{ id: 'deal-activity-3001', type: 'created', text: 'Deal added to the sales pipeline.', createdAt: '2026-10-20T14:00:00.000Z' }],
    createdAt: '2026-10-20T14:00:00.000Z',
  },
  {
    id: 'deal-3002',
    title: 'Wilson investment property',
    contactName: 'Ethan Wilson',
    leadId: 'lead-1006',
    propertyName: 'Boston condo',
    amount: 925000,
    stage: 'Under Contract',
    closeDate: '2026-11-08',
    assignedTo: 'Alex Morgan',
    notes: [],
    activities: [{ id: 'deal-activity-3002', type: 'created', text: 'Deal added to the sales pipeline.', createdAt: '2026-10-18T11:30:00.000Z' }],
    createdAt: '2026-10-18T11:30:00.000Z',
  },
  {
    id: 'deal-3003',
    title: 'Martinez home search',
    contactName: 'Sophia Martinez',
    leadId: 'lead-1005',
    propertyName: 'Seattle family home',
    amount: 720000,
    stage: 'Prospecting',
    closeDate: '2026-12-05',
    assignedTo: 'Sarah Johnson',
    notes: [],
    activities: [{ id: 'deal-activity-3003', type: 'created', text: 'Deal added to the sales pipeline.', createdAt: '2026-10-16T09:15:00.000Z' }],
    createdAt: '2026-10-16T09:15:00.000Z',
  },
]

const initialTasks = [
  {
    id: 'task-4001',
    title: 'Call Noah about Brooklyn listings',
    contactName: 'Noah Williams',
    leadId: 'lead-1002',
    type: 'Call',
    priority: 'High',
    status: 'Open',
    dueDate: '2026-10-23',
    assignedTo: 'Alex Morgan',
    description: 'Share the latest two-bedroom listings and confirm his viewing availability.',
    notes: [],
    activities: [{ id: 'task-activity-4001', type: 'created', text: 'Follow-up task created.', createdAt: '2026-10-20T10:00:00.000Z' }],
    createdAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'task-4002',
    title: 'Send viewing details to Ava',
    contactName: 'Ava Thompson',
    leadId: 'lead-1003',
    type: 'Email',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2026-10-24',
    assignedTo: 'Emily Davis',
    description: 'Send address, parking details, and appointment confirmation.',
    notes: [],
    activities: [{ id: 'task-activity-4002', type: 'created', text: 'Follow-up task created.', createdAt: '2026-10-19T13:00:00.000Z' }],
    createdAt: '2026-10-19T13:00:00.000Z',
  },
  {
    id: 'task-4003',
    title: 'Prepare offer documents',
    contactName: 'Ethan Wilson',
    leadId: 'lead-1006',
    type: 'Document',
    priority: 'High',
    status: 'Open',
    dueDate: '2026-10-25',
    assignedTo: 'Alex Morgan',
    description: 'Collect signatures and prepare the offer packet.',
    notes: [],
    activities: [{ id: 'task-activity-4003', type: 'created', text: 'Follow-up task created.', createdAt: '2026-10-18T16:00:00.000Z' }],
    createdAt: '2026-10-18T16:00:00.000Z',
  },
]

const initialAppointments = [
  {
    id: 'appointment-5001',
    title: 'Townhouse property viewing',
    contactName: 'Ava Thompson',
    leadId: 'lead-1003',
    type: 'Property viewing',
    startsAt: '2026-10-24T15:00',
    location: 'South Austin, TX',
    status: 'Scheduled',
    assignedTo: 'Emily Davis',
    notes: [],
    activities: [{ id: 'appointment-activity-5001', type: 'created', text: 'Appointment scheduled.', createdAt: '2026-10-19T12:00:00.000Z' }],
    createdAt: '2026-10-19T12:00:00.000Z',
  },
  {
    id: 'appointment-5002',
    title: 'Buyer consultation',
    contactName: 'Olivia Bennett',
    leadId: 'lead-1001',
    type: 'Consultation',
    startsAt: '2026-10-25T10:30',
    location: 'Video call',
    status: 'Scheduled',
    assignedTo: 'Sarah Johnson',
    notes: [],
    activities: [{ id: 'appointment-activity-5002', type: 'created', text: 'Appointment scheduled.', createdAt: '2026-10-20T08:30:00.000Z' }],
    createdAt: '2026-10-20T08:30:00.000Z',
  },
]

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readRecords(key, seed) {
  let stored
  try {
    stored = localStorage.getItem(key)
  } catch {
    throw new Error('Unable to access saved workflow data in this browser.')
  }

  if (stored === null) {
    writeRecords(key, seed)
    return seed
  }

  try {
    const records = JSON.parse(stored)
    if (!Array.isArray(records)) throw new Error()
    return records
  } catch {
    throw new Error('Saved workflow data is invalid. Clear the demo data and try again.')
  }
}

function writeRecords(key, records) {
  try {
    localStorage.setItem(key, JSON.stringify(records))
    dispatchDataChanged()
  } catch {
    throw new Error('Unable to save workflow data. Check available browser storage.')
  }
}

function withActivity(record, type, text) {
  return {
    ...record,
    activities: [
      { id: makeId('activity'), type, text, createdAt: new Date().toISOString() },
      ...(record.activities || []),
    ],
    updatedAt: new Date().toISOString(),
  }
}

function createCollection(name, prefix, seed) {
  const key = STORAGE_KEYS[name]

  return {
    async getAll() {
      return readRecords(key, seed)
    },

    async create(values) {
      const records = await this.getAll()
      const timestamp = new Date().toISOString()
      const record = withActivity(
        {
          ...values,
          id: makeId(prefix),
          notes: [],
          activities: [],
          createdAt: timestamp,
        },
        'created',
        `${name === 'tasks' ? 'Follow-up task' : name.slice(0, -1)} created.`,
      )
      writeRecords(key, [record, ...records])
      return record
    },

    async update(id, values) {
      const records = await this.getAll()
      const existing = records.find((record) => record.id === id)
      if (!existing) throw new Error('Record not found.')

      const changes = Object.entries(values).filter(
        ([field, value]) => existing[field] !== value,
      )
      const updated = withActivity(
        { ...existing, ...values },
        'updated',
        changes.length ? `Updated ${changes.map(([field]) => field).join(', ')}.` : 'Record updated.',
      )
      writeRecords(key, records.map((record) => record.id === id ? updated : record))
      return updated
    },

    async remove(id) {
      const records = await this.getAll()
      const next = records.filter((record) => record.id !== id)
      if (next.length === records.length) throw new Error('Record not found.')
      writeRecords(key, next)
    },

    async addNote(id, text, author) {
      const records = await this.getAll()
      const existing = records.find((record) => record.id === id)
      if (!existing) throw new Error('Record not found.')
      const note = {
        id: makeId('note'),
        text: text.trim(),
        author,
        createdAt: new Date().toISOString(),
      }
      const updated = withActivity(
        { ...existing, notes: [note, ...(existing.notes || [])] },
        'note',
        `Note added by ${author}: ${text.trim()}`,
      )
      writeRecords(key, records.map((record) => record.id === id ? updated : record))
      return updated
    },
  }
}

export const dealService = createCollection('deals', 'deal', initialDeals)
export const taskService = createCollection('tasks', 'task', initialTasks)
export const appointmentService = createCollection('appointments', 'appointment', initialAppointments)
