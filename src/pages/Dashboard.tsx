import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  TrendingUp,
  Clock,
  PiggyBank,
  Plus,
  ChevronRight,
  CalendarDays,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import Logo from '../components/Logo'
import GlassCard from '../components/GlassCard'
import AnimatedNumber from '../components/AnimatedNumber'
import CircularProgress from '../components/CircularProgress'
import ShiftSheet from '../components/ShiftSheet'
import SettingsSheet from '../components/SettingsSheet'
import {
  shiftsInWeek,
  sumGross,
  sumHours,
  computeCurrentPeriodBreakdown,
} from '../utils/calculations'
import { weeklySeries } from '../utils/series'
import { currency, hoursLabel, relativeDay, to12Hour } from '../utils/format'
import { useLiveSession } from '../utils/useLiveSession'

export default function Dashboard() {
  const shifts = useStore((s) => s.shifts)
  const settings = useStore((s) => s.settings)
  const totalSaved = useStore((s) => s.totalSaved())
  const setPage = useStore((s) => s.setPage)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const live = useLiveSession()

  const now = new Date()

  // Lifetime
  const lifetimeGross = sumGross(shifts)

  // Current biweekly pay period (rolls forward automatically every 14 days)
  const { period, breakdown, periodShifts } = computeCurrentPeriodBreakdown(shifts, settings)
  const periodHours = sumHours(periodShifts)

  // Hours
  const weekHours = sumHours(shiftsInWeek(shifts, now))
  const activeWeeks = weeklySeries(shifts, 8).filter((w) => (w.hours ?? 0) > 0)
  const avgWeekHours =
    activeWeeks.length > 0
      ? activeWeeks.reduce((a, w) => a + (w.hours ?? 0), 0) / activeWeeks.length
      : 0

  // Live earnings today
  const todayKey = now.toISOString().slice(0, 10)
  const todayGross = sumGross(shifts.filter((s) => s.date === todayKey))
  const earnedToday = live.active ? todayGross + live.earnings : todayGross

  const recent = [...shifts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const paydayLabel = new Date(period.payday + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      {/* Header — greeting + current date */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl glass">
            <Logo size={28} />
          </div>
          <div>
            <p className="text-sm text-mute">
              {greeting}
              {settings.name ? `, ${settings.name}` : ''}
            </p>
            <p className="text-lg font-bold leading-tight">{dateLabel}</p>
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-2xl glass text-mute transition active:scale-90"
        >
          <SettingsIcon size={20} />
        </button>
      </div>

      {/* Earnings card — lifetime + current period + take-home */}
      <GlassCard variant="red" className="mt-6 overflow-hidden p-6" delay={0.05}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Total Earned · All Time
            </p>
            <p className="mt-2 text-5xl font-extrabold tracking-tight">
              <AnimatedNumber value={lifetimeGross} prefix="$" />
            </p>
            <p className="mt-1.5 text-sm text-white/60">
              {hoursLabel(sumHours(shifts))} worked at Hawks Ridge
            </p>
          </div>
          <div className="rounded-full bg-white/10 p-2.5">
            <TrendingUp size={20} className="text-white" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-black/25 px-4 py-3">
            <p className="text-[11px] font-medium text-white/55">This pay period</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">
              <AnimatedNumber value={breakdown.grossPay} prefix="$" />
            </p>
          </div>
          <div className="rounded-2xl bg-black/25 px-4 py-3">
            <p className="text-[11px] font-medium text-white/55">Est. take-home</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-mint">
              <AnimatedNumber value={breakdown.netPay} prefix="$" />
            </p>
          </div>
        </div>

        {/* Live earned today */}
        <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-black/25 px-4 py-3">
          <span
            className={`h-2 w-2 rounded-full ${live.active ? 'animate-pulse bg-mint' : 'bg-white/30'}`}
          />
          <span className="text-sm text-white/70">
            {live.active ? 'Earning now · today' : 'Earned today'}
          </span>
          <span className="ml-auto text-lg font-bold tabular-nums">
            <AnimatedNumber value={earnedToday} prefix="$" duration={live.active ? 0.4 : 1} />
          </span>
        </div>
      </GlassCard>

      {/* Payday card — countdown + progress ring */}
      <GlassCard className="mt-4 p-5" delay={0.12} onClick={() => setPage('pay')}>
        <div className="flex items-center gap-5">
          <CircularProgress progress={period.progress} size={104} stroke={10} color="#1a8a60" delay={0.25}>
            <p className="text-2xl font-extrabold leading-none">
              {period.daysUntilPayday}
            </p>
            <p className="text-[10px] font-medium text-mute">
              {period.daysUntilPayday === 1 ? 'day left' : 'days left'}
            </p>
          </CircularProgress>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-blood-bright" />
              <p className="text-xs font-semibold uppercase tracking-wider text-mute">
                Next Payday
              </p>
            </div>
            <p className="mt-1 text-xl font-extrabold tracking-tight">
              {period.daysUntilPayday === 0 ? '🎉 Today!' : paydayLabel}
            </p>
            <p className="mt-0.5 text-xs text-mute">
              Day {period.dayInPeriod} of 14 · {hoursLabel(periodHours)} logged
            </p>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${period.progress * 100}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="h-full rounded-full bg-blood-bright"
              />
            </div>
          </div>
          <ChevronRight size={18} className="flex-shrink-0 text-faint" />
        </div>
      </GlassCard>

      {/* Hours card */}
      <GlassCard className="mt-4 p-5" delay={0.18}>
        <div className="mb-3 flex items-center gap-1.5">
          <Clock size={14} className="text-sky" />
          <p className="text-xs font-semibold uppercase tracking-wider text-mute">Hours</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-extrabold tracking-tight">{hoursLabel(weekHours)}</p>
            <p className="mt-0.5 text-[11px] text-mute">this week</p>
          </div>
          <div className="border-x border-white/8">
            <p className="text-xl font-extrabold tracking-tight">{hoursLabel(periodHours)}</p>
            <p className="mt-0.5 text-[11px] text-mute">pay period</p>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{hoursLabel(avgWeekHours)}</p>
            <p className="mt-0.5 text-[11px] text-mute">avg / week</p>
          </div>
        </div>
      </GlassCard>

      {/* Savings card */}
      <GlassCard className="mt-4 p-5" delay={0.24} onClick={() => setPage('goals')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PiggyBank size={14} className="text-mint" />
            <p className="text-xs font-semibold uppercase tracking-wider text-mute">Savings</p>
          </div>
          <ChevronRight size={16} className="text-faint" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-mint">
              {currency(totalSaved, 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-mute">total saved</p>
          </div>
          <div className="border-x border-white/8">
            <p className="text-xl font-extrabold tracking-tight">
              {currency(breakdown.savingsDeduction, 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-mute">this paycheck</p>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">
              {Math.round(settings.savingsRate * 100)}%
            </p>
            <p className="mt-0.5 text-[11px] text-mute">savings rate</p>
          </div>
        </div>
      </GlassCard>

      {/* Recent shifts + quick add */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <p className="font-semibold">Recent shifts</p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs font-medium text-blood-bright transition active:scale-95"
        >
          <Plus size={14} /> Quick add
        </button>
      </div>
      <div className="space-y-2.5">
        {recent.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            onClick={() => setPage('shifts')}
            className="flex w-full items-center gap-3 rounded-3xl glass p-4 text-left transition active:scale-[0.98]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blood/15 text-blood-bright">
              <Clock size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{relativeDay(s.date)}</p>
              <p className="truncate text-xs text-mute">
                {to12Hour(s.startTime)} – {to12Hour(s.endTime)} · {hoursLabel(s.hoursWorked)}
              </p>
            </div>
            <p className="font-bold tabular-nums">{currency(s.grossPay)}</p>
          </motion.button>
        ))}
        {recent.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-mute">No shifts yet. Add your first one!</p>
          </GlassCard>
        )}
      </div>

      <ShiftSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
