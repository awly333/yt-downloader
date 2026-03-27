import { motion, AnimatePresence } from 'framer-motion'
import { Download } from 'lucide-react'
import { useDownloadStore } from '../stores/downloadStore'
import { DownloadItem } from './DownloadItem'

export function DownloadList() {
  const { tasks } = useDownloadStore()

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="
          w-11 h-11 rounded-full
          bg-surface-sunken
          flex items-center justify-center
          mb-3
        ">
          <Download className="w-5 h-5 text-text-placeholder" />
        </div>
        <p className="text-[13px] text-text-tertiary text-center leading-relaxed">
          No downloads yet
        </p>
        <p className="text-[11px] text-text-placeholder text-center mt-1">
          Paste a URL to get started
        </p>
      </motion.div>
    )
  }

  return (
    <div className="py-1">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <DownloadItem key={task.id} task={task} />
        ))}
      </AnimatePresence>
    </div>
  )
}
