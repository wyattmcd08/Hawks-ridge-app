import { useState, useEffect } from 'react'
import Sheet from './Sheet'
import { Field, PrimaryButton } from './Field'
import { useStore } from '../store/useStore'
import Logo from './Logo'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsSheet({ open, onClose }: Props) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)

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

        <PrimaryButton onClick={save}>Save Settings</PrimaryButton>
        <p className="px-2 text-center text-xs text-faint">
          Tax figures are estimates only — not financial advice.
        </p>
      </div>
    </Sheet>
  )
}
