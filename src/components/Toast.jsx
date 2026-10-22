import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/**
 * Sistem toast untuk tiga notifikasi yang diwajibkan:
 *   - "1 Token Deducted. Lead Unlocked."
 *   - "Report Submitted. Token will be refunded upon verification."
 *   - "Insufficient Token Balance. Please Top-Up."
 *
 * Gaya: korporat hijau/putih (kelas .toast-* dalam fsg.css).
 *
 * Penggunaan:
 *   <ToastProvider> ... </ToastProvider>
 *   const toast = useToast()
 *   toast.success('...') | toast.error('...') | toast.info('...')
 */

const ToastContext = createContext(null)

let nextId = 1

const TONES = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
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
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`toast-item ${TONES[t.tone] || TONES.info}`}>
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="toast-x"
              aria-label="Tutup notifikasi"
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
