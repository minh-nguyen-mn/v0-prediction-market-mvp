'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { CreateMarketForm } from '@/components/create-market-form'
import { MarketCard } from '@/components/market-card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import type { Market } from '@/lib/types'

export default function MarketsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const response = await fetch('/api/markets')
      if (response.ok) {
        const data = await response.json()
        setMarkets(data.markets)
      }
      setIsLoading(false)
    }
    loadData()
  }, [router, supabase.auth])

  function handleMarketCreated(market: { id: string }) {
    router.push(`/markets/${market.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar userEmail={user?.email} />
        <main className="container flex-1 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-2">
              <div className="grid gap-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userEmail={user?.email} />
      <main className="container flex-1 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CreateMarketForm onMarketCreated={handleMarketCreated} />
          </div>
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Active Markets</h2>
            {markets.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No markets yet. Create the first one!
              </div>
            ) : (
              <div className="grid gap-4">
                {markets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
