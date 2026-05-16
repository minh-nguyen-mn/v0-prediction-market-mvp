import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const cleanedQuestionSchema = z.object({
  questionClean: z.string().describe('A clear, unambiguous version of the prediction question'),
  resolutionCriteria: z.string().describe('Specific criteria for how this market will be resolved'),
  category: z.enum(['politics', 'economics', 'technology', 'sports', 'entertainment', 'science', 'other']),
  expiresAt: z.string().describe('ISO date string for when this market should expire'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionRaw } = await request.json()

    if (!questionRaw || typeof questionRaw !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Use LLM to clean and structure the question
    const { object: cleanedData } = await generateObject({
      model: 'anthropic/claude-sonnet-4-20250514',
      schema: cleanedQuestionSchema,
      prompt: `You are processing a prediction market question. Take the raw question and:
1. Clean it up to be clear, specific, and unambiguous
2. Define specific resolution criteria
3. Categorize it
4. Suggest an appropriate expiration date

Raw question: "${questionRaw}"

Today's date is ${new Date().toISOString().split('T')[0]}.
Set expiration date based on when this event would reasonably be resolved.`,
    })

    // Create the market in the database
    const { data: market, error: insertError } = await supabase
      .from('markets')
      .insert({
        question_raw: questionRaw,
        question_clean: cleanedData.questionClean,
        resolution_criteria: cleanedData.resolutionCriteria,
        category: cleanedData.category,
        current_probability: 0.5,
        yes_shares: 0,
        no_shares: 0,
        liquidity_param: 100,
        created_by: user.id,
        expires_at: cleanedData.expiresAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating market:', insertError)
      return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
    }

    return NextResponse.json({ market })
  } catch (error) {
    console.error('Error in market creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
