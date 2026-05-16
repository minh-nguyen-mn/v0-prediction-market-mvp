import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.TAVILY_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Tavily API key missing' },
        { status: 500 }
      )
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 5,
      }),
    })

    const data = await res.json()

    const context =
      [
        data.answer,
        ...(data.results?.map((r: any) => `${r.title}: ${r.content}`) || []),
      ]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 6000) || 'No results'

    return NextResponse.json({
      content: context,
    })
  } catch (error) {
    console.error('Tavily error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch web context',
        content: 'No web context available',
      },
      { status: 200 }
    )
  }
}