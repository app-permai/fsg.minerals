import { ToastProvider } from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'

/**
 * App — laman utama marketplace dalam reka bentuk korporat
 * hijau/putih asal (src/fsg.css). Logik backend (Supabase RPC,
 * auth, token) tidak berubah — hanya kulit UI.
 */
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Home />
      </AuthProvider>
    </ToastProvider>
  )
}
