import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
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

    // Get predictions for this market
    const { data: predictions, error: predError } = await supabase
      .from('agent_predictions')
      .select('*')
      .eq('market_id', id)
      .order('created_at', { ascending: true })

    if (predError) {
      console.error('Error fetching predictions:', predError)
    }

    // Get simulation runs
    const { data: simulationRuns, error: simError } = await supabase
      .from('simulation_runs')
      .select('*')
      .eq('market_id', id)
      .order('created_at', { ascending: true })

    if (simError) {
      console.error('Error fetching simulation runs:', simError)
    }

    return NextResponse.json({
      market,
      predictions: predictions || [],
      simulationRuns: simulationRuns || [],
    })
  } catch (error) {
    console.error('Error fetching market:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
