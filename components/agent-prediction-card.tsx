'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { AgentPrediction } from '@/lib/types'

const agentColors: Record<string, string> = {
  'Analyst Alpha': 'bg-blue-500',
  'Base Rate Betty': 'bg-green-500',
  'Contrarian Charlie': 'bg-orange-500',
  'Market Maker Max': 'bg-purple-500',
  'Information Hunter Iris': 'bg-red-500',
}

export function AgentPredictionCard({
  prediction,
}: {
  prediction: AgentPrediction
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              agentColors[prediction.agent_name] || 'bg-gray-500'
            }`}
          />
          <CardTitle className="text-base">
            {prediction.agent_name}
          </CardTitle>
        </div>

        <CardDescription>
          Trade size: {prediction.trade_size} shares
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="text-sm">
          <p className="font-medium">Reasoning:</p>

          <p className={expanded ? '' : 'line-clamp-3 text-muted-foreground'}>
            {prediction.reasoning}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary mt-1"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        </div>

        {/* SOURCES FIXED */}
        {prediction.sourcesUsed?.length ? (
          <div className="mt-3">
            <p className="text-xs font-medium mb-1">Sources</p>

            <div className="flex flex-col gap-1">
              {prediction.sourcesUsed.slice(0, 5).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline line-clamp-1"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}