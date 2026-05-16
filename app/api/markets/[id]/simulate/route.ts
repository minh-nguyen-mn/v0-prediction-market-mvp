import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import { AGENT_CONFIGS, type Market } from '@/lib/types'

import {
  executeAgentTrade,
  getCurrentProbability,
  type MarketState,
} from '@/lib/lmsr'

import { fetchWebContext } from '@/lib/web-fetch'

function getModel() {
  const provider = process.env.LLM_PROVIDER

  if (provider === 'anthropic') {
    return anthropic('claude-3-5-sonnet-latest')
  }

  return openai('gpt-4o-mini')
}

const agentPredictionSchema = z.object({
  probability: z.number().min(0.01).max(0.99),
  confidence: z.number().min(0.1).max(1),
  reasoning: z.string(),

  // REQUIRED for OpenAI structured outputs
  sourcesUsed: z.array(z.string()),
})

async function runAgentPrediction(
  agent: typeof AGENT_CONFIGS[0],
  market: Market,
  currentMarketState: MarketState
) {
  const currentProb = getCurrentProbability(currentMarketState)

  const web = await fetchWebContext(
    market.question_clean,
    agent.name
  )

  const webContext = [
    web.answer,

    ...web.sources.map(
      (s) =>
        `TITLE: ${s.title}
URL: ${s.url}
CONTENT: ${s.content}`
    ),
  ].join('\n\n')

  const { object } = await generateObject({
    model: getModel(),

    schema: agentPredictionSchema,

    prompt: `
You are ${agent.name}

Persona:
${agent.persona}

Biases:
${agent.biases.join(', ')}

Preferred information sources:
${agent.informationSources.join(', ')}

Market Question:
${market.question_clean}

Resolution Criteria:
${market.resolution_criteria}

Category:
${market.category}

Current market probability:
${(currentProb * 100).toFixed(2)}%

Web Evidence:
${webContext}

Instructions:
- Produce an independent forecast
- Stay faithful to your persona
- Use evidence from retrieved sources
- Avoid copying consensus blindly

Return:
- probability (0-1)
- confidence (0-1)
- reasoning
- sourcesUsed
`,
  })

  return {
    probability: object.probability,
    confidence: object.confidence,
    reasoning: object.reasoning,

    // REAL sources override hallucinated sources
    sourcesUsed: web.sources.slice(0, 5).map((s) => ({
      title: s.title,
      url: s.url,
    })),
  }
}

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

    let state: MarketState = {
      yesShares: Number(market.yes_shares),
      noShares: Number(market.no_shares),
      liquidityParam: Number(market.liquidity_param),
    }

    const results = []

    for (const agent of AGENT_CONFIGS) {
      const prediction = await runAgentPrediction(
        agent,
        market as Market,
        state
      )

      const tradeSize = Math.max(
        5,
        Math.floor(prediction.confidence * 100)
      )

      const trade = executeAgentTrade(
        state,
        prediction.probability,
        prediction.confidence,
        tradeSize
      )

      state = {
        yesShares: trade.newYesShares,
        noShares: trade.newNoShares,
        liquidityParam: state.liquidityParam,
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

          // DB column stays snake_case
          sources_used: prediction.sourcesUsed,
        })
        .select()
        .single()

      if (saved) {
        results.push({
          ...saved,

          // CRITICAL FIX
          sourcesUsed: saved.sources_used || [],
        })
      }
    }

    const finalProbability =
      getCurrentProbability(state)

    await supabase
      .from('markets')
      .update({
        current_probability: finalProbability,
        yes_shares: state.yesShares,
        no_shares: state.noShares,
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
        yes_shares: state.yesShares,
        no_shares: state.noShares,
      },

      predictions: results,

      probabilityChange: {
        before: probabilityBefore,
        after: finalProbability,
      },
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}