import { useState, useEffect } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import Sheet from './Sheet'
import { Field, PrimaryButton } from './Field'
import { useStore } from '../store/useStore'
import type { Goal } from '../types'
import { currency } from '../utils/format'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Goal | null
}

const EMOJIS = ['🛻', '🚗', '🧽', '🎓', '✈️', '🏖️', '💪', '🎸', '💻', '🏠', '⌚', '🎮']
const COLORS = ['#e11d2a', '#f5b14c', '#34d399', '#4c9af5', '#a78bfa', '#ff4b3e']

export default function GoalSheet({ open, onClose, editing }: Props) {
  const addGoal = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const contributeToGoal = useStore((s) => s.contributeToGoal)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [color, setColor] = useState(COLORS[0])
  const [target, setTarget] = useState(1000)
  const [current, setCurrent] = useState(0)
  const [contribution, setContribution] = useState(25)

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setEmoji(editing?.emoji ?? EMOJIS[0])
      setColor(editing?.color ?? COLORS[0])
      setTarget(editing?.targetAmount ?? 1000)
      setCurrent(editing?.currentAmount ?? 0)
      setContribution(25)
    }
  }, [open, editing])

  const save = () => {
    const payload = {
      name: name || 'New Goal',
      emoji,
      color,
      targetAmount: target,
      currentAmount: current,
    }
    if (editing) updateGoal(editing.id, payload)
    else addGoal(payload)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit Goal' : 'New Goal'}>
      <div className="space-y-4">
        {/* Quick contribute for existing goals */}
        {editing && (
          <div
            className="rounded-3xl p-5"
            style={{ background: `${color}1a`, border: `1px solid ${color}33` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-mute">
              Add to savings
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setContribution((c) => Math.max(5, c - 5))}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 transition active:scale-90"
              >
                <Minus size={18} />
              </button>
              <p className="flex-1 text-center text-3xl font-extrabold tabular-nums">
                {currency(contribution, 0)}
              </p>
              <button
                onClick={() => setContribution((c) => c + 5)}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 transition active:scale-90"
              >
                <Plus size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                contributeToGoal(editing.id, contribution)
                onClose()
              }}
              className="mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
              style={{ background: color }}
            >
              Add {currency(contribution, 0)}
            </button>
          </div>
        )}

        {/* Emoji picker */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mute">
            Icon
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`grid h-11 w-11 place-items-center rounded-2xl text-xl transition ${
                  emoji === e ? 'scale-110 bg-white/15 ring-2 ring-blood' : 'bg-white/5'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mute">
            Color
          </p>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full transition ${
                  color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-charcoal' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <Field
          label="Goal name"
          value={name}
          placeholder="First truck"
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Target"
            type="number"
            inputMode="decimal"
            prefix="$"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 0)}
          />
          <Field
            label="Saved so far"
            type="number"
            inputMode="decimal"
            prefix="$"
            value={current}
            onChange={(e) => setCurrent(Number(e.target.value) || 0)}
          />
        </div>

        <PrimaryButton onClick={save}>
          {editing ? 'Save Changes' : 'Create Goal'}
        </PrimaryButton>

        {editing && (
          <button
            onClick={() => {
              deleteGoal(editing.id)
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-medium text-mute transition active:scale-[0.98]"
          >
            <Trash2 size={16} /> Delete Goal
          </button>
        )}
      </div>
    </Sheet>
  )
}
