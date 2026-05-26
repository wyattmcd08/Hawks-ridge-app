import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Flag, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import GlassCard from '../components/GlassCard'
import GoalSheet from '../components/GoalSheet'
import { weeklySeries } from '../utils/series'
import { currency } from '../utils/format'
import type { Goal } from '../types'

export default function Goals() {
  const goals = useStore((s) => s.goals)
  const shifts = useStore((s) => s.shifts)
  const settings = useStore((s) => s.settings)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  // Average weekly savings used to estimate completion dates.
  const weeks = weeklySeries(shifts, 6).filter((w) => w.value > 0)
  const avgWeekly =
    weeks.length > 0 ? weeks.reduce((a, w) => a + w.value, 0) / weeks.length : 0
  const weeklySavings = avgWeekly * settings.savingsRate

  const totalTarget = goals.reduce((a, g) => a + g.targetAmount, 0)
  const totalSavedToGoals = goals.reduce((a, g) => a + g.currentAmount, 0)

  const estimate = (g: Goal): string => {
    const remaining = g.targetAmount - g.currentAmount
    if (remaining <= 0) return 'Goal reached 🎉'
    if (weeklySavings <= 0) return 'Add shifts to project'
    const weeksLeft = Math.ceil(remaining / weeklySavings)
    const date = new Date()
    date.setDate(date.getDate() + weeksLeft * 7)
    return `~${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  }

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Goals</h1>
          <p className="text-sm text-mute">What you're working toward</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ember to-blood-deep text-white shadow-glow transition active:scale-90"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Summary */}
      <GlassCard variant="red" className="mt-5 p-5" delay={0.05}>
        <div className="flex items-center gap-2 text-white/70">
          <Sparkles size={16} />
          <p className="text-xs font-semibold uppercase tracking-wider">
            Saved toward goals
          </p>
        </div>
        <p className="mt-2 text-4xl font-extrabold tracking-tight">
          {currency(totalSavedToGoals, 0)}
        </p>
        <p className="mt-1 text-sm text-white/60">
          of {currency(totalTarget, 0)} across {goals.length} goal
          {goals.length === 1 ? '' : 's'}
        </p>
      </GlassCard>

      {/* Goal cards */}
      <div className="mt-5 space-y-3">
        {goals.map((g, i) => {
          const pct = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0
          const done = pct >= 1
          return (
            <GlassCard
              key={g.id}
              className="p-5"
              delay={0.1 + i * 0.06}
              onClick={() => {
                setEditing(g)
                setOpen(true)
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-14 w-14 place-items-center rounded-2xl text-2xl"
                  style={{ background: `${g.color}22` }}
                >
                  {g.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{g.name}</p>
                  <p className="text-xs text-mute">
                    {currency(g.currentAmount, 0)} / {currency(g.targetAmount, 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xl font-extrabold tabular-nums"
                    style={{ color: g.color }}
                  >
                    {Math.round(pct * 100)}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct * 100)}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${g.color}aa, ${g.color})`,
                    boxShadow: `0 0 12px ${g.color}88`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-mute">
                  <Flag size={12} /> {currency(g.targetAmount - g.currentAmount, 0)} to go
                </span>
                <span className={done ? 'text-mint' : 'text-mute'}>{estimate(g)}</span>
              </div>
            </GlassCard>
          )
        })}

        {goals.length === 0 && (
          <GlassCard className="p-10 text-center">
            <p className="text-lg font-semibold">No goals yet</p>
            <p className="mt-1 text-sm text-mute">
              Set your first savings goal — a truck, college, anything.
            </p>
          </GlassCard>
        )}
      </div>

      <GoalSheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  )
}
