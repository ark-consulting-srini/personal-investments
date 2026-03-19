import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Sidebar from './components/Sidebar'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AIAdviser from './pages/AIAdviser'
import Prices from './pages/Prices'
import EarningsCalendar from './pages/EarningsCalendar'
import Watchlist from './pages/Watchlist'
import Portfolio from './pages/Portfolio'
import News from './pages/News'
import Alerts from './pages/Alerts'
import RiskProfile from './pages/RiskProfile'
import GuruHoldings from './pages/GuruHoldings'
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
          <Route path="/chat" element={<Chat />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/adviser" element={<AIAdviser />} />
          <Route path="/signals" element={<AIAdviser initialTab="signals" />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/earnings" element={<EarningsCalendar />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/news" element={<News />} />
          <Route path="/alerts" element={<Alerts />} />
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
