'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { SimulationButton } from '@/components/simulation-button'
import { AgentPredictionCard } from '@/components/agent-prediction-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import type { Market, AgentPrediction, SimulationRun } from '@/lib/types'

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [predictions, setPredictions] = useState<AgentPrediction[]>([])
  const [simulationRuns, setSimulationRuns] = useState<SimulationRun[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const response = await fetch(`/api/markets/${id}`)
      if (response.ok) {
        const data = await response.json()
        setMarket(data.market)
        setPredictions(data.predictions)
        setSimulationRuns(data.simulationRuns)
      }
      setIsLoading(false)
    }
    loadData()
  }, [id, router, supabase.auth])

  function handleSimulationComplete(data: {
    market: Market
    predictions: AgentPrediction[]
    probabilityChange: { before: number; after: number }
  }) {
    setMarket(data.market)
    setPredictions((prev) => [...prev, ...data.predictions])
    setSimulationRuns((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        market_id: id,
        probability_before: data.probabilityChange.before,
        probability_after: data.probabilityChange.after,
        created_at: new Date().toISOString(),
      },
    ])
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar userEmail={user?.email} />
        <main className="container flex-1 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar userEmail={user?.email} />
        <main className="container flex-1 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Market not found</h1>
            <Button asChild className="mt-4">
              <Link href="/markets">Back to Markets</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const probability = Number(market.current_probability) * 100
  const isExpired = new Date(market.expires_at) < new Date()

  // Group predictions by simulation run
  const latestPredictions = predictions.slice(-5)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userEmail={user?.email} />
      <main className="container flex-1 py-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/markets">Back to Markets</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="soft-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{market.question_clean}</CardTitle>
                    <CardDescription className="mt-2">
                      {market.resolution_criteria}
                    </CardDescription>
                  </div>
                  <Badge variant={isExpired ? 'secondary' : 'default'}>
                    {isExpired ? 'Expired' : market.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-4xl font-bold text-primary">
                      {probability.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Current Probability</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {new Date(market.expires_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Expires</p>
                  </div>
                </div>
                <div className="mt-4 h-3 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${probability}%` }}
                  />
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                  <span>YES: {Number(market.yes_shares).toFixed(2)} shares</span>
                  <span>NO: {Number(market.no_shares).toFixed(2)} shares</span>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">Agent Predictions</h2>
              {latestPredictions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No predictions yet. Run a simulation to see agent analysis.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {latestPredictions.map((prediction) => (
                    <AgentPredictionCard key={prediction.id} prediction={prediction} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="soft-shadow">
              <CardHeader>
                <CardTitle>Run Simulation</CardTitle>
                <CardDescription>
                  Let 5 AI agents analyze this market and trade based on their predictions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimulationButton
                  marketId={id}
                  onSimulationComplete={handleSimulationComplete}
                />
              </CardContent>
            </Card>

            {simulationRuns.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Simulation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {simulationRuns.slice(-5).reverse().map((run, i) => (
                      <div key={run.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Run {simulationRuns.length - i}
                        </span>
                        <span>
                          {(Number(run.probability_before) * 100).toFixed(1)}% →{' '}
                          {(Number(run.probability_after) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Original Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{market.question_raw}&rdquo;
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
