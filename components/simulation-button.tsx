'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { Market, AgentPrediction } from '@/lib/types'

interface SimulationButtonProps {
  marketId: string
  onSimulationComplete: (data: {
    market: Market
    predictions: AgentPrediction[]
    probabilityChange: { before: number; after: number }
  }) => void
}

export function SimulationButton({ marketId, onSimulationComplete }: SimulationButtonProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSimulation() {
    setIsRunning(true)
    setError(null)

    try {
      const response = await fetch(`/api/markets/${marketId}/simulate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to run simulation')
      }

      const data = await response.json()
      onSimulationComplete(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={runSimulation} disabled={isRunning} size="lg">
        {isRunning ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Running Agents...
          </>
        ) : (
          'Run Multi-Agent Simulation'
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {isRunning && (
        <p className="text-sm text-muted-foreground">
          This may take a minute as 5 agents analyze and trade...
        </p>
      )}
    </div>
  )
}
