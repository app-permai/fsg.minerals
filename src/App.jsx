import { ToastProvider } from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './i18n/LanguageContext'
import Home from './pages/Home'

/**
 * App — laman utama marketplace dalam reka bentuk korporat
 * hijau/putih asal (src/fsg.css). Logik backend (Supabase RPC,
 * auth, token) tidak berubah — hanya kulit UI.
 *
 * LanguageProvider berada paling luar supaya toast dan modal
 * (yang juga memaparkan teks) boleh menggunakan t() yang sama.
 */
export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <Home />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}
