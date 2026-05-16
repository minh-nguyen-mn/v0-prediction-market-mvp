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
  'Quant Sigma': 'bg-blue-500',
  'Macro Maven': 'bg-purple-500',
  'Contrarian Charlie': 'bg-orange-500',
  'Base Rate Betty': 'bg-green-500',
  'Signal Scout': 'bg-red-500',
}

export function AgentPredictionCard({
  prediction,
}: AgentPredictionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const probability =
    Number(prediction.probability) * 100

  const confidence =
    Number(prediction.confidence) * 100

  const colorClass =
    agentColors[prediction.agent_name] ||
    'bg-gray-500'

  const parsedSources = Array.isArray(
    prediction.sources_used
  )
    ? prediction.sources_used
    : []

  return (
    <Card className="soft-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${colorClass}`}
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
        {/* METRICS */}
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

        {/* REASONING */}
        <div className="text-sm">
          <p className="mb-1 font-medium">
            Reasoning:
          </p>

          <p
            className={
              expanded
                ? ''
                : 'line-clamp-4 text-muted-foreground'
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

        {/* SOURCES */}
        {parsedSources.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Sources
            </p>

            <div className="flex flex-col gap-2">
              {parsedSources
                .slice(0, 5)
                .map((source: any, i: number) => {
                  const title =
                    source?.title ||
                    'Untitled Source'

                  const url = source?.url || ''

                  if (!url) {
                    return null
                  }

                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={url}
                      className="group rounded-md border bg-muted/40 px-3 py-2 transition hover:bg-muted"
                    >
                      <div className="truncate text-xs font-medium text-primary group-hover:underline">
                        {title}
                      </div>

                      <div className="truncate text-[10px] text-muted-foreground">
                        {url}
                      </div>
                    </a>
                  )
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}