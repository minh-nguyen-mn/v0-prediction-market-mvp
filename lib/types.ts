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
 * =========================
 * SOURCE (FIXED + STRUCTURED)
 * =========================
 * Used by:
 * - agent_predictions table
 * - UI rendering
 * - simulation engine
 */
export interface Source {
  title: string
  url: string
}

/**
 * =========================
 * AGENT PREDICTION (FIXED CORE MODEL)
 * =========================
 * IMPORTANT FIXES:
 * - sourcesUsed is structured (NOT string[])
 * - fully UI-safe
 * - DB-safe (matches simulate route insert)
 */
export interface AgentPrediction {
  id: string
  market_id: string

  agent_name: string

  /**
   * probability ∈ [0,1]
   */
  probability: number

  /**
   * confidence ∈ [0,1]
   */
  confidence: number

  trade_size: number
  reasoning: string

  /**
   * FIXED:
   * structured + clickable sources
   */
  sourcesUsed: Source[] | null

  created_at: string
}

/**
 * =========================
 * SIMULATION RUN
 * =========================
 */
export interface SimulationRun {
  id: string
  market_id: string
  probability_before: number
  probability_after: number
  created_at: string
}

/**
 * =========================
 * USER
 * =========================
 */
export interface User {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  created_at: string
}

/**
 * =========================
 * MARKET CLEANING OUTPUT
 * =========================
 */
export interface CleanedQuestion {
  questionClean: string
  resolutionCriteria: string
  category: string
  expiresAt: string
}

/**
 * =========================
 * AGENT CONFIG
 * =========================
 */
export interface AgentConfig {
  name: string
  persona: string
  biases: string[]
  informationSources: string[]
}

/**
 * =========================
 * AGENTS (UPDATED SYSTEM)
 * =========================
 * FIXES:
 * - stronger differentiation
 * - clearer epistemic roles
 * - reduces “same-source behavior”
 */
export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: 'Analyst Alpha',
    persona:
      'A strict quantitative modeler who trusts structured datasets, probability theory, and regression-based inference.',
    biases: ['model overfitting', 'overconfidence in signals'],
    informationSources: [
      'statistical models',
      'historical datasets',
      'probabilistic forecasting',
    ],
  },

  {
    name: 'Base Rate Betty',
    persona:
      'A reference-class thinker who prioritizes long-run historical frequencies over situational narratives.',
    biases: ['anchoring to history', 'underreacting to new regimes'],
    informationSources: [
      'historical frequencies',
      'archives',
      'long-run averages',
    ],
  },

  {
    name: 'Market Maker Max',
    persona:
      'A pricing strategist focused on inefficiencies between market-implied probabilities and real-world likelihood.',
    biases: ['over-optimizing spreads', 'short-termism'],
    informationSources: [
      'betting markets',
      'odds comparison',
      'liquidity signals',
    ],
  },

  {
    name: 'Contrarian Charlie',
    persona:
      'A skeptical analyst who actively seeks hidden risks, failure modes, and consensus errors.',
    biases: ['overweight tail risks', 'negativity bias'],
    informationSources: [
      'counterarguments',
      'risk analysis',
      'historical upsets',
    ],
  },

  {
    name: 'Information Hunter Iris',
    persona:
      'A real-time intelligence analyst focused on breaking news, live updates, and rapidly evolving events.',
    biases: ['recency bias', 'overreaction to news flow'],
    informationSources: [
      'breaking news',
      'live feeds',
      'social signals',
    ],
  },
]