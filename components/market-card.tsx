'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Market } from '@/lib/types'

interface MarketCardProps {
  market: Market
}

export function MarketCard({ market }: MarketCardProps) {
  const probability = Number(market.current_probability) * 100
  const isExpired = new Date(market.expires_at) < new Date()
  
  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">
              {market.question_clean}
            </CardTitle>
            <Badge variant={isExpired ? 'secondary' : 'default'}>
              {isExpired ? 'Expired' : market.category}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {market.resolution_criteria}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {probability.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Probability</p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Expires</p>
              <p>{new Date(market.expires_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${probability}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
