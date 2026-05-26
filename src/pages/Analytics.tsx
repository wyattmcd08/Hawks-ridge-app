import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { TrendingUp, Clock, CalendarRange, PiggyBank } from 'lucide-react'
import { useStore } from '../store/useStore'
import GlassCard from '../components/GlassCard'
import AnimatedNumber from '../components/AnimatedNumber'
import { sumGross, sumHours } from '../utils/calculations'
import {
  dailySeries,
  weeklySeries,
  monthlySeries,
  savingsGrowth,
} from '../utils/series'
import { currency } from '../utils/format'

type Range = 'daily' | 'weekly' | 'monthly'

const tooltipStyle = {
  background: 'rgba(20,20,24,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  color: '#fff',
}

export default function Analytics() {
  const shifts = useStore((s) => s.shifts)
  const settings = useStore((s) => s.settings)
  const [range, setRange] = useState<Range>('weekly')

  const totalGross = sumGross(shifts)
  const totalHours = sumHours(shifts)
  const avgRate = totalHours > 0 ? totalGross / totalHours : settings.hourlyRate

  // Projected yearly from the average of the last weeks with activity.
  const weeks = weeklySeries(shifts, 6).filter((w) => w.value > 0)
  const avgWeekly =
    weeks.length > 0 ? weeks.reduce((a, w) => a + w.value, 0) / weeks.length : 0
  const projectedYearly = avgWeekly * 52

  const series =
    range === 'daily'
      ? dailySeries(shifts, 7)
      : range === 'weekly'
        ? weeklySeries(shifts, 6)
        : monthlySeries(shifts, 6)

  const growth = savingsGrowth(shifts, settings.savingsRate, 8)
  const maxVal = Math.max(...series.map((p) => p.value), 1)

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      <div className="pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Analytics</h1>
        <p className="text-sm text-mute">Your earning patterns over time</p>
      </div>

      {/* Range tabs */}
      <div className="mt-5 flex gap-1 rounded-2xl glass p-1">
        {(['daily', 'weekly', 'monthly'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="relative flex-1 rounded-xl py-2.5 text-sm font-medium capitalize transition"
          >
            {range === r && (
              <motion.span
                layoutId="range-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-ember to-blood-deep"
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              />
            )}
            <span className={range === r ? 'relative text-white' : 'relative text-mute'}>
              {r}
            </span>
          </button>
        ))}
      </div>

      {/* Main earnings chart */}
      <GlassCard className="mt-4 p-5" delay={0.05}>
        <p className="font-semibold capitalize">{range} earnings</p>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#56565e', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#8b8b94' }}
                formatter={(v) => [currency(Number(v)), 'Earned']}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={42}>
                {series.map((p, i) => (
                  <Cell
                    key={i}
                    fill={p.value >= maxVal ? '#ff2d3d' : '#e11d2a'}
                    fillOpacity={p.value === 0 ? 0.15 : 0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Key stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric
          icon={TrendingUp}
          label="Projected yearly"
          value={projectedYearly}
          tint="text-mint"
          prefix="$"
          decimals={0}
          delay={0.1}
        />
        <Metric
          icon={Clock}
          label="Total hours"
          value={totalHours}
          tint="text-sky"
          decimals={1}
          suffix="h"
          delay={0.15}
        />
        <Metric
          icon={PiggyBank}
          label="Avg / hour"
          value={avgRate}
          tint="text-gold"
          prefix="$"
          decimals={2}
          delay={0.2}
        />
        <Metric
          icon={CalendarRange}
          label="Avg / week"
          value={avgWeekly}
          tint="text-violet"
          prefix="$"
          decimals={0}
          delay={0.25}
        />
      </div>

      {/* Hours trend */}
      <GlassCard className="mt-4 p-5" delay={0.3}>
        <p className="font-semibold">Hours worked</p>
        <div className="mt-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#56565e', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#8b8b94' }}
                formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Hours']}
              />
              <Bar dataKey="hours" radius={[8, 8, 8, 8]} maxBarSize={42} fill="#4c9af5" fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Savings growth */}
      <GlassCard className="mt-4 p-5" delay={0.35}>
        <p className="font-semibold">Savings growth</p>
        <p className="text-xs text-mute">Cumulative 5% auto-savings</p>
        <div className="mt-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#56565e', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#8b8b94' }}
                formatter={(v) => [currency(Number(v)), 'Saved']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#34d399"
                strokeWidth={3}
                dot={{ r: 3, fill: '#34d399' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tint,
  prefix = '',
  suffix = '',
  decimals = 0,
  delay,
}: {
  icon: typeof Clock
  label: string
  value: number
  tint: string
  prefix?: string
  suffix?: string
  decimals?: number
  delay: number
}) {
  return (
    <GlassCard className="p-4" delay={delay}>
      <Icon size={20} className={tint} />
      <p className="mt-3 text-2xl font-bold tracking-tight">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="text-xs text-mute">{label}</p>
    </GlassCard>
  )
}
