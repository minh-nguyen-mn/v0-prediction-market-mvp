export async function fetchWebContext(query: string): Promise<string> {
  try {
    const res = await fetch('/api/web-fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    const data = await res.json()
    return data.content || 'No context available'
  } catch (e) {
    return 'Web fetch failed'
  }
}