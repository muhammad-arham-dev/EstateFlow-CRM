import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { agentService } from '../src/features/agents/agentService.js'

const values = new Map()
globalThis.localStorage = {
  getItem(key) {
    return values.has(key) ? values.get(key) : null
  },
  setItem(key, value) {
    values.set(key, value)
  },
}
globalThis.window = { dispatchEvent() {} }

after(() => {
  delete globalThis.localStorage
  delete globalThis.window
})

describe('local agent directory', () => {
  it('creates, updates, validates, and deactivates assigned-agent options', async () => {
    const initial = await agentService.getAll()
    assert.equal(initial.length, 4)

    const added = await agentService.create({
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      phone: '555-0100',
      address: '14 Oak Street',
      city: 'Austin',
      country: 'United States',
      dateOfBirth: '1990-04-12',
    })
    assert.equal(added.status, 'Active')

    await assert.rejects(
      agentService.create({ name: 'taylor reed', email: 'other@example.com' }),
      /already exists/,
    )

    const updated = await agentService.update(added.id, {
      name: 'Changed Name',
      email: 't.reed@example.com',
      phone: '555-0101',
      address: '20 Lake Avenue',
      city: 'Dallas',
      country: 'United States',
      dateOfBirth: '1991-05-13',
    })
    assert.equal(updated.name, 'Taylor Reed')
    assert.equal(updated.email, 't.reed@example.com')
    assert.equal(updated.phone, '555-0101')
    assert.equal(updated.address, '20 Lake Avenue')
    assert.equal(updated.city, 'Dallas')
    assert.equal(updated.country, 'United States')
    assert.equal(updated.dateOfBirth, '1991-05-13')

    const inactive = await agentService.setStatus(added.id, 'Inactive')
    assert.equal(inactive.status, 'Inactive')
    assert.equal((await agentService.getAll()).length, 5)

    await assert.rejects(agentService.setStatus(added.id, 'Unknown'), /valid agent status/)
  })
})
