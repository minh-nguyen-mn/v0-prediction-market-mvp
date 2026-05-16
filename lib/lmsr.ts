/**
 * Logarithmic Market Scoring Rule (LMSR) implementation
 * Based on Hanson's market maker algorithm
 */

export interface MarketState {
  yesShares: number
  noShares: number
  liquidityParam: number // b parameter
}

export interface TradeResult {
  cost: number
  newProbability: number
  newYesShares: number
  newNoShares: number
}

/**
 * Calculate the cost function C(q) = b * ln(e^(q_yes/b) + e^(q_no/b))
 */
export function costFunction(state: MarketState): number {
  const { yesShares, noShares, liquidityParam: b } = state
  return b * Math.log(Math.exp(yesShares / b) + Math.exp(noShares / b))
}

/**
 * Calculate the current probability of YES outcome
 * P(yes) = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
 */
export function getCurrentProbability(state: MarketState): number {
  const { yesShares, noShares, liquidityParam: b } = state
  const expYes = Math.exp(yesShares / b)
  const expNo = Math.exp(noShares / b)
  return expYes / (expYes + expNo)
}

/**
 * Calculate the cost to buy a certain number of shares
 * Cost = C(new_state) - C(old_state)
 */
export function calculateTradeCost(
  state: MarketState,
  shareType: 'yes' | 'no',
  quantity: number
): TradeResult {
  const oldCost = costFunction(state)
  
  const newState: MarketState = {
    ...state,
    yesShares: shareType === 'yes' ? state.yesShares + quantity : state.yesShares,
    noShares: shareType === 'no' ? state.noShares + quantity : state.noShares,
  }
  
  const newCost = costFunction(newState)
  const cost = newCost - oldCost
  
  return {
    cost,
    newProbability: getCurrentProbability(newState),
    newYesShares: newState.yesShares,
    newNoShares: newState.noShares,
  }
}

/**
 * Calculate the number of shares needed to move the market to a target probability
 */
export function calculateSharesForTargetProbability(
  state: MarketState,
  targetProbability: number
): { shareType: 'yes' | 'no'; quantity: number; cost: number } {
  const currentProb = getCurrentProbability(state)
  const { yesShares, noShares, liquidityParam: b } = state
  
  // P(yes) = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
  // Solving for q_yes given target P and q_no:
  // q_yes = b * ln(P * e^(q_no/b) / (1 - P))
  
  if (targetProbability >= 1) targetProbability = 0.9999
  if (targetProbability <= 0) targetProbability = 0.0001
  
  if (targetProbability > currentProb) {
    // Need to buy YES shares
    const targetYesShares = b * Math.log(
      (targetProbability * Math.exp(noShares / b)) / (1 - targetProbability)
    )
    const quantity = targetYesShares - yesShares
    const result = calculateTradeCost(state, 'yes', quantity)
    return { shareType: 'yes', quantity, cost: result.cost }
  } else {
    // Need to buy NO shares
    const targetNoShares = b * Math.log(
      ((1 - targetProbability) * Math.exp(yesShares / b)) / targetProbability
    )
    const quantity = targetNoShares - noShares
    const result = calculateTradeCost(state, 'no', quantity)
    return { shareType: 'no', quantity, cost: result.cost }
  }
}

/**
 * Execute a trade based on confidence and probability estimate
 * Agents with higher confidence make larger trades
 */
export function executeAgentTrade(
  state: MarketState,
  agentProbability: number,
  confidence: number, // 0-1
  maxTradeSize: number = 10
): TradeResult & { shareType: 'yes' | 'no'; quantity: number } {
  const currentProb = getCurrentProbability(state)
  const probDiff = Math.abs(agentProbability - currentProb)
  
  // Trade size proportional to confidence and probability difference
  const tradeIntensity = confidence * probDiff * maxTradeSize
  const quantity = Math.max(1, Math.round(tradeIntensity))
  
  const shareType = agentProbability > currentProb ? 'yes' : 'no'
  const result = calculateTradeCost(state, shareType, quantity)
  
  return {
    ...result,
    shareType,
    quantity,
  }
}
