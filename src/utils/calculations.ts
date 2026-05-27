import type { Shift, TaxBreakdown } from '../types'

// 2024-ish estimates. These are withholding ESTIMATES, not tax advice.
export const FICA_RATE = 0.0765 // Social Security 6.2% + Medicare 1.45%
export const GA_STATE_RATE = 0.0539 // Georgia flat income tax
export const FEDERAL_STD_DEDUCTION = 14600 // single filer
export const PAY_PERIODS_PER_YEAR = 52 // weekly pay period assumption

// Compute decimal hours worked from start/end (HH:MM) minus unpaid break.
export function computeHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60 // overnight shift
  mins -= breakMinutes
  return Math.max(0, mins / 60)
}

// Progressive 2024 single-filer federal brackets (effective rate on annual gross).
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

// Estimate the full breakdown for a single paycheck.
// isDependent: when true, skips income tax (only FICA applies — common for teen/dependent workers).
export function estimateTaxes(
  grossPay: number,
  savingsRate: number,
  isDependent = false,
  annualGross = grossPay * PAY_PERIODS_PER_YEAR,
): TaxBreakdown {
  if (grossPay <= 0) {
    return {
      grossPay: 0,
      federalTax: 0,
      stateTax: 0,
      ficaTax: 0,
      savingsDeduction: 0,
      netPay: 0,
    }
  }

  const ficaTax = grossPay * FICA_RATE
  const savingsDeduction = grossPay * savingsRate

  if (isDependent) {
    return {
      grossPay,
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
    federalTax,
    stateTax,
    ficaTax,
    savingsDeduction,
    netPay: Math.max(0, grossPay - federalTax - stateTax - ficaTax - savingsDeduction),
  }
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay() // 0 = Sunday
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
