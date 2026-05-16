export interface WebSource {
  title: string
  url: string
  snippet: string
}

export interface WebResearchResult {
  context: string
  sources: WebSource[]
}

function normalizeUrl(url: string) {
  if (!url) return ''

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `https://${url}`
}

export async function fetchWebContext(
  query: string,
  searchApproach?: string
): Promise<WebResearchResult> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY')
  }

  const enhancedQuery = searchApproach
    ? `${searchApproach}\n\nTopic: ${query}`
    : query

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },

    body: JSON.stringify({
      query: enhancedQuery,
      search_depth: 'advanced',
      include_answer: true,
      include_raw_content: false,
      max_results: 10,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed Tavily search')
  }

  const data = await res.json()

  const sources: WebSource[] = (data.results || [])
    .filter((r: any) => r?.title && r?.url)
    .slice(0, 5)
    .map((r: any) => ({
      title: String(r.title).trim(),
      url: normalizeUrl(String(r.url).trim()),
      snippet: String(r.content || '').trim(),
    }))

  const formattedSources = sources
    .map((source, index) => {
      return [
        `SOURCE_${index + 1}_TITLE: ${source.title}`,
        `SOURCE_${index + 1}_URL: ${source.url}`,
        `SOURCE_${index + 1}_SNIPPET: ${source.snippet}`,
      ].join('\n')
    })
    .join('\n\n')

  const context = [
    data.answer
      ? `SEARCH_SUMMARY:\n${data.answer}`
      : null,

    formattedSources,
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 7000)

  return {
    context: context || 'No research available',
    sources,
  }
}