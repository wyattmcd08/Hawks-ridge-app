export interface Shift {
  id: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  breakMinutes: number
  hourlyRate: number
  notes: string
  hoursWorked: number
  grossPay: number
}

export interface Goal {
  id: string
  name: string
  emoji: string
  targetAmount: number
  currentAmount: number
  color: string
  createdAt: string
  deadline?: string
}

export type TaxMode = 'dependent' | 'standard' | 'custom'

export interface Settings {
  hourlyRate: number
  savingsRate: number
  defaultStartTime: string
  name: string
  /** dependent: FICA only · standard: estimated fed + GA + FICA · custom: flat % */
  taxMode: TaxMode
  /** flat withholding fraction used when taxMode === 'custom' (e.g. 0.12) */
  customTaxRate: number
  otEnabled: boolean
  /** weekly hours before overtime kicks in */
  otThreshold: number
  /** overtime pay multiplier (e.g. 1.5) */
  otMultiplier: number
  /** anchor payday — pay periods repeat every 14 days after this date */
  nextPayday: string // YYYY-MM-DD
}

export interface ActiveSession {
  isActive: boolean
  startTime: string | null
  breakMinutes: number
}

export type Page = 'dashboard' | 'shifts' | 'analytics' | 'goals' | 'live' | 'pay'

export interface TaxBreakdown {
  grossPay: number
  otPay: number
  otHours: number
  federalTax: number
  stateTax: number
  ficaTax: number
  savingsDeduction: number
  netPay: number
}

export interface BiweeklyBreakdown extends TaxBreakdown {
  week1: TaxBreakdown
  week2: TaxBreakdown
}
