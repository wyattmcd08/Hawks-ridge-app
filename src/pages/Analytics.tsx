import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { TrendingUp, Clock, Trophy, CalendarRange, PiggyBank, Hourglass } from 'lucide-react'
import { useStore } from '../store/useStore'
import GlassCard from '../components/GlassCard'
import AnimatedNumber from '../components/AnimatedNumber'
import { sumGross, sumHours } from '../utils/calculations'
import {
  monthlySeries,
  weeklySeries,
  payPeriodSeries,
  savingsGrowth,
  weekdayShare,
  bestWeek,
  monthlyRecords,
  yearToDateGross,
} from '../utils/series'
import { currency, hoursLabel } from '../utils/format'

const tooltipStyle = {
  background: 'rgba(20,24,22,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  color: '#fff',
}

const PIE_COLORS = ['#1a8a60', '#f0c040', '#4c9af5', '#a78bfa', '#34d399', '#ff8a5e', '#c9a84c']

export default function Analytics() {
  const shifts = useStore((s) => s.shifts)
  const settings = useStore((s) => s.settings)

  const totalGross = sumGross(shifts)
  const totalHours = sumHours(shifts)
  const ytd = yearToDateGross(shifts)
  const avgPerShift = shifts.length > 0 ? totalHours / shifts.length : 0
  const best = bestWeek(shifts)
  const records = monthlyRecords(shifts).slice(0, 5)

  const months = monthlySeries(shifts, 6)
  const periods = payPeriodSeries(shifts, settings, 6)
  const growth = savingsGrowth(shifts, settings.savingsRate, 8)
  const byWeekday = weekdayShare(shifts)

  // Projection from recent active weeks
  const weeks = weeklySeries(shifts, 6).filter((w) => w.value > 0)
  const avgWeekly = weeks.length > 0 ? weeks.reduce((a, w) => a + w.value, 0) / weeks.length : 0
  const projectedYearly = avgWeekly * 52
  const maxMonth = Math.max(...months.map((p) => p.value), 1)

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      <div className="pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Analytics</h1>
        <p className="text-sm text-mute">Your earning patterns over time</p>
      </div>

      {/* Key stats */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric icon={TrendingUp} label="Year to date" value={ytd} tint="text-mint" prefix="$" decimals={0} delay={0.05} />
        <Metric icon={Clock} label="Lifetime hours" value={totalHours} tint="text-sky" decimals={1} suffix="h" delay={0.1} />
        <Metric icon={Hourglass} label="Avg / shift" value={avgPerShift} tint="text-gold" decimals={1} suffix="h" delay={0.15} />
        <Metric icon={CalendarRange} label="Projected yearly" value={projectedYearly} tint="text-violet" prefix="$" decimals={0} delay={0.2} />
      </div>

      {/* Best earning week */}
      {best && (
        <GlassCard variant="red" className="mt-4 p-5" delay={0.22}>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <Trophy size={22} className="text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Best Earning Week
              </p>
              <p className="text-sm text-white/60">{best.label} · {hoursLabel(best.hours)}</p>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">
              {currency(best.value, 0)}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Earnings by month */}
      <GlassCard className="mt-4 p-5" delay={0.25}>
        <p className="font-semibold">Earnings by month</p>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#565e59', fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#8b9490' }}
                formatter={(v) => [currency(Number(v)), 'Earned']}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={42}>
                {months.map((p, i) => (
                  <Cell
                    key={i}
                    fill={p.value >= maxMonth ? '#f0c040' : '#1a8a60'}
                    fillOpacity={p.value === 0 ? 0.15 : 0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Hours by month */}
      <GlassCard className="mt-4 p-5" delay={0.3}>
        <p className="font-semibold">Hours worked by month</p>
        <div className="mt-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#565e59', fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#8b9490' }}
                formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Hours']}
              />
              <Bar dataKey="hours" radius={[8, 8, 8, 8]} maxBarSize={42} fill="#4c9af5" fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Earnings per pay period */}
      <GlassCard className="mt-4 p-5" delay={0.35}>
        <p className="font-semibold">Earnings per pay period</p>
        <p className="text-xs text-mute">Biweekly gross vs. take-home</p>
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={periods} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#565e59', fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#8b9490' }}
                formatter={(v, name) => [currency(Number(v)), name === 'value' ? 'Gross' : 'Take-home']}
              />
              <Line type="monotone" dataKey="value" stroke="#1a8a60" strokeWidth={3} dot={{ r: 3, fill: '#1a8a60' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="net" stroke="#f0c040" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Earnings by weekday — pie */}
      {byWeekday.length > 0 && (
        <GlassCard className="mt-4 p-5" delay={0.4}>
          <p className="font-semibold">Earnings by day of week</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-40 w-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byWeekday}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {byWeekday.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [currency(Number(v)), 'Earned']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {byWeekday.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="truncate text-mute">{d.name}</span>
                  <span className="ml-auto font-semibold tabular-nums">
                    {totalGross > 0 ? Math.round((d.value / totalGross) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Savings growth */}
      <GlassCard className="mt-4 p-5" delay={0.45}>
        <div className="flex items-center gap-1.5">
          <PiggyBank size={15} className="text-mint" />
          <p className="font-semibold">Savings growth</p>
        </div>
        <p className="text-xs text-mute">
          Cumulative {Math.round(settings.savingsRate * 100)}% auto-savings
        </p>
        <div className="mt-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#565e59', fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#8b9490' }}
                formatter={(v) => [currency(Number(v)), 'Saved']}
              />
              <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} dot={{ r: 3, fill: '#34d399' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Monthly records */}
      {records.length > 0 && (
        <>
          <p className="mt-6 mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-mute">
            Monthly Records
          </p>
          <div className="space-y-2.5">
            {records.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-3 rounded-3xl glass px-4 py-3.5"
              >
                <div
                  className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-sm font-extrabold ${
                    i === 0 ? 'bg-gold/20 text-gold' : 'bg-white/5 text-mute'
                  }`}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="text-xs text-mute">
                    {m.count} shifts · {hoursLabel(m.hours)}
                  </p>
                </div>
                <p className="font-bold tabular-nums">{currency(m.value, 0)}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}
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
