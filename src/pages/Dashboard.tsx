import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  Settings as SettingsIcon,
  TrendingUp,
  Clock,
  PiggyBank,
  Wallet,
  Plus,
  ChevronRight,
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
  estimateTaxes,
} from '../utils/calculations'
import { dailySeries } from '../utils/series'
import { currency, hoursLabel, relativeDay, to12Hour } from '../utils/format'
import { useLiveSession } from '../utils/useLiveSession'

export default function Dashboard() {
  const shifts = useStore((s) => s.shifts)
  const settings = useStore((s) => s.settings)
  const goals = useStore((s) => s.goals)
  const totalSaved = useStore((s) => s.totalSaved())
  const setPage = useStore((s) => s.setPage)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const live = useLiveSession()

  const now = new Date()
  const weekShifts = shiftsInWeek(shifts, now)
  const weekGross = sumGross(weekShifts)
  const weekHours = sumHours(weekShifts)
  const paycheck = estimateTaxes(weekGross, settings.savingsRate, settings.isDependent)
  const avgRate = weekHours > 0 ? weekGross / weekHours : settings.hourlyRate

  const todayKey = now.toISOString().slice(0, 10)
  const todayGross = sumGross(shifts.filter((s) => s.date === todayKey))
  const earnedToday = live.active ? todayGross + live.earnings : todayGross

  const trend = dailySeries(shifts, 7)
  const recent = [...shifts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)

  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl glass">
            <Logo size={28} />
          </div>
          <div>
            <p className="text-sm text-mute">{greeting}</p>
            <p className="text-lg font-bold leading-tight">Hawks Ridge</p>
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-2xl glass text-mute transition active:scale-90"
        >
          <SettingsIcon size={20} />
        </button>
      </div>

      {/* Hero — estimated paycheck */}
      <GlassCard variant="red" className="mt-6 overflow-hidden p-6" delay={0.05}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Estimated Paycheck
            </p>
            <p className="mt-2 text-5xl font-extrabold tracking-tight">
              <AnimatedNumber value={paycheck.netPay} prefix="$" />
            </p>
            <p className="mt-1.5 text-sm text-white/60">
              {currency(weekGross)} gross · this week
            </p>
          </div>
          <div className="rounded-full bg-white/10 p-2.5">
            <TrendingUp size={20} className="text-white" />
          </div>
        </div>

        {/* Live earned today */}
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-black/25 px-4 py-3">
          <span
            className={`h-2 w-2 rounded-full ${
              live.active ? 'animate-pulse bg-mint' : 'bg-white/30'
            }`}
          />
          <span className="text-sm text-white/70">
            {live.active ? 'Earning now · today' : 'Earned today'}
          </span>
          <span className="ml-auto text-lg font-bold tabular-nums">
            <AnimatedNumber
              value={earnedToday}
              prefix="$"
              duration={live.active ? 0.4 : 1}
            />
          </span>
        </div>
      </GlassCard>

      {/* Stat grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile
          icon={Clock}
          label="Hours this week"
          value={hoursLabel(weekHours)}
          tint="text-sky"
          delay={0.1}
        />
        <StatTile
          icon={Wallet}
          label="Earned this week"
          value={currency(weekGross, 0)}
          tint="text-gold"
          delay={0.15}
        />
        <StatTile
          icon={PiggyBank}
          label="Total saved"
          value={currency(totalSaved, 0)}
          tint="text-mint"
          delay={0.2}
        />
        <StatTile
          icon={TrendingUp}
          label="Avg / hour"
          value={currency(avgRate, 2)}
          tint="text-violet"
          delay={0.25}
        />
      </div>

      {/* Earnings trend */}
      <GlassCard className="mt-4 p-5" delay={0.3}>
        <div className="mb-1 flex items-center justify-between">
          <p className="font-semibold">Earnings trend</p>
          <button
            onClick={() => setPage('analytics')}
            className="flex items-center text-xs text-mute"
          >
            Last 7 days <ChevronRight size={14} />
          </button>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006747" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#006747" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#565e59', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: '#006747', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{
                  background: 'rgba(20,24,22,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  color: '#fff',
                }}
                formatter={(v) => [currency(Number(v)), 'Earned']}
                labelStyle={{ color: '#8b9490' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1a8a60"
                strokeWidth={2.5}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Savings goal rings */}
      {goals.length > 0 && (
        <GlassCard className="mt-4 p-5" delay={0.35}>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">Savings goals</p>
            <button
              onClick={() => setPage('goals')}
              className="flex items-center text-xs text-mute"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex justify-around">
            {goals.slice(0, 3).map((g, i) => {
              const pct = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0
              return (
                <div key={g.id} className="flex flex-col items-center gap-2">
                  <CircularProgress
                    progress={pct}
                    size={88}
                    stroke={9}
                    color={g.color}
                    delay={0.4 + i * 0.1}
                  >
                    <span className="text-xl">{g.emoji}</span>
                  </CircularProgress>
                  <div className="text-center">
                    <p className="text-xs font-medium">{g.name}</p>
                    <p className="text-[11px] text-mute">{Math.round(pct * 100)}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Recent shifts */}
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
            transition={{ delay: 0.4 + i * 0.05 }}
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

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  delay,
}: {
  icon: typeof Clock
  label: string
  value: string
  tint: string
  delay: number
}) {
  return (
    <GlassCard className="p-4" delay={delay}>
      <Icon size={20} className={tint} />
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-mute">{label}</p>
    </GlassCard>
  )
}
