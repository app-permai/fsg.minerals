import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/**
 * Toast system for the three required notifications:
 *   - "1 Token Deducted. Lead Unlocked."
 *   - "Report Submitted. Token will be refunded upon verification."
 *   - "Insufficient Token Balance. Please Top-Up."
 *
 * Usage:
 *   <ToastProvider> ... </ToastProvider>
 *   const toast = useToast()
 *   toast.success('...') | toast.error('...') | toast.info('...')
 */

const ToastContext = createContext(null)

let nextId = 1

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (message, tone = 'info', duration = 4500) => {
      const id = nextId++
      setToasts((list) => [...list.slice(-3), { id, message, tone }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const toast = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
              TONES[t.tone] || TONES.info
            }`}
          >
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="mt-0.5 opacity-50 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
