export interface WebSource {
  title: string
  url: string
  content: string
}

export interface WebContextResult {
  answer: string
  sources: WebSource[]
}

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
    throw new Error('Tavily search failed')
  }

  const data = await res.json()

  const sources: WebSource[] = (data.results || []).map((r: any) => ({
    title: r.title || 'Untitled Source',
    url: r.url || '',
    content: r.content || '',
  }))

  return {
    answer: data.answer || '',
    sources,
  }
}

function diversifyQuery(query: string, agent?: string): string {
  switch (agent) {
    case 'Analyst Alpha':
      return `${query} statistics probability models forecasts quantitative analysis`

    case 'Base Rate Betty':
      return `${query} historical frequency base rates historical outcomes`

    case 'Market Maker Max':
      return `${query} betting odds implied probability prediction markets`

    case 'Contrarian Charlie':
      return `${query} risks failures criticism downside concerns upset scenarios`

    case 'Information Hunter Iris':
      return `${query} latest news breaking updates current developments`

    default:
      return query
  }
}