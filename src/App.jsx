import { ToastProvider } from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'

/**
 * App — B2B marketplace homepage wiring.
 *
 * The full marketplace page (LeadCard with Tier-2 COA unlock and
 * "Report Inaccurate Lead") lives in src/pages/PublicListings.jsx —
 * mount it on your /marketplace route, AdminReportsPanel on
 * /admin/reports, and SellerCoaUpload inside the seller's listing
 * editor.
 */
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <div className="min-h-screen bg-white text-slate-900 antialiased">
          <Home />
        </div>
      </AuthProvider>
    </ToastProvider>
  )
}
