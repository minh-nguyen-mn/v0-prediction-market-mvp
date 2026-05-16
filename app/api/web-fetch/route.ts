import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai, anthropic } from '@ai-sdk/openai'
import * as cheerio from 'cheerio'

/* =========================
   MODEL RESOLVER
========================= */
function getModel() {
  const provider = process.env.LLM_PROVIDER

  switch (provider) {
    case 'anthropic':
      return anthropic('claude-3-5-sonnet-latest')
    case 'openai':
      return openai('gpt-4o-mini')
    default:
      return openai('gpt-4o-mini')
  }
}

/* =========================
   SIMPLE URL GENERATION
========================= */
function buildSearchUrls(query: string): string[] {
  const encoded = encodeURIComponent(query)

  return [
    `https://en.wikipedia.org/wiki/Special:Search?search=${encoded}`,
    `https://news.google.com/search?q=${encoded}`,
  ]
}

/* =========================
   SAFE PAGE FETCH
========================= */
async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    const html = await res.text()
    const $ = cheerio.load(html)

    // remove junk
    $('script, style, nav, footer, iframe').remove()

    const text = $('body').text().replace(/\s+/g, ' ').slice(0, 4000)

    return text
  } catch {
    return ''
  }
}

/* =========================
   MAIN ROUTE
========================= */
export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const urls = buildSearchUrls(query)

    // fetch 1–2 sources only (Vercel safe)
    const pages = await Promise.all(urls.slice(0, 2).map(fetchPage))

    const rawContext = pages.filter(Boolean).join('\n\n').slice(0, 6000)

    /* =========================
       LLM SUMMARY STEP
    ========================= */
    const { text } = await generateText({
      model: getModel(),
      prompt: `
You are a research summarizer for prediction markets.

Given the following raw web-extracted content, extract:

1. Key facts
2. Recent developments
3. Relevant statistics
4. Useful signals for probability estimation

QUERY:
${query}

CONTENT:
${rawContext}

Keep under 500 words. Be factual. Avoid speculation.
`,
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error('Web fetch error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch web content',
        content: 'No web context available.',
      },
      { status: 200 }
    )
  }
}