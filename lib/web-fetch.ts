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
 * Agent-diversified web retrieval (FIXED)
 * Each agent gets different retrieval lens → prevents identical sources
 */
export async function fetchWebContext(
  query: string,
  agentName?: string
): Promise<WebContextResult> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY')
  }

  const agentQuery = diversifyQuery(query, agentName)

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: agentQuery,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 10, // IMPORTANT: expand pool
    }),
  })

  const data = await res.json()

  const sources: WebSource[] =
    (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    })) || []

  // ensure diversity (no truncation too early)
  const topSources = sources.slice(0, 8)

  return {
    answer: data.answer || '',
    sources: topSources,
  }
}

/**
 * 🔥 KEY FIX: agent-specific search lens
 * This is what makes agents STOP sharing identical sources
 */
function diversifyQuery(query: string, agent?: string): string {
  const base = query

  switch (agent) {
    case 'Analyst Alpha':
      return `${base} statistical models probability data analysis odds`

    case 'Base Rate Betty':
      return `${base} historical data base rates past outcomes statistics`

    case 'Contrarian Charlie':
      return `${base} risks failures upsets against consensus arguments`

    case 'Market Maker Max':
      return `${base} market odds pricing inefficiencies arbitrage`

    case 'Information Hunter Iris':
      return `${base} breaking news latest updates reports analysis`

    default:
      return base
  }
}