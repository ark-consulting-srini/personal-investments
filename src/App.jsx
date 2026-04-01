import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Sidebar from './components/Sidebar'
import AuthPage from './pages/AuthPage'
import AIAdviser from './pages/AIAdviser'
// Watchlist, Portfolio, News, Alerts consolidated into MyWatchlist
import RiskProfile from './pages/RiskProfile'
import GuruHoldings from './pages/GuruHoldings'
// Dashboard, Prices, EarningsCalendar, TechAI, Chat consolidated into Research / AIAdviser
import EconomicPulse from './pages/EconomicPulse'
import ResearchInbox from './pages/ResearchInbox'
import MyWatchlist from './pages/MyWatchlist'
import Research from './pages/Research'
import PortfolioTracker from './pages/PortfolioTracker'
import Chat from './pages/Chat'
import './index.css'

function AppLayout() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)', color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12}}>
      Loading…
    </div>
  )
  if (!user) return <AuthPage />
  return (
    <div style={{display:'flex', minHeight:'100vh'}}>
      <Sidebar />
      <main style={{flex:1, minWidth:0, overflow:'auto'}}>
        <Routes>
          <Route path="/" element={<Research />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/prices" element={<Navigate to="/" replace />} />
          <Route path="/earnings" element={<Navigate to="/" replace />} />
          <Route path="/tech" element={<Navigate to="/" replace />} />
          <Route path="/pulse" element={<EconomicPulse />} />
          <Route path="/market" element={<Navigate to="/pulse" replace />} />
          <Route path="/assets" element={<Navigate to="/pulse" replace />} />
          <Route path="/research" element={<ResearchInbox />} />
          <Route path="/adviser" element={<AIAdviser />} />
          <Route path="/tracker" element={<PortfolioTracker />} />
          <Route path="/watchlist" element={<MyWatchlist />} />
          <Route path="/portfolio" element={<Navigate to="/watchlist" replace />} />
          <Route path="/news" element={<Navigate to="/watchlist" replace />} />
          <Route path="/alerts" element={<Navigate to="/watchlist" replace />} />
          <Route path="/guru" element={<GuruHoldings />} />
          <Route path="/profile" element={<RiskProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
