export async function fetchWebContext(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY')
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

  const formattedSources =
    (data.results || [])
      .map((r: any) => {
        return [
          `SOURCE_TITLE: ${r.title}`,
          `SOURCE_URL: ${r.url}`,
          `SOURCE_SNIPPET: ${r.content}`,
        ].join('\n')
      })
      .join('\n\n')

  const contextParts = [
    data.answer ? `ANSWER: ${data.answer}` : null,
    formattedSources,
  ]

  const context = contextParts
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 6000)

  return context || 'No results'
}