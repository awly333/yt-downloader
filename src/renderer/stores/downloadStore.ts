import { create } from 'zustand'
import type { DownloadTask, DownloadProgress } from '../../shared/types'

export type PendingDelete =
  | { type: 'single'; taskId: string }
  | { type: 'all' }
  | null

interface DownloadStore {
  tasks: DownloadTask[]
  pendingDelete: PendingDelete

  addTask: (task: DownloadTask) => void
  updateProgress: (progress: DownloadProgress) => void
  removeTask: (taskId: string) => void
  removeTaskAndFile: (taskId: string) => Promise<void>
  clearCompleted: () => void
  clearCompletedAndFiles: () => Promise<void>
  retryTask: (taskId: string) => void
  setPendingDelete: (pending: PendingDelete) => void
}

function getFilePath(task: DownloadTask): string {
  return `${task.options.saveDir}/${task.options.fileName}.${task.options.fileType}`
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  tasks: [],
  pendingDelete: null,

  addTask: (task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
    }))
  },

  updateProgress: (progress) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
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
      }),
    }))
  },

  removeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }))
  },

  removeTaskAndFile: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (task) {
      await window.electronAPI.deleteDownloadFiles(task.options.saveDir, task.options.fileName)
    }
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }))
  },

  clearCompleted: () => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.status !== 'completed'),
    }))
  },

  clearCompletedAndFiles: async () => {
    const completed = get().tasks.filter((t) => t.status === 'completed')
    for (const task of completed) {
      await window.electronAPI.deleteDownloadFiles(task.options.saveDir, task.options.fileName)
    }
    set((state) => ({
      tasks: state.tasks.filter((t) => t.status !== 'completed'),
    }))
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
