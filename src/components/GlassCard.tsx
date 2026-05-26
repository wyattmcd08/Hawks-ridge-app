import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  variant?: 'default' | 'red'
  delay?: number
  onClick?: () => void
}

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  delay = 0,
  onClick,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`${variant === 'red' ? 'glass-red' : 'glass'} rounded-[28px] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  )
}
