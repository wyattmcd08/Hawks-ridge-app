import { useState, useEffect } from 'react'
import Sheet from './Sheet'
import { Field, PrimaryButton } from './Field'
import { useStore } from '../store/useStore'
import Logo from './Logo'
import { shiftsInWeek, sumHours } from '../utils/calculations'
import { currency, hoursLabel } from '../utils/format'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsSheet({ open, onClose }: Props) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const shifts = useStore((s) => s.shifts)

  const [name, setName] = useState(settings.name)
  const [rate, setRate] = useState(settings.hourlyRate)
  const [savings, setSavings] = useState(settings.savingsRate * 100)
  const [start, setStart] = useState(settings.defaultStartTime)
  const [isDependent, setIsDependent] = useState(settings.isDependent)

  useEffect(() => {
    if (open) {
      setName(settings.name)
      setRate(settings.hourlyRate)
      setSavings(settings.savingsRate * 100)
      setStart(settings.defaultStartTime)
      setIsDependent(settings.isDependent)
    }
  }, [open, settings])

  // Overtime math — uses local `rate` so it updates live as user edits
  const weekShifts = shiftsInWeek(shifts, new Date())
  const totalHours = sumHours(weekShifts)
  const regularHours = Math.min(40, totalHours)
  const otHours = Math.max(0, totalHours - 40)
  const hoursToOT = Math.max(0, 40 - totalHours)
  const regularPay = regularHours * rate
  const otPay = otHours * rate * 1.5
  const grossWithOT = regularPay + otPay
  const grossFlat = totalHours * rate
  const otBonus = grossWithOT - grossFlat
  // Bar uses 50h as ceiling so OT portion is visible
  const BAR_MAX = Math.max(50, totalHours)
  const greenPct = (regularHours / BAR_MAX) * 100
  const goldPct = (otHours / BAR_MAX) * 100

  const save = () => {
    updateSettings({
      name,
      hourlyRate: rate,
      savingsRate: savings / 100,
      defaultStartTime: start,
      isDependent,
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <div className="mb-2 flex items-center gap-3 rounded-3xl glass p-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl glass-red">
            <Logo size={28} />
          </div>
          <div>
            <p className="font-bold">Hawks Ridge Finance</p>
            <p className="text-xs text-mute">Canton, GA · hourly tracker</p>
          </div>
        </div>

        <Field
          label="Your name"
          value={name}
          placeholder="Optional"
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Hourly rate"
          type="number"
          inputMode="decimal"
          prefix="$"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value) || 0)}
        />
        <Field
          label="Auto-savings rate"
          type="number"
          inputMode="decimal"
          suffix="%"
          value={savings}
          onChange={(e) => setSavings(Number(e.target.value) || 0)}
        />
        <Field
          label="Default start time"
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />

        {/* Dependent toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-ink">Filed as dependent</p>
            <p className="mt-0.5 text-xs text-mute">Only FICA withheld — no income tax</p>
          </div>
          <button
            onClick={() => setIsDependent(!isDependent)}
            className={`relative ml-4 h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
              isDependent ? 'bg-blood' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                isDependent ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Overtime explainer */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base" style={{ color: '#f0c040' }}>⚡</span>
            <p className="text-sm font-semibold">Overtime — How It Works</p>
          </div>

          <p className="text-xs leading-relaxed text-mute">
            Hours past{' '}
            <span className="font-semibold text-ink">40/week</span> are paid at{' '}
            <span className="font-semibold" style={{ color: '#f0c040' }}>1.5× your hourly rate</span>
            {rate > 0 && (
              <span className="text-faint"> — that's {currency(rate * 1.5)}/hr at your current rate</span>
            )}
            .
          </p>

          {/* Progress bar + this-week numbers */}
          <div className="rounded-xl bg-black/25 px-3 py-3 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">This week</p>

            {/* 40-hour progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-mute">{hoursLabel(totalHours)} worked</span>
                {otHours > 0 ? (
                  <span style={{ color: '#f0c040' }} className="font-semibold">
                    ⚡ {hoursLabel(otHours)} overtime
                  </span>
                ) : (
                  <span className="text-faint">
                    {hoursLabel(hoursToOT)} until OT kicks in
                  </span>
                )}
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="flex h-full">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${greenPct}%`, background: '#006747' }}
                  />
                  {otHours > 0 && (
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${goldPct}%`, background: '#f0c040' }}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-faint">
                <span>0h</span>
                <span className="text-mute">40h threshold</span>
                <span>{hoursLabel(BAR_MAX)}</span>
              </div>
            </div>

            {/* Pay math */}
            {totalHours > 0 ? (
              <div className="space-y-1.5 pt-1">
                {/* Regular row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: '#006747' }} />
                    <span className="text-xs text-mute">
                      Regular — {hoursLabel(regularHours)} × {currency(rate)}/hr
                    </span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{currency(regularPay)}</span>
                </div>

                {/* OT row — always shown, grayed out when zero */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: otHours > 0 ? '#f0c040' : 'rgba(255,255,255,0.15)' }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: otHours > 0 ? '#f0c040' : '#565e59' }}
                    >
                      Overtime — {hoursLabel(otHours)} × {currency(rate * 1.5)}/hr
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: otHours > 0 ? '#f0c040' : '#565e59' }}
                  >
                    {otHours > 0 ? `+${currency(otPay)}` : '$0.00'}
                  </span>
                </div>

                {/* Divider + gross total */}
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-xs font-semibold text-ink">Gross this week</span>
                  <span className="text-xs font-bold tabular-nums">{currency(grossWithOT)}</span>
                </div>

                {/* OT bonus badge — only when OT is active */}
                {otBonus > 0 && (
                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: 'rgba(240,192,64,0.1)',
                      border: '1px solid rgba(240,192,64,0.25)',
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#f0c040' }}>
                        OT bonus earned
                      </p>
                      <p className="text-[10px] text-faint">
                        vs. {currency(grossFlat)} at flat rate
                      </p>
                    </div>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: '#f0c040' }}>
                      +{currency(otBonus)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-faint text-center py-0.5">
                No shifts logged this week yet
              </p>
            )}
          </div>
        </div>

        <PrimaryButton onClick={save}>Save Settings</PrimaryButton>
        <p className="px-2 text-center text-xs text-faint">
          Tax figures are estimates only — not financial advice.
        </p>
      </div>
    </Sheet>
  )
}
