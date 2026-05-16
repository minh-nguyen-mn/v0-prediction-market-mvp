import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Use the LLM with web search capability to gather relevant information
    const { text } = await generateText({
      model: 'anthropic/claude-sonnet-4-20250514',
      prompt: `You are a research assistant gathering information for a prediction market.
      
Search for recent, relevant information about this topic: "${query}"

Provide a concise summary of:
1. Recent news and developments
2. Key statistics or data points
3. Expert opinions or forecasts
4. Any relevant historical context

Focus on factual information that would help estimate probabilities.
Keep your response focused and under 500 words.`,
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error('Error in web fetch:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch web content',
      content: 'Unable to gather additional context at this time.' 
    }, { status: 200 })
  }
}
