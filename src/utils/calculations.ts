import type { Shift, TaxBreakdown } from '../types'

export const FICA_RATE = 0.0765
export const GA_STATE_RATE = 0.0539
export const FEDERAL_STD_DEDUCTION = 14600
export const PAY_PERIODS_PER_YEAR = 52

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

export function estimateTaxes(
  grossPay: number,
  savingsRate: number,
  isDependent = false,
  annualGross = grossPay * PAY_PERIODS_PER_YEAR,
): TaxBreakdown {
  if (grossPay <= 0) {
    return { grossPay: 0, otPay: 0, otHours: 0, federalTax: 0, stateTax: 0, ficaTax: 0, savingsDeduction: 0, netPay: 0 }
  }
  const ficaTax = grossPay * FICA_RATE
  const savingsDeduction = grossPay * savingsRate
  if (isDependent) {
    return {
      grossPay,
      otPay: 0,
      otHours: 0,
      federalTax: 0,
      stateTax: 0,
      ficaTax,
      savingsDeduction,
      netPay: Math.max(0, grossPay - ficaTax - savingsDeduction),
    }
  }
  const fedRate = federalEffectiveRate(annualGross)
  const federalTax = grossPay * fedRate
  const stateTaxable = Math.max(0, annualGross - FEDERAL_STD_DEDUCTION)
  const stateRate = annualGross > 0 ? (stateTaxable / annualGross) * GA_STATE_RATE : 0
  const stateTax = grossPay * stateRate
  return {
    grossPay,
    otPay: 0,
    otHours: 0,
    federalTax,
    stateTax,
    ficaTax,
    savingsDeduction,
    netPay: Math.max(0, grossPay - federalTax - stateTax - ficaTax - savingsDeduction),
  }
}

// Weekly gross accounting for 1.5x overtime on hours above 40.
export function computeWeeklyBreakdown(
  weekShifts: Shift[],
  hourlyRate: number,
  savingsRate: number,
  isDependent = false,
): TaxBreakdown {
  const totalHours = sumHours(weekShifts)
  const regularHours = Math.min(40, totalHours)
  const otHours = Math.max(0, totalHours - 40)
  const grossPay = regularHours * hourlyRate + otHours * hourlyRate * 1.5
  const base = estimateTaxes(grossPay, savingsRate, isDependent)
  return { ...base, grossPay, otPay: otHours * hourlyRate * 1.5, otHours }
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
