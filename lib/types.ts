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
  searchApproach: string
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: 'Quant Sigma',
    persona:
      'A rigorous quantitative forecaster focused on statistical inference, probabilities, prediction markets, and historical modeling.',
    biases: [
      'overconfidence in statistical regularities',
      'underweighting emotional narratives',
    ],
    informationSources: [
      'historical datasets',
      'prediction markets',
      'statistical models',
      'quantitative research',
    ],
    searchApproach:
      'Focus on statistics, probabilities, odds, quantitative forecasts, historical performance, and prediction market data.',
  },

  {
    name: 'Macro Maven',
    persona:
      'A macro and systems thinker who analyzes geopolitical, economic, institutional, and structural forces.',
    biases: [
      'macro-overgeneralization',
      'overweighting structural trends',
    ],
    informationSources: [
      'global news',
      'economic indicators',
      'institutional analysis',
      'geopolitical reporting',
    ],
    searchApproach:
      'Focus on macro trends, institutions, economic conditions, geopolitical dynamics, and large-scale structural drivers.',
  },

  {
    name: 'Contrarian Charlie',
    persona:
      'A skeptical contrarian who searches for hidden risks, failure modes, blind spots, and tail-risk scenarios.',
    biases: [
      'contrarian bias',
      'overweighting downside scenarios',
    ],
    informationSources: [
      'critical analysis',
      'alternative viewpoints',
      'failure cases',
      'risk discussions',
    ],
    searchApproach:
      'Focus on criticisms, downside risks, overlooked weaknesses, uncertainty, instability, and unexpected failure scenarios.',
  },

  {
    name: 'Base Rate Betty',
    persona:
      'A disciplined forecaster anchored heavily to historical base rates and long-run empirical frequencies.',
    biases: [
      'anchoring bias',
      'underweighting novel developments',
    ],
    informationSources: [
      'historical precedents',
      'reference classes',
      'long-run statistics',
      'empirical frequencies',
    ],
    searchApproach:
      'Focus on historical analogs, long-term precedent, base rates, empirical frequencies, and reference classes.',
  },

  {
    name: 'Signal Scout',
    persona:
      'A fast-moving information analyst focused on emerging signals, momentum, sentiment shifts, and recent developments.',
    biases: [
      'recency bias',
      'overreacting to new information',
    ],
    informationSources: [
      'breaking news',
      'recent updates',
      'social sentiment',
      'current events',
    ],
    searchApproach:
      'Focus on recent developments, emerging signals, breaking news, momentum shifts, and current sentiment.',
  },
]