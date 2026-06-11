import type { Shift } from '../types'
import {
  computeBiweeklyBreakdown,
  getPayPeriodBounds,
  resolveNextPayday,
  shiftsInRange,
  addDays,
  startOfWeek,
  sumGross,
  sumHours,
  type PaySettings,
} from './calculations'

export interface Point {
  label: string
  value: number
  hours?: number
  net?: number
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Earnings (gross) per day for the last `days` days, including empty days.
export function dailySeries(shifts: Shift[], days = 7): Point[] {
  const map = new Map<string, { value: number; hours: number }>()
  for (const s of shifts) {
    const cur = map.get(s.date) ?? { value: 0, hours: 0 }
    cur.value += s.grossPay
    cur.hours += s.hoursWorked
    map.set(s.date, cur)
  }
  const out: Point[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    const hit = map.get(key)
    out.push({
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      value: hit?.value ?? 0,
      hours: hit?.hours ?? 0,
    })
  }
  return out
}

// Earnings per ISO week for the last `weeks` weeks.
export function weeklySeries(shifts: Shift[], weeks = 6): Point[] {
  const out: Point[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const ref = new Date()
    ref.setDate(ref.getDate() - i * 7)
    const day = ref.getDay()
    const sow = new Date(ref)
    sow.setHours(0, 0, 0, 0)
    sow.setDate(sow.getDate() - day)
    const eow = new Date(sow)
    eow.setDate(eow.getDate() + 7)
    let value = 0
    let hours = 0
    for (const s of shifts) {
      const d = new Date(s.date + 'T00:00:00')
      if (d >= sow && d < eow) {
        value += s.grossPay
        hours += s.hoursWorked
      }
    }
    out.push({
      label: sow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value,
      hours,
    })
  }
  return out
}

// Earnings per month for the last `months` months.
export function monthlySeries(shifts: Shift[], months = 6): Point[] {
  const out: Point[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1)
    let value = 0
    let hours = 0
    for (const s of shifts) {
      const d = new Date(s.date + 'T00:00:00')
      if (d >= m && d < next) {
        value += s.grossPay
        hours += s.hoursWorked
      }
    }
    out.push({
      label: m.toLocaleDateString('en-US', { month: 'short' }),
      value,
      hours,
    })
  }
  return out
}

// Cumulative savings growth over the last `weeks` weeks.
export function savingsGrowth(
  shifts: Shift[],
  savingsRate: number,
  weeks = 8,
): Point[] {
  const weekly = weeklySeries(shifts, weeks)
  let cum = 0
  return weekly.map((p) => {
    cum += p.value * savingsRate
    return { label: p.label, value: cum }
  })
}

// Gross + net earnings per biweekly pay period, oldest → newest (current period last).
export function payPeriodSeries(
  shifts: Shift[],
  settings: PaySettings & { nextPayday: string },
  periods = 6,
): Point[] {
  const payday = resolveNextPayday(settings.nextPayday)
  const out: Point[] = []
  for (let back = periods - 1; back >= 0; back--) {
    const b = getPayPeriodBounds(payday, back)
    const w1 = shiftsInRange(shifts, b.start, b.week1End)
    const w2 = shiftsInRange(shifts, addDays(b.week1End, 1), b.end)
    const bd = computeBiweeklyBreakdown(w1, w2, settings)
    out.push({
      label: new Date(b.payday + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: bd.grossPay,
      net: bd.netPay,
      hours: sumHours(w1) + sumHours(w2),
    })
  }
  return out
}

// Share of lifetime earnings by day of week (for pie charts). Empty days omitted.
export function weekdayShare(shifts: Shift[]): { name: string; value: number }[] {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const totals = new Array(7).fill(0)
  for (const s of shifts) {
    totals[new Date(s.date + 'T00:00:00').getDay()] += s.grossPay
  }
  return names
    .map((name, i) => ({ name, value: totals[i] }))
    .filter((d) => d.value > 0)
}

// Highest-grossing calendar week across all stored shifts.
export function bestWeek(shifts: Shift[]): { label: string; value: number; hours: number } | null {
  const map = new Map<string, { value: number; hours: number }>()
  for (const s of shifts) {
    const sow = startOfWeek(new Date(s.date + 'T00:00:00'))
    const key = sow.toISOString().slice(0, 10)
    const cur = map.get(key) ?? { value: 0, hours: 0 }
    cur.value += s.grossPay
    cur.hours += s.hoursWorked
    map.set(key, cur)
  }
  let best: { label: string; value: number; hours: number } | null = null
  for (const [key, v] of map) {
    if (!best || v.value > best.value) {
      const d = new Date(key + 'T00:00:00')
      best = {
        label: `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        ...v,
      }
    }
  }
  return best
}

// Every month with activity, highest earnings first.
export function monthlyRecords(
  shifts: Shift[],
): { label: string; value: number; hours: number; count: number }[] {
  const map = new Map<string, { value: number; hours: number; count: number }>()
  for (const s of shifts) {
    const key = s.date.slice(0, 7)
    const cur = map.get(key) ?? { value: 0, hours: 0, count: 0 }
    cur.value += s.grossPay
    cur.hours += s.hoursWorked
    cur.count += 1
    map.set(key, cur)
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      label: new Date(key + '-01T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      ...v,
    }))
    .sort((a, b) => b.value - a.value)
}

// Gross earnings since Jan 1 of the current year.
export function yearToDateGross(shifts: Shift[]): number {
  const year = String(new Date().getFullYear())
  return sumGross(shifts.filter((s) => s.date.startsWith(year)))
}
