import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/useStore'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Shifts from './pages/Shifts'
import Analytics from './pages/Analytics'
import Goals from './pages/Goals'
import LiveSession from './pages/LiveSession'

const pages = {
  dashboard: Dashboard,
  shifts: Shifts,
  analytics: Analytics,
  goals: Goals,
  live: LiveSession,
}

export default function App() {
  const page = useStore((s) => s.page)
  const Current = pages[page]

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Current />
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
