import { AGENTS } from '../leads/leadService.js'
import { dispatchDataChanged } from '../../utils/appEvents.js'

const AGENTS_KEY = 'estateflow_agents_v1'

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
}

const initialAgents = AGENTS.map((name, index) => ({
  id: `agent-${index + 1}`,
  name,
  email: `${slugify(name)}@estateflow.local`,
  phone: '',
  status: 'Active',
}))

function readAgents() {
  let stored
  try {
    stored = localStorage.getItem(AGENTS_KEY)
  } catch {
    throw new Error('Unable to access the local agent directory.')
  }

  if (stored === null) {
    try {
      localStorage.setItem(AGENTS_KEY, JSON.stringify(initialAgents))
    } catch {
      throw new Error('Unable to initialize the local agent directory.')
    }
    return initialAgents
  }

  try {
    const agents = JSON.parse(stored)
    if (!Array.isArray(agents) || agents.some((agent) => (
      !agent ||
      typeof agent.id !== 'string' ||
      typeof agent.name !== 'string' ||
      typeof agent.email !== 'string' ||
      !['Active', 'Inactive'].includes(agent.status)
    ))) {
      throw new Error()
    }
    return agents
  } catch {
    throw new Error('Saved agent directory is invalid. Clear the local demo data and try again.')
  }
}

function writeAgents(agents) {
  try {
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))
    dispatchDataChanged()
  } catch {
    throw new Error('Unable to save the local agent directory.')
  }
}

function validateDetails(values, existingAgents, currentId) {
  const name = String(values.name || '').trim()
  const email = String(values.email || '').trim().toLowerCase()

  if (!name || !email) {
    throw new Error('Agent name and email are required.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.')
  }
  if (existingAgents.some((agent) => (
    agent.id !== currentId &&
    (agent.name.toLowerCase() === name.toLowerCase() || agent.email.toLowerCase() === email)
  ))) {
    throw new Error('An agent with this name or email already exists.')
  }

  return {
    name,
    email,
    phone: String(values.phone || '').trim(),
    address: String(values.address || '').trim(),
    country: String(values.country || '').trim(),
    city: String(values.city || '').trim(),
    dateOfBirth: String(values.dateOfBirth || '').trim(),
  }
}

function makeId() {
  return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const agentService = {
  async getAll() {
    return readAgents()
  },

  async create(values) {
    const agents = await this.getAll()
    const agent = {
      ...validateDetails(values, agents),
      id: makeId(),
      status: 'Active',
      createdAt: new Date().toISOString(),
    }
    writeAgents([agent, ...agents])
    return agent
  },

  async update(id, values) {
    const agents = await this.getAll()
    const existing = agents.find((agent) => agent.id === id)
    if (!existing) throw new Error('Agent not found.')
    const updated = {
      ...existing,
      ...validateDetails({ ...values, name: existing.name }, agents, id),
      updatedAt: new Date().toISOString(),
    }
    writeAgents(agents.map((agent) => agent.id === id ? updated : agent))
    return updated
  },

  async setStatus(id, status) {
    if (!['Active', 'Inactive'].includes(status)) {
      throw new Error('Choose a valid agent status.')
    }
    const agents = await this.getAll()
    const existing = agents.find((agent) => agent.id === id)
    if (!existing) throw new Error('Agent not found.')
    const updated = { ...existing, status, updatedAt: new Date().toISOString() }
    writeAgents(agents.map((agent) => agent.id === id ? updated : agent))
    return updated
  },
}
