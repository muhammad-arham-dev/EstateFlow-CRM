import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { clientService } from '../src/features/clients/clientService.js'
import { leadService } from '../src/features/leads/leadService.js'
import { propertyService } from '../src/features/properties/propertyService.js'
import { appointmentService, dealService, taskService } from '../src/features/workflow/workflowService.js'

const storage = new Map()
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null
  },
  setItem(key, value) {
    storage.set(key, value)
  },
}
globalThis.window = { dispatchEvent() {} }

after(() => {
  delete globalThis.localStorage
  delete globalThis.window
})

describe('CRM record services', () => {
  const cases = [
    {
      name: 'leads',
      service: leadService,
      values: { name: 'QA Lead', email: 'qa-lead@example.com', phone: '555-0101', status: 'New' },
      update: { status: 'Contacted' },
      updatedValue: 'Contacted',
      field: 'status',
    },
    {
      name: 'clients',
      service: clientService,
      values: { name: 'QA Client', email: 'qa-client@example.com', phone: '555-0102', clientType: 'Buyer' },
      update: { name: 'QA Client', email: 'qa-client@example.com', phone: '555-0103' },
      updatedValue: '555-0103',
      field: 'phone',
    },
    {
      name: 'properties',
      service: propertyService,
      values: { title: 'QA Listing', address: '1 Test Street', status: 'Available' },
      update: { status: 'Under Contract' },
      updatedValue: 'Under Contract',
      field: 'status',
    },
    {
      name: 'deals',
      service: dealService,
      values: { title: 'QA Deal', amount: 100000, stage: 'Offer' },
      update: { stage: 'Under Contract' },
      updatedValue: 'Under Contract',
      field: 'stage',
    },
    {
      name: 'tasks',
      service: taskService,
      values: { title: 'QA Task', status: 'Open' },
      update: { status: 'Completed' },
      updatedValue: 'Completed',
      field: 'status',
    },
    {
      name: 'appointments',
      service: appointmentService,
      values: { title: 'QA Appointment', startsAt: '2026-11-01T10:00', status: 'Scheduled' },
      update: { status: 'Completed' },
      updatedValue: 'Completed',
      field: 'status',
    },
  ]

  for (const testCase of cases) {
    it(`supports create, update, and delete for ${testCase.name}`, async () => {
      const created = await testCase.service.create(testCase.values)
      assert.ok(created.id)
      assert.equal(created[testCase.field], testCase.values[testCase.field])

      const updated = await testCase.service.update(created.id, testCase.update)
      assert.equal(updated[testCase.field], testCase.updatedValue)

      await testCase.service.remove(created.id)
      assert.equal(
        (await testCase.service.getAll()).some((record) => record.id === created.id),
        false,
      )
    })
  }
})
