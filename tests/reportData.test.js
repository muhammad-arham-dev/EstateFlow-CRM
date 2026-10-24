import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getDealPipeline, getLeadSources, getLeadTrend } from '../src/features/reports/reportData.js'

describe('dashboard and report calculations', () => {
  it('assigns unique, stable colors to all supported lead sources', () => {
    const sourceNames = [
      'Website',
      'Zillow',
      'Realtor.com',
      'Facebook',
      'Instagram',
      'Google Ads',
      'Referral',
      'Phone',
      'Email',
      'Walk-in',
      'Other',
    ]
    const leads = sourceNames.map((source) => ({ source }))
    const sources = getLeadSources(leads)

    assert.equal(sources.length, sourceNames.length)
    assert.equal(new Set(sources.map(({ color }) => color)).size, sourceNames.length)
    assert.deepEqual(
      getLeadSources(leads).map(({ name, color }) => [name, color]),
      sources.map(({ name, color }) => [name, color]),
    )
  })

  it('sorts lead sources by volume and breaks ties alphabetically', () => {
    const sources = getLeadSources([
      { source: 'Zillow' },
      { source: 'Referral' },
      { source: 'Website' },
      { source: 'Website' },
    ])

    assert.deepEqual(sources.map(({ name }) => name), ['Website', 'Referral', 'Zillow'])
  })

  it('calculates pipeline stage counts, values, and stage colors', () => {
    const pipeline = getDealPipeline([
      { stage: 'Offer', amount: 100000 },
      { stage: 'Offer', amount: '250000' },
      { stage: 'Closed Won', amount: 500000 },
    ])

    assert.deepEqual(pipeline.find(({ stage }) => stage === 'Offer'), {
      stage: 'Offer',
      count: 2,
      amount: 350000,
      color: '#E9AE67',
    })
    assert.equal(pipeline.find(({ stage }) => stage === 'Closed Won').count, 1)
    assert.ok(pipeline.every(({ color }) => color))
  })

  it('counts conversions in the month they occurred', () => {
    const trend = getLeadTrend([
      {
        status: 'Converted',
        createdAt: '2026-09-10T10:00:00.000Z',
        activities: [{
          type: 'status',
          text: 'Status changed to Converted',
          createdAt: '2026-10-02T10:00:00.000Z',
        }],
      },
    ], 2, new Date('2026-10-24T12:00:00.000Z'))

    assert.equal(trend[0].leads, 1)
    assert.equal(trend[0].converted, 0)
    assert.equal(trend[1].leads, 0)
    assert.equal(trend[1].converted, 1)
  })
})
