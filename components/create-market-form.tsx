'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

interface CreateMarketFormProps {
  onMarketCreated: (market: { id: string }) => void
}

export function CreateMarketForm({ onMarketCreated }: CreateMarketFormProps) {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/markets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionRaw: question }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create market')
      }

      const data = await response.json()
      setQuestion('')
      onMarketCreated(data.market)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="soft-shadow">
      <CardHeader>
        <CardTitle>Create New Market</CardTitle>
        <CardDescription>
          Enter your prediction question. Our AI will clean it up and generate resolution criteria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Textarea
            placeholder="e.g., Will AI replace 50% of customer service jobs by 2030?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-24"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isLoading || !question.trim()}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating Market...
              </>
            ) : (
              'Create Market'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
