import { nugenTwinChat } from './nugen/ensure'

export async function explainTwinNarrative(input: {
  title?: string
  rainfallMmH?: number
  temperatureC?: number
  floodIndex?: number
  stormHours?: number
  stressed?: string[]
  social?: string[]
  whatIf?: boolean
}): Promise<{ narrative: string; source: 'nugen' | 'local'; model?: string; stage?: 'aligned' | 'base'; confidence?: number }> {
  const local = [
    input.whatIf ? 'Counterfactual twin' : 'Live twin',
    `for ${input.title ?? 'this circuit'}:`,
    `${input.rainfallMmH ?? 0} mm/h rain, ${input.temperatureC ?? 0}°C, flood index ${Math.round(input.floodIndex ?? 0)}.`,
    input.stressed?.length
      ? `${input.stressed.slice(0, 3).join(', ')} absorb the first-order shock; indoor food and hotel occupancy take the cascade.`
      : 'The circuit stays inside its operating band.',
    input.social?.length ? `Public signals mention ${input.social.slice(0, 4).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  try {
    const result = await nugenTwinChat(
      JSON.stringify({
        task: 'Explain weather Digital Twin cascades for this TripFlow itinerary.',
        ...input,
      }),
    )
    return {
      narrative: result.content || local,
      source: 'nugen',
      model: result.model,
      stage: result.stage,
      confidence: result.confidence,
    }
  } catch {
    return { narrative: local, source: 'local' }
  }
}
