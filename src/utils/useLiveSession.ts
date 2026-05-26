import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

// Returns live elapsed seconds + earnings for the active session, ticking each second.
export function useLiveSession() {
  const session = useStore((s) => s.session)
  const rate = useStore((s) => s.settings.hourlyRate)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!session.isActive) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [session.isActive])

  if (!session.isActive || !session.startTime) {
    return { active: false, seconds: 0, hours: 0, earnings: 0 }
  }

  const start = new Date(session.startTime).getTime()
  const grossSeconds = Math.max(0, (now - start) / 1000)
  const paidSeconds = Math.max(0, grossSeconds - session.breakMinutes * 60)
  const hours = paidSeconds / 3600
  return {
    active: true,
    seconds: paidSeconds,
    hours,
    earnings: hours * rate,
  }
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
}
