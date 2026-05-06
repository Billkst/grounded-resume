'use client'

import { motion } from 'framer-motion'

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-10"
      style={{
        background: 'rgba(10, 10, 15, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="text-lg font-bold tracking-tight text-white">
        Grounded Resume
      </div>
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="px-5 py-2 bg-white text-[#0A0A0F] text-sm font-semibold rounded-lg transition-colors hover:bg-white/90"
      >
        开始使用
      </motion.button>
    </motion.nav>
  )
}
