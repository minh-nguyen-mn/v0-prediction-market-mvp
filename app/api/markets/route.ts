import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: markets, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching markets:', error)
      return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 })
    }

    return NextResponse.json({ markets })
  } catch (error) {
    console.error('Error in markets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
