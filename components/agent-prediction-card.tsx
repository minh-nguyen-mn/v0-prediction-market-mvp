'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import type { AgentPrediction } from '@/lib/types'

interface AgentPredictionCardProps {
  prediction: AgentPrediction
}

const agentColors: Record<string, string> = {
  'Analyst Alpha': 'bg-blue-500',
  'Pundit Prime': 'bg-purple-500',
  'Contrarian Charlie': 'bg-orange-500',
  'Base Rate Betty': 'bg-green-500',
  'News Ninja': 'bg-red-500',
}

export function AgentPredictionCard({ prediction }: AgentPredictionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const probability = Number(prediction.probability) * 100
  const confidence = Number(prediction.confidence) * 100
  const colorClass = agentColors[prediction.agent_name] || 'bg-gray-500'

  return (
    <Card className="soft-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${colorClass}`} />
          <CardTitle className="text-base">
            {prediction.agent_name}
          </CardTitle>
        </div>

        <CardDescription>
          Trade size: {prediction.trade_size} shares
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* METRICS */}
        <div className="flex gap-4 mb-3">
          <div>
            <p className="text-xl font-bold">
              {probability.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Estimate</p>
          </div>

          <div>
            <p className="text-xl font-bold">
              {confidence.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Confidence</p>
          </div>
        </div>

        {/* REASONING (FIXED: EXPANDABLE) */}
        <div className="text-sm">
          <p className="font-medium mb-1">Reasoning:</p>

          <p className={expanded ? '' : 'line-clamp-3 text-muted-foreground'}>
            {prediction.reasoning}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Read full reasoning'}
          </button>
        </div>

        {/* SOURCES */}
        {prediction.sources_used &&
          prediction.sources_used.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {prediction.sources_used.map((source, i) => {
                const isUrl = isValidHttpUrl(source)

                if (isUrl) {
                  return (
                    <a
                      key={i}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-muted px-2 py-0.5 text-xs text-primary hover:underline hover:opacity-80"
                    >
                      {new URL(source).hostname}
                    </a>
                  )
                }

                // IMPORTANT: non-URLs are NOT clickable
                return (
                  <span
                    key={i}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {source}
                  </span>
                )
              })}
            </div>
        )}
      </CardContent>
    </Card>
  )
}