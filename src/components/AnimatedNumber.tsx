import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

interface Props {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export default function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 1,
  className = '',
}: Props) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
