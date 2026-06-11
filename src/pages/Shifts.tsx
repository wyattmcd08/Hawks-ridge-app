import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  StickyNote,
  Download,
  FileSpreadsheet,
  X,
  List,
  CalendarDays,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import GlassCard from '../components/GlassCard'
import ShiftSheet from '../components/ShiftSheet'
import MonthCalendar from '../components/MonthCalendar'
import { getCurrentPayPeriod, sumGross, sumHours } from '../utils/calculations'
import { exportShiftsCSV, exportShiftsExcel } from '../utils/export'
import { currency, hoursLabel, prettyDate, to12Hour, todayISO } from '../utils/format'
import type { Shift } from '../types'

type Filter = 'all' | 'period' | 'month' | 'notes'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'period', label: 'This period' },
  { id: 'month', label: 'This month' },
  { id: 'notes', label: 'With notes' },
]

interface MonthGroup {
  key: string
  label: string
  items: Shift[]
}

function groupByMonth(shifts: Shift[]): MonthGroup[] {
  const sorted = [...shifts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
  )
  const groups: MonthGroup[] = []
  for (const s of sorted) {
    const key = s.date.slice(0, 7)
    let g = groups.find((x) => x.key === key)
    if (!g) {
      g = {
        key,
        label: new Date(key + '-01T00:00:00').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        items: [],
      }
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
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selectedDay, setSelectedDay] = useState<string>(todayISO())

  const filtered = useMemo(() => {
    let list = shifts
    if (filter === 'period') {
      const p = getCurrentPayPeriod(settings.nextPayday)
      list = list.filter((s) => s.date >= p.start && s.date <= p.end)
    } else if (filter === 'month') {
      const key = new Date().toISOString().slice(0, 7)
      list = list.filter((s) => s.date.startsWith(key))
    } else if (filter === 'notes') {
      list = list.filter((s) => s.notes.trim().length > 0)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((s) => {
        const pretty = new Date(s.date + 'T00:00:00')
          .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          .toLowerCase()
        return s.notes.toLowerCase().includes(q) || s.date.includes(q) || pretty.includes(q)
      })
    }
    return list
  }, [shifts, filter, query, settings.nextPayday])

  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  const openAdd = () => { setEditing(null); setOpen(true) }
  const openEdit = (s: Shift) => { setEditing(s); setOpen(true) }

  return (
    <div className="min-h-screen px-5 pb-32 safe-top">
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Shifts</h1>
          <p className="text-sm text-mute">
            {shifts.length} logged · {hoursLabel(sumHours(shifts))} lifetime
          </p>
        </div>
        <button
          onClick={openAdd}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ember to-blood-deep text-white shadow-glow transition active:scale-90"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* View toggle */}
      <div className="mt-5 flex gap-1 rounded-2xl glass p-1">
        {(
          [
            { id: 'list', label: 'List', icon: List },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
          ] as const
        ).map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition"
          >
            {view === v.id && (
              <motion.span
                layoutId="shift-view-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-ember to-blood-deep"
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              />
            )}
            <v.icon size={15} className={view === v.id ? 'relative text-white' : 'relative text-mute'} />
            <span className={view === v.id ? 'relative text-white' : 'relative text-mute'}>
              {v.label}
            </span>
          </button>
        ))}
      </div>

      {view === 'calendar' ? (
        <>
          <div className="mt-4">
            <MonthCalendar
              shifts={shifts}
              anchorPayday={settings.nextPayday}
              selected={selectedDay}
              onSelect={setSelectedDay}
            />
          </div>

          {/* Selected day */}
          <div className="mt-5 mb-3 flex items-center justify-between px-1">
            <p className="font-semibold">{prettyDate(selectedDay)}</p>
            <button
              onClick={() => { setEditing(null); setOpen(true) }}
              className="flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs font-medium text-blood-bright transition active:scale-95"
            >
              <Plus size={14} /> Add shift
            </button>
          </div>
          <div className="space-y-2.5">
            {shifts
              .filter((s) => s.date === selectedDay)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((s) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => openEdit(s)}
                  className="flex w-full items-center gap-3 rounded-3xl glass p-4 text-left transition active:scale-[0.98]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {to12Hour(s.startTime)} – {to12Hour(s.endTime)}
                    </p>
                    <p className="text-xs text-mute">
                      {hoursLabel(s.hoursWorked)}
                      {s.breakMinutes > 0 && ` · ${s.breakMinutes}m break`}
                    </p>
                    {s.notes && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-faint">
                        <StickyNote size={11} /> {s.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-bold tabular-nums">{currency(s.grossPay)}</p>
                </motion.button>
              ))}
            {shifts.filter((s) => s.date === selectedDay).length === 0 && (
              <GlassCard className="p-6 text-center">
                <p className="text-sm text-mute">No shift this day. Tap “Add shift” to log one.</p>
              </GlassCard>
            )}
          </div>
        </>
      ) : (
        <>
      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl glass px-4 py-3">
        <Search size={17} className="flex-shrink-0 text-mute" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dates or notes…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="flex-shrink-0 text-mute">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
              filter === f.id
                ? 'bg-blood text-white'
                : 'glass text-mute'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex flex-shrink-0 gap-2">
          <button
            onClick={() => exportShiftsCSV(shifts)}
            className="flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs font-medium text-mute transition active:scale-95"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={() => exportShiftsExcel(shifts)}
            className="flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs font-medium text-mute transition active:scale-95"
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
        </div>
      </div>

      {/* Monthly timeline */}
      <div className="mt-6 space-y-7">
        {groups.map((g, gi) => (
          <div key={g.key}>
            {/* Monthly summary */}
            <div className="mb-3 flex items-end justify-between px-1">
              <div>
                <p className="font-bold">{g.label}</p>
                <p className="text-xs text-mute">
                  {g.items.length} shifts · {hoursLabel(sumHours(g.items))}
                </p>
              </div>
              <p className="text-lg font-extrabold tabular-nums text-blood-bright">
                {currency(sumGross(g.items))}
              </p>
            </div>

            {/* Timeline */}
            <div className="relative ml-2 space-y-2.5 border-l border-white/10 pl-4">
              {g.items.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(gi * 0.05 + i * 0.04, 0.4) }}
                  onClick={() => openEdit(s)}
                  className="relative flex w-full items-center gap-3 rounded-3xl glass p-4 text-left transition active:scale-[0.98]"
                >
                  <span className="absolute -left-[21.5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-blood-bright ring-4 ring-base" />
                  <div className="grid h-12 w-12 flex-shrink-0 flex-col place-items-center rounded-2xl bg-blood/15 leading-none text-blood-bright">
                    <span className="text-base font-extrabold">
                      {new Date(s.date + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[9px] font-semibold uppercase">
                      {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {to12Hour(s.startTime)} – {to12Hour(s.endTime)}
                    </p>
                    <p className="text-xs text-mute">
                      {hoursLabel(s.hoursWorked)}
                      {s.breakMinutes > 0 && ` · ${s.breakMinutes}m break`}
                    </p>
                    {s.notes && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-faint">
                        <StickyNote size={11} /> {s.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-bold tabular-nums">{currency(s.grossPay)}</p>
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <GlassCard className="p-10 text-center">
            <p className="text-lg font-semibold">
              {shifts.length === 0 ? 'No shifts yet' : 'No matching shifts'}
            </p>
            <p className="mt-1 text-sm text-mute">
              {shifts.length === 0
                ? 'Tap the + button to log your first shift.'
                : 'Try a different search or filter.'}
            </p>
          </GlassCard>
        )}
      </div>
        </>
      )}

      <ShiftSheet
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        defaultDate={view === 'calendar' ? selectedDay : null}
      />
    </div>
  )
}
