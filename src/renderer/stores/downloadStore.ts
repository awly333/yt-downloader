import { create } from 'zustand'
import type { DownloadTask, DownloadProgress } from '../../shared/types'

export type PendingDelete =
  | { type: 'single'; taskId: string }
  | { type: 'all'; cancelActive: boolean }
  | null

const ACTIVE_STATUSES = ['downloading', 'queued', 'merging'] as const
type ActiveStatus = typeof ACTIVE_STATUSES[number]
function isActive(status: string): status is ActiveStatus {
  return ACTIVE_STATUSES.includes(status as ActiveStatus)
}

interface DownloadStore {
  tasks: DownloadTask[]
  pendingDelete: PendingDelete
  loaded: boolean

  loadHistory: () => Promise<void>
  addTask: (task: DownloadTask) => void
  updateProgress: (progress: DownloadProgress) => void
  removeTask: (taskId: string) => void
  removeTaskAndFile: (taskId: string) => Promise<void>
  clearCompleted: () => void
  clearCompletedAndFiles: () => Promise<void>
  cancelAndRemoveAllActive: () => Promise<void>
  retryTask: (taskId: string) => void
  setPendingDelete: (pending: PendingDelete) => void
}

function getFilePath(task: DownloadTask): string {
  return `${task.options.saveDir}/${task.options.fileName}.${task.options.fileType}`
}

// Debounced save — writes to disk at most once per second
let saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSave(tasks: DownloadTask[]) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    window.electronAPI.saveHistory(tasks)
  }, 1000)
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  tasks: [],
  pendingDelete: null,
  loaded: false,

  loadHistory: async () => {
    const tasks = await window.electronAPI.loadHistory()
    set({ tasks, loaded: true })
  },

  addTask: (task) => {
    set((state) => {
      const next = [task, ...state.tasks]
      debouncedSave(next)
      return { tasks: next }
    })
  },

  updateProgress: (progress) => {
    set((state) => {
      const next = state.tasks.map((task) => {
        if (task.id !== progress.taskId) return task
        return {
          ...task,
          status: progress.status,
          progress: progress.percent,
          speed: progress.speed,
          eta: progress.eta,
          error: progress.error || null,
          filePath: progress.status === 'completed'
            ? getFilePath(task)
            : task.filePath,
        }
      })
      if (progress.status === 'completed' || progress.status === 'failed') {
        debouncedSave(next)
      }
      return { tasks: next }
    })
  },

  removeTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    set((state) => {
      const next = state.tasks.filter((t) => t.id !== taskId)
      debouncedSave(next)
      return { tasks: next }
    })
    // Best-effort: remove the playlist subfolder if it is now empty
    if (task?.options.saveDir) {
      window.electronAPI.deleteEmptyDir(task.options.saveDir)
    }
  },

  removeTaskAndFile: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (task) {
      await window.electronAPI.deleteDownloadFiles(task.options.saveDir, task.options.fileName)
    }
    set((state) => {
      const next = state.tasks.filter((t) => t.id !== taskId)
      debouncedSave(next)
      return { tasks: next }
    })
  },

  clearCompleted: () => {
    set((state) => {
      const next = state.tasks.filter((t) => t.status !== 'completed')
      debouncedSave(next)
      return { tasks: next }
    })
  },

  clearCompletedAndFiles: async () => {
    const completed = get().tasks.filter((t) => t.status === 'completed')
    for (const task of completed) {
      await window.electronAPI.deleteDownloadFiles(task.options.saveDir, task.options.fileName)
    }
    set((state) => {
      const next = state.tasks.filter((t) => t.status !== 'completed')
      debouncedSave(next)
      return { tasks: next }
    })
  },

  // Cancel all in-progress/queued/merging tasks, remove from list.
  // File cleanup is handled inside cancelDownload (after process exits).
  cancelAndRemoveAllActive: async () => {
    const active = get().tasks.filter((t) => isActive(t.status))
    const activeIds = new Set(active.map((t) => t.id))
    for (const task of active) {
      window.electronAPI.cancelDownload(task.id)
    }
    set((state) => {
      const next = state.tasks.filter((t) => !activeIds.has(t.id))
      debouncedSave(next)
      return { tasks: next }
    })
  },

  retryTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task) return

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'queued' as const, progress: 0, speed: '', eta: '', error: null }
          : t
      ),
    }))

    window.electronAPI.startDownload(task.options).then((newTaskId) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, id: newTaskId } : t
        ),
      }))
    })
  },

  setPendingDelete: (pending) => set({ pendingDelete: pending }),
}))
