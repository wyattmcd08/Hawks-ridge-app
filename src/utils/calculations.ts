import type { Shift, TaxBreakdown, BiweeklyBreakdown, Settings } from '../types'

export const FICA_RATE = 0.0765
export const GA_STATE_RATE = 0.0539
export const FEDERAL_STD_DEDUCTION = 14600
export const PAY_PERIODS_PER_YEAR = 52
export const BIWEEKLY_PAY_PERIODS_PER_YEAR = 26

/** Settings fields needed for pay math — the full Settings object always satisfies this. */
export type PaySettings = Pick<
  Settings,
  'hourlyRate' | 'savingsRate' | 'taxMode' | 'customTaxRate' | 'otEnabled' | 'otThreshold' | 'otMultiplier'
>

export function computeHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  mins -= breakMinutes
  return Math.max(0, mins / 60)
}

function federalEffectiveRate(annualGross: number): number {
  const taxable = Math.max(0, annualGross - FEDERAL_STD_DEDUCTION)
  if (taxable <= 0) return 0
  const brackets = [
    { upTo: 11600, rate: 0.1 },
    { upTo: 47150, rate: 0.12 },
    { upTo: 100525, rate: 0.22 },
    { upTo: Infinity, rate: 0.24 },
  ]
  let tax = 0
  let prev = 0
  for (const b of brackets) {
    if (taxable > prev) {
      tax += (Math.min(taxable, b.upTo) - prev) * b.rate
      prev = b.upTo
    } else break
  }
  return tax / annualGross
}

const EMPTY_BREAKDOWN: TaxBreakdown = {
  grossPay: 0, otPay: 0, otHours: 0, federalTax: 0, stateTax: 0, ficaTax: 0, savingsDeduction: 0, netPay: 0,
}

export function estimateTaxes(
  grossPay: number,
  settings: PaySettings,
  annualGross = grossPay * PAY_PERIODS_PER_YEAR,
): TaxBreakdown {
  if (grossPay <= 0) return { ...EMPTY_BREAKDOWN }
  const savingsDeduction = grossPay * settings.savingsRate
  if (settings.taxMode === 'custom') {
    const federalTax = grossPay * Math.max(0, settings.customTaxRate)
    return {
      grossPay, otPay: 0, otHours: 0, federalTax, stateTax: 0, ficaTax: 0, savingsDeduction,
      netPay: Math.max(0, grossPay - federalTax - savingsDeduction),
    }
  }
  const ficaTax = grossPay * FICA_RATE
  if (settings.taxMode === 'dependent') {
    return {
      grossPay, otPay: 0, otHours: 0, federalTax: 0, stateTax: 0,
      ficaTax, savingsDeduction,
      netPay: Math.max(0, grossPay - ficaTax - savingsDeduction),
    }
  }
  const fedRate = federalEffectiveRate(annualGross)
  const federalTax = grossPay * fedRate
  const stateTaxable = Math.max(0, annualGross - FEDERAL_STD_DEDUCTION)
  const stateRate = annualGross > 0 ? (stateTaxable / annualGross) * GA_STATE_RATE : 0
  const stateTax = grossPay * stateRate
  return {
    grossPay, otPay: 0, otHours: 0, federalTax, stateTax, ficaTax, savingsDeduction,
    netPay: Math.max(0, grossPay - federalTax - stateTax - ficaTax - savingsDeduction),
  }
}

export function computeWeeklyBreakdown(
  weekShifts: Shift[],
  settings: PaySettings,
): TaxBreakdown {
  const totalHours = sumHours(weekShifts)
  const threshold = settings.otEnabled ? settings.otThreshold : Infinity
  const regularHours = Math.min(threshold, totalHours)
  const otHours = Math.max(0, totalHours - regularHours)
  const otPay = otHours * settings.hourlyRate * settings.otMultiplier
  const grossPay = regularHours * settings.hourlyRate + otPay
  const base = estimateTaxes(grossPay, settings)
  return { ...base, grossPay, otPay, otHours }
}

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayLocalISO(): string {
  return localISO(new Date())
}

/**
 * Rolls the anchor payday forward in 14-day steps so the "next payday"
 * is always today or in the future — future pay periods continue
 * automatically every 2 weeks after the configured anchor.
 */
export function resolveNextPayday(anchorPayday: string, todayStr = todayLocalISO()): string {
  const d = new Date(anchorPayday + 'T00:00:00')
  const today = new Date(todayStr + 'T00:00:00')
  while (d < today) d.setDate(d.getDate() + 14)
  return localISO(d)
}

