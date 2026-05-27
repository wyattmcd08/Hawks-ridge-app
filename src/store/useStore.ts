import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Shift, Goal, Settings, ActiveSession, Page } from '../types'
import { computeHours, estimateTaxes } from '../utils/calculations'

interface State {
  settings: Settings
  shifts: Shift[]
  goals: Goal[]
  session: ActiveSession
  page: Page
  hasOnboarded: boolean

  setPage: (p: Page) => void
  updateSettings: (s: Partial<Settings>) => void

  addShift: (s: Omit<Shift, 'id' | 'hoursWorked' | 'grossPay'>) => void
  updateShift: (id: string, s: Partial<Shift>) => void
  deleteShift: (id: string) => void

  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, g: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  contributeToGoal: (id: string, amount: number) => void

  startSession: () => void
  stopSession: () => void
  setSessionBreak: (mins: number) => void

  totalSaved: () => number
  completeOnboarding: () => void
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function buildShift(
  input: Omit<Shift, 'id' | 'hoursWorked' | 'grossPay'>,
): Shift {
  const hoursWorked = computeHours(
    input.startTime,
    input.endTime,
    input.breakMinutes,
  )
  return {
    ...input,
    id: uid(),
    hoursWorked,
    grossPay: hoursWorked * input.hourlyRate,
  }
}

const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 15,
  savingsRate: 0.05,
  defaultStartTime: '05:45',
  name: '',
  isDependent: true,
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      shifts: [],
      goals: [],
      session: { isActive: false, startTime: null, breakMinutes: 0 },
      page: 'dashboard',
      hasOnboarded: false,

      setPage: (p) => set({ page: p }),
      updateSettings: (s) =>
        set((st) => ({ settings: { ...st.settings, ...s } })),

      addShift: (s) =>
        set((st) => ({ shifts: [...st.shifts, buildShift(s)] })),
      updateShift: (id, patch) =>
        set((st) => ({
          shifts: st.shifts.map((sh) => {
            if (sh.id !== id) return sh
            const merged = { ...sh, ...patch }
            const hoursWorked = computeHours(
              merged.startTime,
              merged.endTime,
              merged.breakMinutes,
            )
            return {
              ...merged,
              hoursWorked,
              grossPay: hoursWorked * merged.hourlyRate,
            }
          }),
        })),
      deleteShift: (id) =>
        set((st) => ({ shifts: st.shifts.filter((s) => s.id !== id) })),

      addGoal: (g) =>
        set((st) => ({
          goals: [
            ...st.goals,
            { ...g, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateGoal: (id, patch) =>
        set((st) => ({
          goals: st.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGoal: (id) =>
        set((st) => ({ goals: st.goals.filter((g) => g.id !== id) })),
      contributeToGoal: (id, amount) =>
        set((st) => ({
          goals: st.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  currentAmount: Math.max(0, g.currentAmount + amount),
                }
              : g,
          ),
        })),

      startSession: () =>
        set({
          session: {
            isActive: true,
            startTime: new Date().toISOString(),
            breakMinutes: 0,
          },
          page: 'live',
        }),
      stopSession: () => {
        const { session, settings } = get()
        if (session.startTime) {
          const start = new Date(session.startTime)
          const now = new Date()
          const date = start.toISOString().slice(0, 10)
          const fmt = (d: Date) =>
            `${String(d.getHours()).padStart(2, '0')}:${String(
              d.getMinutes(),
            ).padStart(2, '0')}`
          get().addShift({
            date,
            startTime: fmt(start),
            endTime: fmt(now),
            breakMinutes: session.breakMinutes,
            hourlyRate: settings.hourlyRate,
            notes: 'Logged from live session',
          })
        }
        set({
          session: { isActive: false, startTime: null, breakMinutes: 0 },
          page: 'dashboard',
        })
      },
      setSessionBreak: (mins) =>
        set((st) => ({ session: { ...st.session, breakMinutes: mins } })),

      totalSaved: () => {
        const { shifts, settings, goals } = get()
        const fromShifts = shifts.reduce(
          (acc, s) =>
            acc + estimateTaxes(s.grossPay, settings.savingsRate).savingsDeduction,
          0,
        )
        const inGoals = goals.reduce((acc, g) => acc + g.currentAmount, 0)
        return fromShifts + inGoals
      },
      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'hawks-ridge-finance',
      version: 3,
    },
  ),
)
