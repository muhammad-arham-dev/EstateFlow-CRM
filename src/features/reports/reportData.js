import { format, startOfMonth, subMonths } from 'date-fns'

const leadSourceColors = [
  '#6687E8',
  '#65B7A5',
  '#A28AE8',
  '#E9AE67',
  '#7F8FA6',
  '#D97878',
  '#54A6C2',
  '#88B95F',
  '#CC7AA8',
  '#6C78C8',
  '#B28C63',
]

const dealStageColors = {
  Prospecting: '#6687E8',
  Offer: '#E9AE67',
  'Under Contract': '#A28AE8',
  'Closed Won': '#65B786',
  'Closed Lost': '#D97878',
}

export function getLeadTrend(leads, monthCount = 6, now = new Date()) {
  return Array.from({ length: monthCount }, (_, index) => {
    const month = startOfMonth(subMonths(now, monthCount - index - 1))
    const nextMonth = startOfMonth(subMonths(now, monthCount - index - 2))
    const monthLeads = leads.filter((lead) => {
      const createdAt = new Date(lead.createdAt)
      return createdAt >= month && createdAt < nextMonth
    })

    const converted = leads.filter((lead) => {
      if (lead.status !== 'Converted') return false
      const conversionActivity = lead.activities?.find(
        (activity) => activity.type === 'status' && /to Converted\b/.test(activity.text),
      )
      return conversionActivity
        ? new Date(conversionActivity.createdAt) >= month &&
            new Date(conversionActivity.createdAt) < nextMonth
        : new Date(lead.createdAt) >= month &&
            new Date(lead.createdAt) < nextMonth
    })

    return {
      month: format(month, 'MMM'),
      leads: monthLeads.length,
      converted: converted.length,
    }
  })
}

export function getLeadSources(leads) {
  const totals = leads.reduce((counts, lead) => {
    const source = lead.source || 'Other'
    counts.set(source, (counts.get(source) || 0) + 1)
    return counts
  }, new Map())
  const total = leads.length

  return [...totals.entries()]
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
    .map(([name, count], index) => ({
      name,
      count,
      value: total ? Math.round((count / total) * 100) : 0,
      color: leadSourceColors[index % leadSourceColors.length],
    }))
    .sort((a, b) => b.count - a.count)
}

export function getRecentActivity(collections, limit = 5) {
  return collections
    .flatMap(({ records, type }) =>
      records.flatMap((record) =>
        (record.activities || []).map((activity) => ({
          ...activity,
          recordName: record.name || record.title,
          type,
        })),
      ),
    )
    .filter((activity) => activity.createdAt && activity.text)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export function getDealPipeline(deals) {
  const stages = ['Prospecting', 'Offer', 'Under Contract', 'Closed Won', 'Closed Lost']
  return stages.map((stage) => ({
    stage,
    count: deals.filter((deal) => deal.stage === stage).length,
    amount: deals
      .filter((deal) => deal.stage === stage)
      .reduce((total, deal) => total + Number(deal.amount || 0), 0),
    color: dealStageColors[stage],
  }))
}
