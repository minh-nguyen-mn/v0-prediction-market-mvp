import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import {
  AGENT_CONFIGS,
  type Market,
} from '@/lib/types'

import {
  executeAgentTrade,
  getCurrentProbability,
  type MarketState,
} from '@/lib/lmsr'

import { fetchWebContext } from '@/lib/web-fetch'

/* =========================
   MODEL
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
   SCHEMA
========================= */
const agentPredictionSchema = z.object({
  probability: z.number().min(0.01).max(0.99),

  confidence: z.number().min(0.1).max(1.0),

  reasoning: z.string(),

  // required to satisfy OpenAI structured outputs
  sourcesUsed: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
    })
  ),
})

/* =========================
   AGENT RUNNER
========================= */
async function runAgentPrediction(
  agent: typeof AGENT_CONFIGS[0],
  market: Market,
  currentMarketState: MarketState
) {
  const currentProb =
    getCurrentProbability(currentMarketState)

  let webResult = {
    answer: 'No research available',
    sources: [],
  }

  try {
    webResult = await fetchWebContext(
      market.question_clean,
      agent.searchApproach
    )
  } catch {
    webResult = {
      answer: 'Web research failed',
      sources: [],
    }
  }

  const webContext = [
    webResult.answer,
    ...webResult.sources.map(
      (s) =>
        `
TITLE: ${s.title}
URL: ${s.url}
SNIPPET: ${s.content}
`
    ),
  ].join('\n\n')

  try {
    const { object: prediction } =
      await generateObject({
        model: getModel(),

        schema: agentPredictionSchema,

        prompt: `
You are ${agent.name}.

Persona:
${agent.persona}

Biases:
${agent.biases.join(', ')}

Preferred Information Sources:
${agent.informationSources.join(', ')}

Research Strategy:
${agent.searchApproach}

Market Question:
${market.question_clean}

Resolution Criteria:
${market.resolution_criteria}

Market Category:
${market.category}

Current Market Probability:
${(currentProb * 100).toFixed(1)}%

Independent Research Context:
${webContext}

Instructions:
- Think independently
- Stay faithful to your persona
- Use your own interpretation of evidence
- Avoid consensus thinking
- Confidence should realistically reflect uncertainty
- Use ONLY the supplied research context
- sourcesUsed must contain EXACTLY 5 sources
- Each source must contain:
  - title
  - url
- Prefer the most relevant and diverse sources

Return:
- probability
- confidence
- reasoning
- sourcesUsed
`,
      })

    const normalizedSources = webResult.sources
      .slice(0, 5)
      .map((source: any) => ({
        title: source.title || source.url,
        url: source.url,
      }))

    while (normalizedSources.length < 5) {
      normalizedSources.push({
        title: 'Additional research unavailable',
        url: '',
      })
    }

    return {
      probability: prediction.probability,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning,

      // force consistency from Tavily results
      sourcesUsed: normalizedSources,
    }
  } catch {
    return {
      probability: currentProb,

      confidence: 0.2,

      reasoning:
        'Fallback prediction generated due to model failure.',

      sourcesUsed: [],
    }
  }
}

/* =========================
   ROUTE
========================= */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: market } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single()

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    const probabilityBefore = Number(
      market.current_probability
    )

    let currentState: MarketState = {
      yesShares: Number(market.yes_shares),
      noShares: Number(market.no_shares),
      liquidityParam: Number(market.liquidity_param),
    }

    const results = []

    /* =========================
       MULTI AGENT LOOP
    ========================= */
    for (const agent of AGENT_CONFIGS) {
      const prediction =
        await runAgentPrediction(
          agent,
          market as Market,
          currentState
        )

      const tradeSize = Math.max(
        5,
        Math.floor(prediction.confidence * 100)
      )

      const tradeResult = executeAgentTrade(
        currentState,
        prediction.probability,
        prediction.confidence,
        tradeSize
      )

      currentState = {
        yesShares: tradeResult.newYesShares,
        noShares: tradeResult.newNoShares,
        liquidityParam:
          currentState.liquidityParam,
      }

      const { data: saved } = await supabase
        .from('agent_predictions')
        .insert({
          market_id: id,

          agent_name: agent.name,

          probability: prediction.probability,

          confidence: prediction.confidence,

          trade_size: tradeSize,

          reasoning: prediction.reasoning,

          sources_used: prediction.sourcesUsed,
        })
        .select()
        .single()

      if (saved) {
        results.push(saved)
      }
    }

    const finalProbability =
      getCurrentProbability(currentState)

    await supabase
      .from('markets')
      .update({
        current_probability: finalProbability,
        yes_shares: currentState.yesShares,
        no_shares: currentState.noShares,
      })
      .eq('id', id)

    await supabase
      .from('simulation_runs')
      .insert({
        market_id: id,
        probability_before: probabilityBefore,
        probability_after: finalProbability,
      })

    return NextResponse.json({
      market: {
        ...market,
        current_probability: finalProbability,
        yes_shares: currentState.yesShares,
        no_shares: currentState.noShares,
      },

      predictions: results,

      probabilityChange: {
        before: probabilityBefore,
        after: finalProbability,
      },
    })
  } catch (error) {
    console.error('Simulation error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}