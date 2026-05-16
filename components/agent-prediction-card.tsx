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
  'Quant Sigma': 'bg-blue-500',
  'Macro Maven': 'bg-purple-500',
  'Contrarian Charlie': 'bg-orange-500',
  'Base Rate Betty': 'bg-green-500',
  'Signal Scout': 'bg-red-500',
}

interface SourceItem {
  title: string
  url: string
}

export function AgentPredictionCard({
  prediction,
}: AgentPredictionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const probability = Number(prediction.probability) * 100
  const confidence = Number(prediction.confidence) * 100

  const colorClass =
    agentColors[prediction.agent_name] || 'bg-gray-500'

  const parsedSources: SourceItem[] = (() => {
    if (!prediction.sources_used) {
      return []
    }

    return prediction.sources_used
      .map((source: any) => {
        // new structured format
        if (
          typeof source === 'object' &&
          source?.title
        ) {
          return {
            title: source.title,
            url: source.url || '',
          }
        }

        // fallback old string format
        if (typeof source === 'string') {
          const titleMatch =
            source.match(
              /SOURCE_TITLE:\s*(.*?)(\n|$)/
            )

          const urlMatch =
            source.match(
              /SOURCE_URL:\s*(.*?)(\n|$)/
            )

          return {
            title:
              titleMatch?.[1] ||
              source ||
              'Unknown Source',

            url: urlMatch?.[1] || '',
          }
        }

        return null
      })
      .filter(Boolean)
      .slice(0, 5) as SourceItem[]
  })()

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

            <div className="flex flex-col gap-1">
              {parsedSources.map((source, i) => {
                if (!source.url) {
                  return (
                    <div
                      key={i}
                      className="truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      {source.title}
                    </div>
                  )
                }

                return (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate rounded bg-muted px-2 py-1 text-xs text-primary transition-colors hover:bg-muted/80 hover:underline"
                    title={source.url}
                  >
                    {source.title}
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