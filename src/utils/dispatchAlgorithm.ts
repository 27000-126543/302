import type { Granary, Order } from '@/types'
import { PRODUCT_LEVEL_MAP } from '@/utils/constants'

export function findBestGranaryForInbound(
  granaries: Granary[],
  product: string,
  qualityLevel: string
): Granary | null {
  const qualityToLevel: Record<string, string> = {
    '一等': 'quasi_low_temp',
    '二等': 'normal',
    '三等': 'normal',
    '等外': 'normal',
  }
  const requiredLevel = qualityToLevel[qualityLevel] || 'normal'
  const levelPriority = ['quasi_low_temp', 'low_temp', 'normal']

  let candidates = granaries.filter(g => {
    if (g.fumigating) return false
    const remaining = g.capacity - g.stock
    if (remaining <= 0) return false
    return true
  })

  const preferredLevel = requiredLevel
  const preferredCandidates = candidates.filter(g => g.level === preferredLevel)
  if (preferredCandidates.length > 0) {
    candidates = preferredCandidates
  }

  candidates.sort((a, b) => {
    const aMatch = a.level === preferredLevel ? 0 : 1
    const bMatch = b.level === preferredLevel ? 0 : 1
    if (aMatch !== bMatch) return aMatch - bMatch
    const aRemaining = a.capacity - a.stock
    const bRemaining = b.capacity - b.stock
    return bRemaining - aRemaining
  })

  return candidates[0] || null
}

export function findBestGranaryForOutbound(
  granaries: Granary[],
  product: string,
  quantity: number
): Granary | null {
  const candidates = granaries.filter(g => {
    if (g.product !== product) return false
    if (g.stock < quantity) return false
    if (g.fumigating) return false
    return true
  })

  candidates.sort((a, b) => {
    const aDist = Math.abs(a.position[0]) + Math.abs(a.position[2])
    const bDist = Math.abs(b.position[0]) + Math.abs(b.position[2])
    return aDist - bDist
  })

  return candidates[0] || null
}

export function generateInboundPath(
  from: [number, number, number],
  to: [number, number, number]
): [number, number, number][] {
  const midY = 3
  return [
    from,
    [from[0], midY, from[2]],
    [to[0], midY, from[2]],
    [to[0], midY, to[2]],
    [to[0], to[1] + 2, to[2]],
  ]
}

export function generateOutboundPath(
  from: [number, number, number],
  to: [number, number, number]
): [number, number, number][] {
  const midY = 3
  return [
    [from[0], from[1] + 2, from[2]],
    [from[0], midY, from[2]],
    [to[0], midY, to[2]],
    [to[0], midY, to[2]],
    to,
  ]
}
