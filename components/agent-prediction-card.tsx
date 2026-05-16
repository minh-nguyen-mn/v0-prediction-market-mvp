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

interface AgentPredictionCardProps {
  prediction: AgentPrediction
}

const agentColors: Record<string, string> = {
  'Analyst Alpha': 'bg-blue-500',
  'Base Rate Betty': 'bg-green-500',
  'Contrarian Charlie': 'bg-orange-500',
  'Market Maker Max': 'bg-purple-500',
  'Information Hunter Iris': 'bg-red-500',
}

export function AgentPredictionCard({
  prediction,
}: AgentPredictionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const probability = Number(prediction.probability) * 100
  const confidence = Number(prediction.confidence) * 100

  const colorClass =
    agentColors[prediction.agent_name] || 'bg-gray-500'

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
        <div className="mb-3 flex gap-4">
          <div>
            <p className="text-xl font-bold">
              {probability.toFixed(1)}%
            </p>

            <p className="text-xs text-muted-foreground">
              Estimate
            </p>
          </div>

          <div>
            <p className="text-xl font-bold">
              {confidence.toFixed(0)}%
            </p>

            <p className="text-xs text-muted-foreground">
              Confidence
            </p>
          </div>
        </div>

        <div className="text-sm">
          <p className="mb-1 font-medium">
            Reasoning:
          </p>

          <p
            className={
              expanded
                ? ''
                : 'line-clamp-3 text-muted-foreground'
            }
          >
            {prediction.reasoning}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-primary hover:underline"
          >
            {expanded
              ? 'Show less'
              : 'Read full reasoning'}
          </button>
        </div>

        {prediction.sources_used &&
          prediction.sources_used.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Sources
              </p>

              <div className="flex flex-col gap-1">
                {prediction.sources_used
                  .slice(0, 5)
                  .map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-1 text-xs text-primary hover:underline"
                      title={source.url}
                    >
                      {source.title}
                    </a>
                  ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  )
}