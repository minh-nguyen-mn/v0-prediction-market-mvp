export interface Market {
  id: string
  question_raw: string
  question_clean: string
  resolution_criteria: string
  category: string
  current_probability: number
  yes_shares: number
  no_shares: number
  liquidity_param: number
  created_by: string | null
  created_at: string
  expires_at: string
}

/**
 * ✅ FIXED: structured sources (critical upgrade)
 * - supports title + url
 * - enables clean UI rendering
 * - removes raw URL spam problem
 */
export interface Source {
  title: string
  url: string
}

export interface AgentPrediction {
  id: string
  market_id: string
  agent_name: string
  probability: number
  confidence: number
  trade_size: number
  reasoning: string

  /**
   * BEFORE: string[] ❌ (caused garbage UI + duplication)
   * AFTER: structured sources ✔
   */
  sources_used: Source[] | null

  created_at: string
}

export interface SimulationRun {
  id: string
  market_id: string
  probability_before: number
  probability_after: number
  created_at: string
}

export interface User {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  created_at: string
}

export interface CleanedQuestion {
  questionClean: string
  resolutionCriteria: string
  category: string
  expiresAt: string
}

export interface AgentConfig {
  name: string
  persona: string
  biases: string[]
  informationSources: string[]
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: 'Analyst Alpha',
    persona:
      'A quantitative analyst who builds probabilistic models using structured data, statistics, and historical trends.',
    biases: ['overconfidence in models', 'underweighting rare events'],
    informationSources: ['statistical datasets', 'historical trends', 'market signals'],
  },

  {
    name: 'Base Rate Betty',
    persona:
      'A strict base-rate thinker who heavily relies on historical frequencies and reference classes.',
    biases: ['anchoring bias', 'resistance to novel narratives'],
    informationSources: ['historical frequencies', 'archives', 'long-term datasets'],
  },

  {
    name: 'Market Maker Max',
    persona:
      'A pricing strategist who focuses on inefficiencies between market price and implied probability.',
    biases: ['over-optimization of short-term arbitrage'],
    informationSources: ['market odds', 'betting markets', 'liquidity signals'],
  },

  {
    name: 'Contrarian Charlie',
    persona:
      'A skeptical analyst who actively challenges consensus and searches for overlooked risks and failure modes.',
    biases: ['contrarian bias', 'overweighting tail risks'],
    informationSources: ['critical analysis', 'alternative viewpoints', 'failure case studies'],
  },

  {
    name: 'Information Hunter Iris',
    persona:
      'A real-time intelligence agent that prioritizes breaking news, updates, and rapidly changing information.',
    biases: ['recency bias', 'overreaction to news flow'],
    informationSources: ['breaking news', 'live updates', 'social media trends'],
  },
]