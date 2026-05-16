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

export interface AgentPrediction {
  id: string
  market_id: string
  agent_name: string
  probability: number
  confidence: number
  trade_size: number
  reasoning: string
  sources_used: string[] | null
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
    persona: 'A data-driven quantitative analyst who relies heavily on historical patterns and statistical models.',
    biases: ['overconfidence in quantitative methods', 'underweighting qualitative factors'],
    informationSources: ['historical data', 'statistical models', 'market trends'],
  },
  {
    name: 'Pundit Prime',
    persona: 'A seasoned political commentator with deep connections and insider knowledge.',
    biases: ['overweighting insider information', 'confirmation bias toward establishment views'],
    informationSources: ['insider sources', 'political networks', 'news analysis'],
  },
  {
    name: 'Contrarian Charlie',
    persona: 'A skeptical analyst who always looks for overlooked factors and contrarian views.',
    biases: ['contrarian bias', 'tendency to overweight tail risks'],
    informationSources: ['alternative media', 'minority opinions', 'historical upsets'],
  },
  {
    name: 'Base Rate Betty',
    persona: 'A methodical analyst who anchors strongly to base rates and reference classes.',
    biases: ['anchoring to base rates', 'underweighting unique circumstances'],
    informationSources: ['reference classes', 'historical base rates', 'statistical averages'],
  },
  {
    name: 'News Ninja',
    persona: 'A real-time information aggregator who weights recent news heavily.',
    biases: ['recency bias', 'overreaction to news'],
    informationSources: ['breaking news', 'social media trends', 'real-time data'],
  },
]
