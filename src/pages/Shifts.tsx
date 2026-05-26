import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, StickyNote } from 'lucide-react'
import { useStore } from '../store/useStore'
import GlassCard from '../components/GlassCard'
import ShiftSheet from '../components/ShiftSheet'
import PayBreakdown from '../components/PayBreakdown'
import {
  shiftsInWeek,
  sumGross,
  estimateTaxes,
} from '../utils/calculations'
import { currency, hoursLabel, prettyDate, to12Hour } from '../utils/format'
import type { Shift } from '../types'

function groupByWeek(shifts: Shift[]) {
  const sorted = [...shifts].sort((a, b) => b.date.localeCompare(a.date))
  const groups: { label: string; items: Shift[] }[] = []
  for (const s of sorted) {
    const d = new Date(s.date + 'T00:00:00')
    const day = d.getDay()
    const sow = new Date(d)
    sow.setDate(d.getDate() - day)
    const label = `Week of ${sow.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`
    let g = groups.find((x) => x.label === label)
    if (!g) {
      g = { label, items: [] }
      groups.push(g)
    }
    g.items.push(s)
  }
  return groups
}

export default function Shifts() {
  const shifts = useStore((s) => s.shifts)
  const settings = useStore((s) => s.settings)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)

  const weekGross = sumGross(shiftsInWeek(shifts, new Date()))
  const breakdown = estimateTaxes(weekGross, settings.savingsRate)
  const groups = useMemo(() => groupByWeek(shifts), [shifts])

  const openAdd = () => {
    setEditing(null)
    setOpen(true)
  }
  const openEdit = (s: Shift) => {
    setEditing(s)
    setOpen(true)
  }

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Shifts</h1>
          <p className="text-sm text-mute">Track every hour you work</p>
        </div>
        <button
          onClick={openAdd}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ember to-blood-deep text-white shadow-glow transition active:scale-90"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* This week's paycheck breakdown */}
      <div className="mt-5">
        <PayBreakdown breakdown={breakdown} title="This week's paycheck" />
      </div>

      {/* Shift list */}
      <div className="mt-6 space-y-6">
        {groups.map((g, gi) => {
          const total = sumGross(g.items)
          return (
            <div key={g.label}>
              <div className="mb-2.5 flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-mute">{g.label}</p>
                <p className="text-sm font-semibold tabular-nums">
                  {currency(total)}
                </p>
              </div>
              <div className="space-y-2.5">
                {g.items.map((s, i) => (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(gi * 0.05 + i * 0.04, 0.4) }}
                    onClick={() => openEdit(s)}
                    className="flex w-full items-center gap-3 rounded-3xl glass p-4 text-left transition active:scale-[0.98]"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blood/15 text-blood-bright">
                      <Clock size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{prettyDate(s.date)}</p>
                      <p className="truncate text-xs text-mute">
                        {to12Hour(s.startTime)} – {to12Hour(s.endTime)}
                        {s.breakMinutes > 0 && ` · ${s.breakMinutes}m break`}
                      </p>
                      {s.notes && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-faint">
                          <StickyNote size={11} /> {s.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{currency(s.grossPay)}</p>
                      <p className="text-xs text-mute">{hoursLabel(s.hoursWorked)}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )
        })}

        {shifts.length === 0 && (
          <GlassCard className="p-10 text-center">
            <p className="text-lg font-semibold">No shifts yet</p>
            <p className="mt-1 text-sm text-mute">
              Tap the + button to log your first shift.
            </p>
          </GlassCard>
        )}
      </div>

      <ShiftSheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  )
}
