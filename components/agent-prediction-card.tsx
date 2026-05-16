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

interface StructuredSource {
  title: string
  url: string
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

  /* =========================
     SAFE SOURCE PARSING
  ========================= */

  const parsedSources: StructuredSource[] =
    Array.isArray(prediction.sources_used)
      ? prediction.sources_used
          .map((source: any) => {
            // NEW FORMAT
            if (
              typeof source === 'object' &&
              source?.title &&
              source?.url
            ) {
              return {
                title: source.title,
                url: source.url,
              }
            }

            // OLD FORMAT SUPPORT
            if (typeof source === 'string') {
              const titleMatch =
                source.match(
                  /SOURCE_TITLE:\s*(.*?)(\n|$)/
                )

              const urlMatch =
                source.match(
                  /SOURCE_URL:\s*(.*?)(\n|$)/
                )

              if (
                titleMatch?.[1] &&
                urlMatch?.[1]
              ) {
                return {
                  title: titleMatch[1].trim(),
                  url: urlMatch[1].trim(),
                }
              }

              // raw url fallback
              if (source.startsWith('http')) {
                return {
                  title: source
                    .replace(/^https?:\/\//, '')
                    .slice(0, 60),
                  url: source,
                }
              }
            }

            return null
          })
          .filter(Boolean)
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
                .map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate rounded-md border bg-muted px-3 py-2 text-xs text-primary transition hover:bg-accent hover:underline"
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