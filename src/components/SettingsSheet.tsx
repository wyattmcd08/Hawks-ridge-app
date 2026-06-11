import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import Sheet from './Sheet'
import { Field, PrimaryButton } from './Field'
import { useStore } from '../store/useStore'
import Logo from './Logo'
import { exportShiftsCSV, exportShiftsExcel } from '../utils/export'
import { currency } from '../utils/format'
import type { TaxMode } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

const TAX_MODES: { id: TaxMode; label: string; hint: string }[] = [
  { id: 'dependent', label: 'Dependent', hint: 'Only FICA (7.65%) withheld — no income tax' },
  { id: 'standard', label: 'Standard', hint: 'Estimated federal + Georgia + FICA withholding' },
  { id: 'custom', label: 'Custom %', hint: 'Flat tax percentage you set yourself' },
]

export default function SettingsSheet({ open, onClose }: Props) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const shifts = useStore((s) => s.shifts)

  const [name, setName] = useState(settings.name)
  const [rate, setRate] = useState(settings.hourlyRate)
  const [savings, setSavings] = useState(settings.savingsRate * 100)
  const [start, setStart] = useState(settings.defaultStartTime)
  const [nextPayday, setNextPayday] = useState(settings.nextPayday)
  const [taxMode, setTaxMode] = useState<TaxMode>(settings.taxMode)
  const [customTax, setCustomTax] = useState(settings.customTaxRate * 100)
  const [otEnabled, setOtEnabled] = useState(settings.otEnabled)
  const [otThreshold, setOtThreshold] = useState(settings.otThreshold)
  const [otMultiplier, setOtMultiplier] = useState(settings.otMultiplier)

  useEffect(() => {
    if (open) {
      setName(settings.name)
      setRate(settings.hourlyRate)
      setSavings(settings.savingsRate * 100)
      setStart(settings.defaultStartTime)
      setNextPayday(settings.nextPayday)
      setTaxMode(settings.taxMode)
      setCustomTax(settings.customTaxRate * 100)
      setOtEnabled(settings.otEnabled)
      setOtThreshold(settings.otThreshold)
      setOtMultiplier(settings.otMultiplier)
    }
  }, [open, settings])

  const save = () => {
    updateSettings({
      name,
      hourlyRate: rate,
      savingsRate: Math.max(0, savings) / 100,
      defaultStartTime: start,
      nextPayday,
      taxMode,
      customTaxRate: Math.max(0, customTax) / 100,
      otEnabled,
      otThreshold: Math.max(0, otThreshold),
      otMultiplier: Math.max(1, otMultiplier),
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
            <p className="font-bold">Hawks Ridge Work Tracker</p>
            <p className="text-xs text-mute">Canton, GA · paid biweekly</p>
          </div>
        </div>

        <Field label="Your name" value={name} placeholder="Optional" onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hourly wage" type="number" inputMode="decimal" prefix="$" value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)} />
          <Field label="Savings rate" type="number" inputMode="decimal" suffix="%" value={savings}
            onChange={(e) => setSavings(Number(e.target.value) || 0)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Default start time" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <Field label="Next payday" type="date" value={nextPayday} onChange={(e) => setNextPayday(e.target.value)} />
        </div>
        <p className="px-2 text-xs text-faint">
          Paydays repeat every 14 days after this date — the app rolls forward automatically.
        </p>

        {/* Tax mode */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-sm font-semibold">Tax withholding</p>
          <div className="mt-3 flex gap-1 rounded-xl bg-black/25 p-1">
            {TAX_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setTaxMode(m.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                  taxMode === m.id ? 'bg-blood text-white' : 'text-mute'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-mute">
            {TAX_MODES.find((m) => m.id === taxMode)?.hint}
          </p>
          {taxMode === 'custom' && (
            <div className="mt-3">
              <Field label="Tax percentage" type="number" inputMode="decimal" suffix="%" value={customTax}
                onChange={(e) => setCustomTax(Number(e.target.value) || 0)} />
            </div>
          )}
        </div>

        {/* Overtime rules */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Overtime</p>
              <p className="mt-0.5 text-xs text-mute">
                {otEnabled
                  ? `Past ${otThreshold}h/week pays ${otMultiplier}× — ${currency(rate * otMultiplier)}/hr`
                  : 'All hours paid at your flat rate'}
              </p>
            </div>
            <button
              onClick={() => setOtEnabled(!otEnabled)}
              className={`relative ml-4 h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
                otEnabled ? 'bg-blood' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  otEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {otEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weekly threshold" type="number" inputMode="numeric" suffix="h" value={otThreshold}
                onChange={(e) => setOtThreshold(Number(e.target.value) || 0)} />
              <Field label="Multiplier" type="number" inputMode="decimal" suffix="×" value={otMultiplier}
                onChange={(e) => setOtMultiplier(Number(e.target.value) || 0)} />
            </div>
          )}
        </div>

        {/* Export */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-sm font-semibold">Export your data</p>
          <p className="mt-0.5 text-xs text-mute">{shifts.length} shifts stored on this device</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => exportShiftsCSV(shifts)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 py-3 text-sm font-medium transition active:scale-[0.98]"
            >
              <Download size={16} className="text-blood-bright" /> CSV
            </button>
            <button
              onClick={() => exportShiftsExcel(shifts)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 py-3 text-sm font-medium transition active:scale-[0.98]"
            >
              <FileSpreadsheet size={16} className="text-mint" /> Excel
            </button>
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
