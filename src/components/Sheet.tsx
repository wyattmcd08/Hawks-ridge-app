import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Sheet({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-[32px] glass border-b-0 px-5 pt-3 pb-8 safe-bottom"
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />
            {title && (
              <h2 className="mb-5 text-2xl font-bold tracking-tight">{title}</h2>
            )}
            <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
