export interface WebSource {
  title: string
  url: string
  content: string
}

export interface WebContextResult {
  answer: string
  sources: WebSource[]
}

/**
 * Agent-diversified web retrieval
 * Each agent receives a different retrieval lens
 * so they no longer share identical evidence.
 */
export async function fetchWebContext(
  query: string,
  agentName?: string
): Promise<WebContextResult> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY')
  }

  const diversifiedQuery = diversifyQuery(query, agentName)

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: diversifiedQuery,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 10,
    }),
  })

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status}`)
  }

  const data = await res.json()

  const allSources: WebSource[] =
    (data.results || []).map((r: any) => ({
      title: r.title || 'Untitled Source',
      url: r.url || '',
      content: r.content || '',
    })) || []

  /**
   * Deduplicate by URL
   */
  const uniqueMap = new Map<string, WebSource>()

  for (const source of allSources) {
    if (!source.url) continue

    if (!uniqueMap.has(source.url)) {
      uniqueMap.set(source.url, source)
    }
  }

  const uniqueSources = Array.from(uniqueMap.values())

  /**
   * Return more than 5 internally
   * UI can decide how many to render
   */
  return {
    answer: data.answer || '',
    sources: uniqueSources.slice(0, 8),
  }
}

/**
 * Core diversification logic
 * This is what makes agents independently research.
 */
function diversifyQuery(query: string, agent?: string): string {
  switch (agent) {
    case 'Analyst Alpha':
      return `
${query}
statistical forecast probability models prediction data analysis historical performance
`

    case 'Base Rate Betty':
      return `
${query}
historical frequencies base rates long-term outcomes archives statistics prior cases
`

    case 'Market Maker Max':
      return `
${query}
betting odds implied probability prediction market pricing bookmaker consensus
`

    case 'Contrarian Charlie':
      return `
${query}
arguments against consensus hidden risks upset scenarios failure cases skepticism
`

    case 'Information Hunter Iris':
      return `
${query}
breaking news latest developments current updates reports social sentiment
`

    default:
      return query
  }
}