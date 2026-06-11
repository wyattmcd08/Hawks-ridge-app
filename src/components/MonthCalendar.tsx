import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Shift } from '../types'
import { resolveNextPayday } from '../utils/calculations'
import { compactCurrency, currency, hoursLabel } from '../utils/format'

interface Props {
  shifts: Shift[]
  anchorPayday: string
  selected: string | null
  onSelect: (date: string) => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MonthCalendar({ shifts, anchorPayday, selected, onSelect }: Props) {
  const [month, setMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const byDay = useMemo(() => {
    const map = new Map<string, { gross: number; hours: number; count: number }>()
    for (const s of shifts) {
      const cur = map.get(s.date) ?? { gross: 0, hours: 0, count: 0 }
      cur.gross += s.grossPay
      cur.hours += s.hoursWorked
      cur.count += 1
      map.set(s.date, cur)
    }
    return map
  }, [shifts])

  // Any date a whole number of 14-day periods from the anchor payday is a payday.
  const paydayRef = useMemo(
    () => new Date(resolveNextPayday(anchorPayday) + 'T00:00:00').getTime(),
    [anchorPayday],
  )
  const isPayday = (d: Date) =>
    Math.round((d.getTime() - paydayRef) / 86400000) % 14 === 0

  const todayKey = iso(new Date())
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const leadingBlanks = month.getDay()

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ]

  const monthShifts = shifts.filter((s) => s.date.startsWith(monthKey))
  const monthGross = monthShifts.reduce((a, s) => a + s.grossPay, 0)
  const monthHours = monthShifts.reduce((a, s) => a + s.hoursWorked, 0)

  const move = (dir: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + dir, 1))

  return (
    <div className="glass rounded-[28px] p-5">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => move(-1)}
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-mute transition active:scale-90"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-bold">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => move(1)}
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-mute transition active:scale-90"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mt-4 grid grid-cols-7 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[11px] font-semibold text-faint">
            {w}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />
          const key = iso(d)
          const data = byDay.get(key)
          const isToday = key === todayKey
          const isSelected = key === selected
          const payday = isPayday(d)
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`relative mx-auto flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition active:scale-90 ${
                isSelected
                  ? 'bg-blood text-white'
                  : data
                    ? 'bg-blood/15'
                    : ''
              } ${isToday && !isSelected ? 'ring-1 ring-blood-bright' : ''}`}
            >
              {payday && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
              )}
              <span
                className={`text-sm font-semibold leading-none ${
                  isSelected ? 'text-white' : data ? 'text-ink' : 'text-mute'
                }`}
              >
                {d.getDate()}
              </span>
              {data && (
                <span
                  className={`mt-0.5 text-[9px] font-bold leading-none tabular-nums ${
                    isSelected ? 'text-white/80' : 'text-blood-bright'
                  }`}
                >
                  {compactCurrency(data.gross)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend + month summary */}
      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3.5">
        <div className="flex items-center gap-3 text-[11px] text-mute">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-md bg-blood/40" /> worked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> payday
          </span>
        </div>
        <p className="text-xs font-semibold tabular-nums">
          {monthShifts.length > 0
            ? `${currency(monthGross, 0)} · ${hoursLabel(monthHours)}`
            : 'No shifts'}
        </p>
      </div>
    </div>
  )
}
