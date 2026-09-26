import type { Trip, TripNode } from '@/types'

export interface LineItem {
  nodeId: string
  title: string
  basePrice: number
  quantity: number
  tax: number
  fees: number
  discount: number
  currency: 'INR'
}

export interface TripCost {
  items: LineItem[]
  subtotal: number
  tax: number
  fees: number
  discount: number
  total: number
  remaining: number
  currency: 'INR'
}

export interface BudgetHealthResult {
  usedPct: number
  remaining: number
  tone: 'success' | 'warning' | 'danger'
  label: 'Healthy' | 'Tight' | 'Over'
}

export interface SpendPrediction {
  estimatedFinal: number
  remaining: number
  explanation: string
}

function lineFor(node: TripNode, costOf: (node: TripNode) => number): LineItem {
  const base = costOf(node)
  const tax = Math.round(base * 0.05)
  return {
    nodeId: node.id,
    title: node.title,
    basePrice: base,
    quantity: 1,
    tax,
    fees: 0,
    discount: 0,
    currency: 'INR',
  }
}

export function calculateTripCost(trip: Trip, costOf: (node: TripNode) => number = (node) => node.cost): TripCost {
  const items = trip.nodes.filter((node) => node.status !== 'disrupted').map((node) => lineFor(node, costOf))
  const subtotal = items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0)
  const tax = items.reduce((sum, item) => sum + item.tax, 0)
  const fees = items.reduce((sum, item) => sum + item.fees, 0)
  const discount = items.reduce((sum, item) => sum + item.discount, 0)
  const total = subtotal + tax + fees - discount
  return {
    items,
    subtotal,
    tax,
    fees,
    discount,
    total,
    remaining: trip.budget - total,
    currency: 'INR',
  }
}

export function calculateBudgetHealth(budget: number, planned: number): BudgetHealthResult {
  const usedPct = budget <= 0 ? 0 : Math.round((planned / budget) * 100)
  const remaining = budget - planned
  if (usedPct >= 100) return { usedPct, remaining, tone: 'danger', label: 'Over' }
  if (usedPct >= 90) return { usedPct, remaining, tone: 'warning', label: 'Tight' }
  return { usedPct, remaining, tone: 'success', label: 'Healthy' }
}

export function predictFinalSpend(budget: number, planned: number, daysElapsed = 3, totalDays = 7): SpendPrediction {
  const pace = daysElapsed > 0 ? planned / Math.max(daysElapsed, 1) : planned
  const estimated = Math.round(Math.min(budget * 1.08, planned + pace * Math.max(totalDays - daysElapsed, 0) * 0.15))
  const remaining = budget - planned
  const explanation =
    remaining >= 0
      ? `Based on your current daily spending pattern, estimated final spend is near this figure and ${remaining.toLocaleString('en-IN')} remains unallocated.`
      : 'Current planned spend already exceeds the trip budget.'
  return { estimatedFinal: estimated, remaining, explanation }
}
