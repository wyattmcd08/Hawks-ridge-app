import { motion } from 'framer-motion'
import GlassCard from './GlassCard'
import AnimatedNumber from './AnimatedNumber'
import type { TaxBreakdown } from '../types'
import { currency } from '../utils/format'

const ROWS: { key: keyof TaxBreakdown; label: string; color: string }[] = [
  { key: 'netPay', label: 'Take-home pay', color: '#34d399' },
  { key: 'savingsDeduction', label: 'Auto savings', color: '#4c9af5' },
  { key: 'ficaTax', label: 'FICA (Social Security + Medicare)', color: '#f0c040' },
  { key: 'federalTax', label: 'Federal income tax', color: '#a78bfa' },
  { key: 'stateTax', label: 'Georgia income tax', color: '#ff8a5e' },
]

export default function PayBreakdown({
  breakdown,
  title = 'Paycheck breakdown',
}: {
  breakdown: TaxBreakdown
  title?: string
}) {
  const gross = breakdown.grossPay || 1
  const rows = ROWS.filter((r) => breakdown[r.key] > 0 || r.key === 'netPay')

  return (
    <GlassCard className="p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-mute">Gross {currency(breakdown.grossPay)}</p>
      </div>

      {/* Overtime badge */}
      {breakdown.otPay > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: 'rgba(240,192,64,0.12)', border: '1px solid rgba(240,192,64,0.25)' }}>
          <span className="text-sm" style={{ color: '#f0c040' }}>⚡</span>
          <span className="text-xs text-mute">{breakdown.otHours.toFixed(1)}h overtime at 1.5×</span>
          <span className="ml-auto text-xs font-bold" style={{ color: '#f0c040' }}>+{currency(breakdown.otPay)}</span>
        </div>
      )}

      <p className="mt-3 text-4xl font-extrabold tracking-tight text-mint">
        <AnimatedNumber value={breakdown.netPay} prefix="$" />
      </p>
      <p className="text-xs text-mute">estimated take-home</p>

      <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        {rows.map((r) => (
          <motion.div
            key={r.key}
            initial={{ width: 0 }}
            animate={{ width: `${(breakdown[r.key] / gross) * 100}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: r.color }}
            className="h-full"
          />
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((r, i) => (
          <motion.div
            key={r.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex items-center gap-3"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
            <span className="text-sm text-mute">{r.label}</span>
            <span className="ml-auto text-sm font-semibold tabular-nums">{currency(breakdown[r.key])}</span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
