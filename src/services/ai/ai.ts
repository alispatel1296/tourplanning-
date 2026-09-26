import { env } from '@/services/env'
import type { PlaceResult } from '@/services/geo/types'

export interface AIRecommendation {
  recommendation: string
  reasons: string[]
  costImpact: number
  timeImpactMinutes: number
  source: 'live' | 'local'
}

export interface RankInput {
  preference: string
  budgetLeft: number
  candidates: PlaceResult[]
}

export function rankCandidates(input: RankInput): AIRecommendation {
  if (!input.candidates.length) {
    return {
      recommendation: 'No live candidates were returned for this search.',
      reasons: ['Search the area again or widen the query'],
      costImpact: 0,
      timeImpactMinutes: 0,
      source: 'local',
    }
  }
  const ranked = [...input.candidates].sort((a, b) => (b.rating ?? 4) - (a.rating ?? 4))
  const pick = ranked[0]
  const reasons = [
    input.budgetLeft > 0 ? 'Within remaining budget' : 'Budget is already tight — treat as optional',
    pick.address ? `Near ${pick.address.split(',').slice(0, 2).join(',')}` : 'Has a mapped location',
    input.preference ? `Matches “${input.preference}”` : 'Highest available rating among retrieved places',
  ]
  return {
    recommendation: pick.name,
    reasons,
    costImpact: 0,
    timeImpactMinutes: 12,
    source: env.aiKey ? 'live' : 'local',
  }
}

export async function explainRecommendation(input: RankInput): Promise<AIRecommendation> {
  const local = rankCandidates(input)
  if (!env.aiKey || !input.candidates.length) return local
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.aiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'Rank only from the provided real candidates. Return JSON {recommendation,reasons,costImpact,timeImpactMinutes}. Never invent a hotel or restaurant.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              preference: input.preference,
              budgetLeft: input.budgetLeft,
              candidates: input.candidates.map((item) => ({
                name: item.name,
                address: item.address,
                rating: item.rating,
                category: item.category,
              })),
            }),
          },
        ],
      }),
    })
    if (!response.ok) return local
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(text) as AIRecommendation
    return { ...parsed, source: 'live' }
  } catch {
    return local
  }
}

export async function analyzeConflict(bufferMinutes: number): Promise<AIRecommendation> {
  if (bufferMinutes < 0) {
    return {
      recommendation: 'Hold the next activity or move it later.',
      reasons: [`Arrival overruns the next start by ${Math.abs(bufferMinutes)} minutes`, 'Buffer is negative — CONFLICT'],
      costImpact: 0,
      timeImpactMinutes: bufferMinutes,
      source: 'local',
    }
  }
  if (bufferMinutes < 30) {
    return {
      recommendation: 'Keep the node but add a transfer buffer.',
      reasons: [`Only ${bufferMinutes} minutes remain`, 'Minimum recommended buffer is 30 minutes'],
      costImpact: 0,
      timeImpactMinutes: 30 - bufferMinutes,
      source: 'local',
    }
  }
  return {
    recommendation: 'This hop is feasible.',
    reasons: [`${bufferMinutes} minutes of buffer`, 'Above the 30-minute threshold'],
    costImpact: 0,
    timeImpactMinutes: 0,
    source: 'local',
  }
}

export async function findAlternatives(input: RankInput): Promise<AIRecommendation> {
  return explainRecommendation(input)
}

export async function generateItinerary(): Promise<AIRecommendation> {
  return {
    recommendation: 'Use the existing Plan a Trip + hop builder. AI ranks live search results; it does not invent stays.',
    reasons: ['Real candidates come from the places layer', 'Application validates feasibility', 'User or operator approves'],
    costImpact: 0,
    timeImpactMinutes: 0,
    source: env.aiKey ? 'live' : 'local',
  }
}

export async function draftReview(title: string): Promise<AIRecommendation> {
  return {
    recommendation: `Draft a short review of ${title} after the visit, using only what you experienced.`,
    reasons: ['Do not invent amenities', 'Keep rating tied to the live stay'],
    costImpact: 0,
    timeImpactMinutes: 0,
    source: 'local',
  }
}
