import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react'
import { useStore } from '../store/useStore'
import GlassCard from '../components/GlassCard'
import AnimatedNumber from '../components/AnimatedNumber'
import PayBreakdown from '../components/PayBreakdown'
import {
  getPayPeriodBounds,
  shiftsInRange,
  computeBiweeklyBreakdown,
  sumHours,
} from '../utils/calculations'
import { currency, hoursLabel } from '../utils/format'
import type { Shift, TaxBreakdown } from '../types'

function localDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

function addOneDay(dateStr: string): string {
  const d = localDate(dateStr)
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatRange(start: string, end: string): string {
  const s = localDate(start)
  const e = localDate(end)
  const sm = s.toLocaleDateString('en-US', { month: 'short' })
  const em = e.toLocaleDateString('en-US', { month: 'short' })
  if (sm === em) return `${sm} ${s.getDate()} – ${e.getDate()}`
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}`
}

function formatPayday(dateStr: string): string {
  return localDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const t = localDate(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((t.getTime() - now.getTime()) / 86400000)
}

interface PeriodInfo {
  start: string
  end: string
  payday: string
  week1End: string
  week2Start: string
}

function buildPeriod(nextPayday: string, back: number): PeriodInfo {
  const b = getPayPeriodBounds(nextPayday, back)
  return { ...b, week2Start: addOneDay(b.week1End) }
}

export default function PayPeriods() {
  const shifts = useStore((s) => s.shifts)
  const settings = useStore((s) => s.settings)
  const [selected, setSelected] = useState(0)

  const period = buildPeriod(settings.nextPayday, selected)

  const week1Shifts = shiftsInRange(shifts, period.start, period.week1End)
  const week2Shifts = shiftsInRange(shifts, period.week2Start, period.end)
  const biweekly = computeBiweeklyBreakdown(
    week1Shifts,
    week2Shifts,
    settings.hourlyRate,
    settings.savingsRate,
    settings.isDependent,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pStart = localDate(period.start)
  const pEnd = localDate(period.end)
  const isCurrentPeriod = today >= pStart && today <= pEnd
  const isPastPeriod = today > pEnd
  const daysPast = isCurrentPeriod
    ? Math.max(1, Math.round((today.getTime() - pStart.getTime()) / 86400000) + 1)
    : isPastPeriod
    ? 14
    : 0
  const daysAway = daysUntil(period.payday)

  // Compare delta vs current when browsing history
  const currentPeriod = selected === 0 ? period : buildPeriod(settings.nextPayday, 0)
  const currentW1 = selected === 0
    ? week1Shifts
    : shiftsInRange(shifts, currentPeriod.start, currentPeriod.week1End)
  const currentW2 = selected === 0
    ? week2Shifts
    : shiftsInRange(shifts, currentPeriod.week2Start, currentPeriod.end)
  const currentBd = selected === 0
    ? biweekly
    : computeBiweeklyBreakdown(currentW1, currentW2, settings.hourlyRate, settings.savingsRate, settings.isDependent)
  const delta = selected > 0 ? currentBd.netPay - biweekly.netPay : 0

  // Build history list (past 6 periods)
  const history = Array.from({ length: 6 }, (_, i) => i + 1).map((back) => {
    const p = buildPeriod(settings.nextPayday, back)
    const w1 = shiftsInRange(shifts, p.start, p.week1End)
    const w2 = shiftsInRange(shifts, p.week2Start, p.end)
    const bd = computeBiweeklyBreakdown(w1, w2, settings.hourlyRate, settings.savingsRate, settings.isDependent)
    return { ...p, back, netPay: bd.netPay, grossPay: bd.grossPay, otHours: bd.otHours }
  })

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Paychecks</h1>
          <p className="text-sm text-mute">Biweekly · every 2 weeks</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl glass">
          <Wallet size={22} className="text-blood-bright" />
        </div>
      </div>

      {/* Back to current */}
      <AnimatePresence>
        {selected > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={() => setSelected(0)}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-blood-bright"
          >
            <ChevronLeft size={15} /> Current period
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hero card */}
      <GlassCard variant="red" className="mt-4 overflow-hidden p-6" delay={0.05}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                {isCurrentPeriod ? 'Current Period' : isPastPeriod ? 'Past Period' : 'Upcoming Period'}
              </p>
              {biweekly.otHours > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(240,192,64,0.25)', color: '#f0c040' }}
                >
                  ⚡ {biweekly.otHours.toFixed(1)}h OT
                </span>
              )}
            </div>
            <p className="mb-2 text-sm font-medium text-white/60">
              {formatRange(period.start, period.end)}
            </p>
            <p className="text-5xl font-extrabold leading-none tracking-tight">
              <AnimatedNumber value={biweekly.netPay} prefix="$" />
            </p>
            <p className="mt-1.5 text-sm text-white/60">
              {currency(biweekly.grossPay)} gross
              {selected > 0 && delta !== 0 && (
                <span
                  className="ml-2 font-semibold"
                  style={{ color: delta > 0 ? '#34d399' : '#ff6b6b' }}
                >
                  {delta > 0 ? '+' : ''}{currency(delta)} vs now
                </span>
              )}
            </p>
          </div>
          <div className="flex-shrink-0 rounded-full bg-white/10 p-2.5">
            <CalendarDays size={20} className="text-white" />
          </div>
        </div>

        {/* Period progress bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs text-white/60">
            <span>
              {isCurrentPeriod
                ? `Day ${daysPast} of 14`
                : isPastPeriod
                ? 'Period complete'
                : `Starts ${formatPayday(period.start)}`}
            </span>
            <span>
              {daysAway > 0
                ? `Payday ${formatPayday(period.payday)} · ${daysAway}d`
                : daysAway === 0
                ? '🎉 Payday today!'
                : `Paid ${formatPayday(period.payday)}`}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              key={`bar-${selected}`}
              initial={{ width: 0 }}
              animate={{ width: `${(daysPast / 14) * 100}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="h-full rounded-full bg-white/70"
            />
          </div>
        </div>
      </GlassCard>

      {/* Week comparison */}
      <p className="mt-6 mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-mute">
        Week by Week
      </p>
      <div className="grid grid-cols-2 gap-3">
        <WeekTile
          label="Week 1"
          range={formatRange(period.start, period.week1End)}
          shifts={week1Shifts}
          breakdown={biweekly.week1}
          delay={0.1}
        />
        <WeekTile
          label="Week 2"
          range={formatRange(period.week2Start, period.end)}
          shifts={week2Shifts}
          breakdown={biweekly.week2}
          delay={0.15}
        />
      </div>

      {/* Full biweekly breakdown */}
      <div className="mt-4">
        <PayBreakdown breakdown={biweekly} title="Biweekly paycheck" />
      </div>

      {/* Pay history */}
      <p className="mt-6 mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-mute">
        Pay History
      </p>
      <div className="space-y-2.5">
        {history.map((h, i) => (
          <motion.button
            key={h.payday}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
            onClick={() => setSelected(selected === h.back ? 0 : h.back)}
            className={`flex w-full items-center gap-4 rounded-3xl px-4 py-3.5 text-left transition active:scale-[0.98] ${
              selected === h.back ? 'glass-red' : 'glass'
            }`}
          >
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-blood/15 text-blood-bright">
              <Wallet size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{formatRange(h.start, h.end)}</p>
              <p className="text-xs text-mute">Paid {formatPayday(h.payday)}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              {h.netPay > 0 ? (
                <>
                  <p className="font-bold tabular-nums">{currency(h.netPay)}</p>
                  <p className="text-xs text-mute">{currency(h.grossPay)} gross</p>
                </>
              ) : (
                <p className="font-medium text-faint">—</p>
              )}
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-faint" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function WeekTile({
  label,
  range,
  shifts,
  breakdown,
  delay,
}: {
  label: string
  range: string
  shifts: Shift[]
  breakdown: TaxBreakdown
  delay: number
}) {
  const hours = sumHours(shifts)
  const hasShifts = shifts.length > 0

  return (
    <GlassCard className="p-4" delay={delay}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mute">{label}</p>
        {breakdown.otHours > 0 && (
          <span className="text-sm" style={{ color: '#f0c040' }}>⚡</span>
        )}
      </div>
      <p className="mb-3 text-[11px] text-faint">{range}</p>

      <p className="text-2xl font-extrabold tracking-tight">
        {hasShifts
          ? currency(breakdown.grossPay, 0)
          : <span className="font-bold text-white/20">$0</span>}
      </p>
      <p className="mt-0.5 text-xs text-mute">
        {hasShifts ? hoursLabel(hours) : 'no shifts'}
      </p>

      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-faint">Take-home</span>
          <span className="font-semibold text-ink">
            {hasShifts ? currency(breakdown.netPay, 0) : '—'}
          </span>
        </div>
        {breakdown.otHours > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#f0c040' }}>⚡ Overtime</span>
            <span className="font-semibold" style={{ color: '#f0c040' }}>
              +{currency(breakdown.otPay, 0)}
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