export interface PayPeriodBounds {
  start: string
  end: string
  payday: string
  week1End: string
}

export function getPayPeriodBounds(nextPayday: string, periodsBack = 0): PayPeriodBounds {
  const paydayDate = new Date(nextPayday + 'T00:00:00')
  paydayDate.setDate(paydayDate.getDate() - periodsBack * 14)

  const end = new Date(paydayDate)
  end.setDate(end.getDate() - 1)

  const start = new Date(end)
  start.setDate(start.getDate() - 13)

  const week1End = new Date(start)
  week1End.setDate(week1End.getDate() + 6)

  return {
    start: localISO(start),
    end: localISO(end),
    payday: localISO(paydayDate),
    week1End: localISO(week1End),
  }
}

export interface CurrentPayPeriod extends PayPeriodBounds {
  /** 1-based day index within the 14-day period, clamped to [0, 14] */
  dayInPeriod: number
  /** 0..1 completion of the period */
  progress: number
  daysUntilPayday: number
}

/** The pay period containing today, with countdown + progress, rolling forward automatically. */
export function getCurrentPayPeriod(anchorPayday: string): CurrentPayPeriod {
  const payday = resolveNextPayday(anchorPayday)
  const bounds = getPayPeriodBounds(payday)
  const today = new Date(todayLocalISO() + 'T00:00:00')
  const start = new Date(bounds.start + 'T00:00:00')
  const paydayDate = new Date(payday + 'T00:00:00')
  const dayInPeriod = Math.min(
    14,
    Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000) + 1),
  )
  const daysUntilPayday = Math.max(0, Math.round((paydayDate.getTime() - today.getTime()) / 86400000))
  return { ...bounds, dayInPeriod, progress: dayInPeriod / 14, daysUntilPayday }
}

export function shiftsInRange(shifts: Shift[], start: string, end: string): Shift[] {
  return shifts.filter((s) => s.date >= start && s.date <= end)
}

export function computeBiweeklyBreakdown(
  week1Shifts: Shift[],
  week2Shifts: Shift[],
  settings: PaySettings,
): BiweeklyBreakdown {
  const week1 = computeWeeklyBreakdown(week1Shifts, settings)
  const week2 = computeWeeklyBreakdown(week2Shifts, settings)
  const biweeklyGross = week1.grossPay + week2.grossPay
  const base = estimateTaxes(
    biweeklyGross,
    settings,
    biweeklyGross * BIWEEKLY_PAY_PERIODS_PER_YEAR,
  )
  return {
    grossPay: biweeklyGross,
    otPay: week1.otPay + week2.otPay,
    otHours: week1.otHours + week2.otHours,
    federalTax: base.federalTax,
    stateTax: base.stateTax,
    ficaTax: base.ficaTax,
    savingsDeduction: base.savingsDeduction,
    netPay: base.netPay,
    week1,
    week2,
  }
}

/** Full breakdown for the pay period containing today. */
export function computeCurrentPeriodBreakdown(
  shifts: Shift[],
  settings: PaySettings & { nextPayday: string },
): { period: CurrentPayPeriod; breakdown: BiweeklyBreakdown; periodShifts: Shift[] } {
  const period = getCurrentPayPeriod(settings.nextPayday)
  const week2Start = addDays(period.week1End, 1)
  const week1 = shiftsInRange(shifts, period.start, period.week1End)
  const week2 = shiftsInRange(shifts, week2Start, period.end)
  return {
    period,
    breakdown: computeBiweeklyBreakdown(week1, week2, settings),
    periodShifts: [...week1, ...week2],
  }
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return localISO(d)
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day)
  return date
}

export function isSameWeek(dateStr: string, ref: Date): boolean {
  const sow = startOfWeek(ref)
  const eow = new Date(sow)
  eow.setDate(eow.getDate() + 7)
  const d = new Date(dateStr + 'T00:00:00')
  return d >= sow && d < eow
}

export function shiftsInWeek(shifts: Shift[], ref: Date): Shift[] {
  return shifts.filter((s) => isSameWeek(s.date, ref))
}

export function sumGross(shifts: Shift[]): number {
  return shifts.reduce((acc, s) => acc + s.grossPay, 0)
}

export function sumHours(shifts: Shift[]): number {
  return shifts.reduce((acc, s) => acc + s.hoursWorked, 0)
}
