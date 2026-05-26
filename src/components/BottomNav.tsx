import { motion } from 'framer-motion'
import { Home, CalendarClock, BarChart3, Target, Play } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { Page } from '../types'

const items: { page: Page; icon: typeof Home; label: string }[] = [
  { page: 'dashboard', icon: Home, label: 'Home' },
  { page: 'shifts', icon: CalendarClock, label: 'Shifts' },
  { page: 'analytics', icon: BarChart3, label: 'Stats' },
  { page: 'goals', icon: Target, label: 'Goals' },
]

export default function BottomNav() {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)
  const sessionActive = useStore((s) => s.session.isActive)
  const startSession = useStore((s) => s.startSession)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center safe-bottom">
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', damping: 24, stiffness: 260 }}
        className="pointer-events-auto mb-3 flex items-center gap-1 rounded-full glass px-2 py-2"
      >
        {items.slice(0, 2).map((it) => (
          <NavButton
            key={it.page}
            {...it}
            active={page === it.page}
            onClick={() => setPage(it.page)}
          />
        ))}

        {/* Center live-session action */}
        <button
          onClick={() => (sessionActive ? setPage('live') : startSession())}
          className="relative mx-1 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-ember to-blood-deep text-white shadow-glow transition active:scale-90"
        >
          {sessionActive && (
            <span className="pulse-ring absolute inset-0 rounded-full" />
          )}
          <Play size={24} fill="white" className="ml-0.5" />
        </button>

        {items.slice(2).map((it) => (
          <NavButton
            key={it.page}
            {...it}
            active={page === it.page}
            onClick={() => setPage(it.page)}
          />
        ))}
      </motion.nav>
    </div>
  )
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full transition active:scale-90"
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-full bg-white/8"
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        />
      )}
      <Icon
        size={21}
        className={active ? 'text-blood-bright' : 'text-mute'}
        strokeWidth={active ? 2.4 : 2}
      />
      <span
        className={`relative text-[10px] font-medium ${
          active ? 'text-ink' : 'text-faint'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
