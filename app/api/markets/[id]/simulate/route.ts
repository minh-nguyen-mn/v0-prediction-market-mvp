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
  type MarketState
} from '@/lib/lmsr'

import { fetchWebContext } from '@/lib/web-fetch'

/* =========================
   MODEL
========================= */
function getModel() {
  const provider = process.env.LLM_PROVIDER

  if (provider === 'anthropic') {
    return anthropic('claude-3-5-sonnet-latest')
  }

  return openai('gpt-4o-mini')
}

/* =========================
   SCHEMA (unchanged logic but improved clarity)
========================= */
const agentPredictionSchema = z.object({
  probability: z.number().min(0.01).max(0.99),
  confidence: z.number().min(0.1).max(1.0),
  reasoning: z.string(),

  // still strings from LLM, but we will override with real sources
  sourcesUsed: z.array(z.string()).optional(),
})

/* =========================
   AGENT RUNNER (FIXED)
========================= */
async function runAgentPrediction(
  agent: typeof AGENT_CONFIGS[0],
  market: Market,
  currentMarketState: MarketState
) {
  const currentProb = getCurrentProbability(currentMarketState)

  // 🔥 FIX #1: agent-specific web search
  const web = await fetchWebContext(market.question_clean, agent.name)

  const webContext = [
    web.answer,
    web.sources.map(s => `${s.title}: ${s.content}`).join('\n')
  ].join('\n\n')

  const { object: prediction } = await generateObject({
    model: getModel(),
    schema: agentPredictionSchema,
    prompt: `
You are ${agent.name}.
Persona: ${agent.persona}

Biases: ${agent.biases.join(', ')}
Preferred sources: ${agent.informationSources.join(', ')}

Market:
${market.question_clean}

Resolution:
${market.resolution_criteria}

Category:
${market.category}

Current probability: ${(currentProb * 100).toFixed(2)}%

Web evidence:
${webContext}

Return:
- probability (0-1)
- confidence (0-1)
- reasoning

Be faithful to your persona.
`,
  })

  // 🔥 FIX #2: override LLM sources with REAL structured sources
  const structuredSources = web.sources.slice(0, 5).map(s => ({
    title: s.title,
    url: s.url,
  }))

  return {
    ...prediction,
    sourcesUsed: structuredSources,
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: market } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single()

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    const probabilityBefore = Number(market.current_probability)

    let state: MarketState = {
      yesShares: Number(market.yes_shares),
      noShares: Number(market.no_shares),
      liquidityParam: Number(market.liquidity_param),
    }

    const results = []

    /* =========================
       AGENT LOOP (NOW FULLY INDEPENDENT)
    ========================= */
    for (const agent of AGENT_CONFIGS) {

      // 🔥 FIX #3: each agent has independent retrieval already inside runner
      const prediction = await runAgentPrediction(agent, market as Market, state)

      const tradeSize = Math.max(5, Math.floor(prediction.confidence * 100))

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

          // 🔥 FIXED: structured sources
          sources_used: prediction.sourcesUsed,
        })
        .select()
        .single()

      if (saved) results.push(saved)
    }

    const finalProbability = getCurrentProbability(state)

    await supabase
      .from('markets')
      .update({
        current_probability: finalProbability,
        yes_shares: state.yesShares,
        no_shares: state.noShares,
      })
      .eq('id', id)

    await supabase.from('simulation_runs').insert({
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