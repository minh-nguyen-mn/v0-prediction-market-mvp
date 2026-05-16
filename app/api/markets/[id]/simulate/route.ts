import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { openai, anthropic } from '@ai-sdk/openai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { AGENT_CONFIGS, type Market } from '@/lib/types'
import { executeAgentTrade, getCurrentProbability, type MarketState } from '@/lib/lmsr'
import { fetchWebContext } from '@/lib/web-fetch'

/* =========================
   LLM MODEL RESOLVER
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
  sourcesUsed: z.array(z.string()),
})

/* =========================
   AGENT FUNCTION
========================= */
async function runAgentPrediction(
  agent: typeof AGENT_CONFIGS[0],
  market: Market,
  currentMarketState: MarketState,
  webContext: string
) {
  const currentProb = getCurrentProbability(currentMarketState)

  try {
    const { object: prediction } = await generateObject({
      model: getModel(),
      schema: agentPredictionSchema,
      prompt: `
You are ${agent.name}, ${agent.persona}

Biases: ${agent.biases.join(', ')}
Preferred sources: ${agent.informationSources.join(', ')}

Market Question:
${market.question_clean}

Resolution:
${market.resolution_criteria}

Category:
${market.category}

Current Probability:
${(currentProb * 100).toFixed(1)}%

Web Context:
${webContext}

Return:
- probability
- confidence
- reasoning
- sourcesUsed

Be consistent with your persona and biases.
`,
    })

    return prediction
  } catch (e) {
    return {
      probability: currentProb,
      confidence: 0.2,
      reasoning: 'Fallback due to LLM failure',
      sourcesUsed: [],
    }
  }
}

/* =========================
   MAIN ROUTE
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

    let currentState: MarketState = {
      yesShares: Number(market.yes_shares),
      noShares: Number(market.no_shares),
      liquidityParam: Number(market.liquidity_param),
    }

    /* =========================
       WEB CONTEXT (DIRECT CALL)
    ========================= */
    let webContext = 'No context available'
    try {
      webContext = await fetchWebContext(market.question_clean)
    } catch {
      webContext = 'Web fetch failed'
    }

    const results = []

    /* =========================
       5 AGENT LOOP (SEQUENTIAL)
    ========================= */
    for (const agent of AGENT_CONFIGS) {
      const prediction = await runAgentPrediction(
        agent,
        market as Market,
        currentState,
        webContext
      )

      const tradeSize = Math.max(5, Math.floor(prediction.confidence * 100))

      const tradeResult = executeAgentTrade(
        currentState,
        prediction.probability,
        prediction.confidence,
        tradeSize
      )

      currentState = {
        yesShares: tradeResult.newYesShares,
        noShares: tradeResult.newNoShares,
        liquidityParam: currentState.liquidityParam,
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

      if (saved) results.push(saved)
    }

    /* =========================
       FINAL LMSR UPDATE
    ========================= */
    const finalProbability = getCurrentProbability(currentState)

    await supabase
      .from('markets')
      .update({
        current_probability: finalProbability,
        yes_shares: currentState.yesShares,
        no_shares: currentState.noShares,
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