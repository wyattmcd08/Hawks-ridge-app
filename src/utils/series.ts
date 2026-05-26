import type { Shift } from '../types'

export interface Point {
  label: string
  value: number
  hours?: number
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
