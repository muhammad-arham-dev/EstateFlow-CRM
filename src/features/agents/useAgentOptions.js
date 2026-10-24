import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AGENTS } from '../leads/leadService.js'
import { agentService } from './agentService'

export function useAgentOptions(currentName = '') {
  const [activeNames, setActiveNames] = useState(AGENTS)

  useEffect(() => {
    let cancelled = false
    const loadAgents = async () => {
      try {
        const records = await agentService.getAll()
        if (!cancelled) {
          setActiveNames(records
            .filter((agent) => agent.status === 'Active')
            .map((agent) => agent.name))
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Unable to load the agent directory.')
        }
      }
    }

    loadAgents()
    window.addEventListener('estateflow:data-changed', loadAgents)
    return () => {
      cancelled = true
      window.removeEventListener('estateflow:data-changed', loadAgents)
    }
  }, [])

  return useMemo(
    () => [...new Set([...activeNames, currentName].filter(Boolean))],
    [activeNames, currentName],
  )
}
