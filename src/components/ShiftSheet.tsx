import { useEffect, useState } from 'react'
import Sheet from './Sheet'
import { Field, TextAreaField, PrimaryButton } from './Field'
import { useStore } from '../store/useStore'
import type { Shift } from '../types'
import { computeHours } from '../utils/calculations'
import { currency, hoursLabel, todayISO } from '../utils/format'
import { Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Shift | null
}

export default function ShiftSheet({ open, onClose, editing }: Props) {
  const settings = useStore((s) => s.settings)
  const addShift = useStore((s) => s.addShift)
  const updateShift = useStore((s) => s.updateShift)
  const deleteShift = useStore((s) => s.deleteShift)

  const [date, setDate] = useState(todayISO())
  const [startTime, setStartTime] = useState(settings.defaultStartTime)
  const [endTime, setEndTime] = useState('13:30')
  const [breakMinutes, setBreakMinutes] = useState(0)
  const [rate, setRate] = useState(settings.hourlyRate)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setDate(editing?.date ?? todayISO())
      setStartTime(editing?.startTime ?? settings.defaultStartTime)
      setEndTime(editing?.endTime ?? '13:30')
      setBreakMinutes(editing?.breakMinutes ?? 0)
      setRate(editing?.hourlyRate ?? settings.hourlyRate)
      setNotes(editing?.notes ?? '')
    }
  }, [open, editing, settings])

  const hours = computeHours(startTime, endTime, breakMinutes)
  const gross = hours * rate

  const save = () => {
    const payload = { date, startTime, endTime, breakMinutes, hourlyRate: rate, notes }
    if (editing) updateShift(editing.id, payload)
    else addShift(payload)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit Shift' : 'Add Shift'}>
      <div className="space-y-4">
        {/* Live preview */}
        <div className="glass-red rounded-3xl p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-mute">
            This shift
          </p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">
            {currency(gross)}
          </p>
          <p className="mt-1 text-sm text-mute">
            {hoursLabel(hours)} · {currency(rate)}/hr
          </p>
        </div>

        <Field
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Clock In"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Field
            label="Clock Out"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Unpaid Break"
            type="number"
            inputMode="numeric"
            suffix="min"
            value={breakMinutes || ''}
            placeholder="0"
            onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
          />
          <Field
            label="Hourly Rate"
            type="number"
            inputMode="decimal"
            prefix="$"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
          />
        </div>
        <TextAreaField
          label="Notes"
          value={notes}
          onChange={setNotes}
          placeholder="How was the shift?"
        />

        <PrimaryButton onClick={save} disabled={hours <= 0}>
          {editing ? 'Save Changes' : 'Add Shift'}
        </PrimaryButton>

        {editing && (
          <button
            onClick={() => {
              deleteShift(editing.id)
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-medium text-mute transition active:scale-[0.98]"
          >
            <Trash2 size={16} /> Delete Shift
          </button>
        )}
      </div>
    </Sheet>
  )
}
