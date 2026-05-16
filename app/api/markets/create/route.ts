import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { openai, anthropic } from '@ai-sdk/openai'

/* =========================
   MODEL RESOLVER (SAFE)
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
   FLEXIBLE SCHEMA
========================= */
const cleanedQuestionSchema = z.object({
  questionClean: z.string(),
  resolutionCriteria: z.string(),

  // ❗ IMPORTANT FIX: remove enum restriction
  category: z.string(),

  expiresAt: z.string(),
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

    /* =========================
       LLM CLEANING STEP
    ========================= */
    const { object: cleanedData } = await generateObject({
      model: getModel(),
      schema: cleanedQuestionSchema,
      prompt: `
You are a prediction market structuring system.

Transform the raw user question into a clean structured market.

Rules:
1. Make the question clear and binary or resolvable
2. Define explicit resolution criteria
3. Assign a simple category label (freeform, not restricted)
4. Suggest a realistic expiration date

Raw question:
"${questionRaw}"

Today is:
${new Date().toISOString().split('T')[0]}

Return structured output.
`,
    })

    /* =========================
       DATABASE INSERT
    ========================= */
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
      console.error('DB insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create market' },
        { status: 500 }
      )
    }

    return NextResponse.json({ market })
  } catch (error) {
    console.error('Market creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}