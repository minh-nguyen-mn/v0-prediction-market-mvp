export interface WebSource {
  title: string
  url: string
  content: string
  score: number
}

export interface WebContextResult {
  answer: string
  sources: WebSource[]
}

/**
 * FIXED:
 * - agent-separated query expansion
 * - dedup by domain + url
 * - ranking stability
 * - better max pool usage
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
      max_results: 12,
    }),
  })

  const data = await res.json()

  const raw: WebSource[] =
    (data.results || []).map((r: any, idx: number) => ({
      title: r.title || 'Untitled',
      url: normalizeUrl(r.url),
      content: r.content || '',
      score: scoreResult(r, idx),
    }))

  // Deduplicate by URL
  const deduped = Array.from(
    new Map(raw.map((s) => [s.url, s])).values()
  )

  // Sort by score (important)
  const ranked = deduped.sort((a, b) => b.score - a.score)

  return {
    answer: data.answer || '',
    sources: ranked.slice(0, 10),
  }
}

/* =========================
   QUERY DIVERSIFICATION
========================= */
function diversifyQuery(query: string, agent?: string): string {
  const base = query

  switch (agent) {
    case 'Analyst Alpha':
      return `${base} probability model regression statistics dataset`

    case 'Base Rate Betty':
      return `${base} historical frequency base rate prior outcomes`

    case 'Market Maker Max':
      return `${base} betting odds implied probability market pricing`

    case 'Contrarian Charlie':
      return `${base} counterargument risk failure upset scenarios`

    case 'Information Hunter Iris':
      return `${base} breaking news latest reports live updates`

    default:
      return base
  }
}

/* =========================
   HELPERS
========================= */

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`
  } catch {
    return url
  }
}

function scoreResult(r: any, idx: number): number {
  let score = 100 - idx * 5

  if (r.content && r.content.length > 300) score += 10
  if (r.title && r.title.length > 10) score += 5

  return score
}