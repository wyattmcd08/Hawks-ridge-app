import { motion } from 'framer-motion'
import { Square, Play, Coffee, Minus, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import AnimatedNumber from '../components/AnimatedNumber'
import { useLiveSession, formatDuration } from '../utils/useLiveSession'
import { currency, to12Hour } from '../utils/format'

const MESSAGES = [
  "Every minute is money in the bank.",
  "Future you is grateful right now.",
  "Stacking it up, one hour at a time.",
  "This shift is fueling your goals.",
  "Locked in. Keep grinding.",
]

export default function LiveSession() {
  const session = useStore((s) => s.session)
  const settings = useStore((s) => s.settings)
  const startSession = useStore((s) => s.startSession)
  const stopSession = useStore((s) => s.stopSession)
  const setSessionBreak = useStore((s) => s.setSessionBreak)
  const live = useLiveSession()

  if (!session.isActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 pb-32 text-center safe-top">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="relative mb-8"
        >
          <div className="pulse-ring absolute inset-0 rounded-full" />
          <button
            onClick={startSession}
            className="relative grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-ember to-blood-deep text-white shadow-glow transition active:scale-95"
          >
            <Play size={56} fill="white" className="ml-2" />
          </button>
        </motion.div>
        <h1 className="text-3xl font-extrabold tracking-tight">Start your shift</h1>
        <p className="mt-2 max-w-xs text-mute">
          Clock in and watch your earnings climb in real time at{' '}
          {currency(settings.hourlyRate)}/hr.
        </p>
      </div>
    )
  }

  const start = session.startTime ? new Date(session.startTime) : new Date()
  const msg = MESSAGES[start.getMinutes() % MESSAGES.length]

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pb-32 safe-top">
      {/* Status */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex items-center gap-2 rounded-full glass px-4 py-2"
      >
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-mint" />
        <span className="text-sm font-medium">Clocked in since {to12Hour(
          `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        )}</span>
      </motion.div>

      {/* Live earnings */}
      <div className="mt-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-mute">
          Earned this shift
        </p>
        <motion.p
          key="earn"
          className="mt-2 text-7xl font-black tracking-tighter text-gradient-red"
        >
          <AnimatedNumber value={live.earnings} prefix="$" duration={0.4} />
        </motion.p>
      </div>

      {/* Timer ring */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mt-12 grid h-56 w-56 place-items-center"
      >
        <div className="pulse-ring absolute inset-6 rounded-full opacity-40" />
        <div className="absolute inset-0 grid place-items-center rounded-full glass-red">
          <div className="text-center">
            <p className="font-mono text-4xl font-bold tabular-nums">
              {formatDuration(live.seconds)}
            </p>
            <p className="mt-1 text-sm text-white/60">{live.hours.toFixed(2)} hrs paid</p>
          </div>
        </div>
      </motion.div>

      {/* Motivation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 max-w-xs text-center text-lg font-medium text-mute"
      >
        "{msg}"
      </motion.p>

      {/* Break control */}
      <div className="mt-8 flex w-full max-w-xs items-center gap-3 rounded-2xl glass p-3">
        <Coffee size={18} className="ml-1 text-gold" />
        <span className="text-sm text-mute">Unpaid break</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSessionBreak(Math.max(0, session.breakMinutes - 15))}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition active:scale-90"
          >
            <Minus size={14} />
          </button>
          <span className="w-14 text-center text-sm font-semibold tabular-nums">
            {session.breakMinutes} min
          </span>
          <button
            onClick={() => setSessionBreak(session.breakMinutes + 15)}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition active:scale-90"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Stop button */}
      <button
        onClick={stopSession}
        className="mt-6 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-4 font-semibold transition active:scale-[0.98]"
      >
        <Square size={18} fill="currentColor" /> Clock out & save shift
      </button>
    </div>
  )
}
