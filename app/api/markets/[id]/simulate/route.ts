import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { AGENT_CONFIGS, type Market } from '@/lib/types'
import { executeAgentTrade, getCurrentProbability, type MarketState } from '@/lib/lmsr'

const agentPredictionSchema = z.object({
  probability: z.number().min(0.01).max(0.99).describe('Predicted probability between 0.01 and 0.99'),
  confidence: z.number().min(0.1).max(1.0).describe('Confidence level between 0.1 and 1.0'),
  reasoning: z.string().describe('Detailed reasoning for this prediction'),
  sourcesUsed: z.array(z.string()).describe('List of information sources consulted'),
})

async function runAgentPrediction(
  agent: typeof AGENT_CONFIGS[0],
  market: Market,
  currentMarketState: MarketState,
  webContext: string
) {
  const currentProb = getCurrentProbability(currentMarketState)
  
  const { object: prediction } = await generateObject({
    model: 'anthropic/claude-sonnet-4-20250514',
    schema: agentPredictionSchema,
    prompt: `You are ${agent.name}, ${agent.persona}

Your known biases are: ${agent.biases.join(', ')}
Your preferred information sources are: ${agent.informationSources.join(', ')}

You are evaluating a prediction market:
Question: ${market.question_clean}
Resolution criteria: ${market.resolution_criteria}
Category: ${market.category}
Expires: ${market.expires_at}

Current market probability: ${(currentProb * 100).toFixed(1)}%

Here is recent web information that may be relevant:
${webContext}

Based on your persona, biases, and the available information, provide your probability estimate.
Be true to your character's biases - they should influence your estimate.
Provide detailed reasoning that reflects your analytical approach.`,
  })

  return prediction
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the market
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single()

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    // Fetch web context for the market question
    let webContext = 'No additional web context available.'
    try {
      const webResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/web-fetch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: market.question_clean }),
        }
      )
      if (webResponse.ok) {
        const webData = await webResponse.json()
        webContext = webData.content || webContext
      }
    } catch (e) {
      console.log('Web fetch failed, proceeding without web context:', e)
    }

    const probabilityBefore = Number(market.current_probability)
    
    let currentState: MarketState = {
      yesShares: Number(market.yes_shares),
      noShares: Number(market.no_shares),
      liquidityParam: Number(market.liquidity_param),
    }

    const predictions = []

    // Run each agent sequentially (they react to each other's trades)
    for (const agentConfig of AGENT_CONFIGS) {
      const prediction = await runAgentPrediction(
        agentConfig,
        market as Market,
        currentState,
        webContext
      )

      // Execute the agent's trade
      const tradeResult = executeAgentTrade(
        currentState,
        prediction.probability,
        prediction.confidence,
        10 // max trade size
      )

      // Update market state for next agent
      currentState = {
        ...currentState,
        yesShares: tradeResult.newYesShares,
        noShares: tradeResult.newNoShares,
      }

      // Save the prediction
      const { data: savedPrediction, error: predError } = await supabase
        .from('agent_predictions')
        .insert({
          market_id: id,
          agent_name: agentConfig.name,
          probability: prediction.probability,
          confidence: prediction.confidence,
          trade_size: tradeResult.quantity,
          reasoning: prediction.reasoning,
          sources_used: prediction.sourcesUsed,
        })
        .select()
        .single()

      if (predError) {
        console.error('Error saving prediction:', predError)
      } else {
        predictions.push(savedPrediction)
      }
    }

    // Update market with final state
    const finalProbability = getCurrentProbability(currentState)
    
    const { error: updateError } = await supabase
      .from('markets')
      .update({
        current_probability: finalProbability,
        yes_shares: currentState.yesShares,
        no_shares: currentState.noShares,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating market:', updateError)
    }

    // Save simulation run
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
      predictions,
      probabilityChange: {
        before: probabilityBefore,
        after: finalProbability,
      },
    })
  } catch (error) {
    console.error('Error in simulation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
