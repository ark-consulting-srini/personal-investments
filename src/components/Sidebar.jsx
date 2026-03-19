import { NavLink } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const NAV = [
  { to: '/chat',      icon: '◎', label: 'Chat', highlight: true },
  { to: '/',          icon: '▦', label: 'Dashboard' },
  { to: '/adviser',   icon: '✦', label: 'AI Adviser', highlight: true },
  { to: '/signals',   icon: '◈', label: 'Signals' },
  { to: '/prices',    icon: '△', label: 'Prices' },
  { to: '/earnings',  icon: '◷', label: 'Earnings' },
  { to: '/watchlist', icon: '★', label: 'Watchlist' },
  { to: '/portfolio', icon: '◆', label: 'Portfolio' },
  { to: '/news',      icon: '◎', label: 'News' },
  { to: '/alerts',    icon: '◉', label: 'Alerts' },
  { to: '/guru',      icon: '◈', label: 'Guru Holdings' },
  { to: '/profile',   icon: '◇', label: 'Risk Profile' },
]

export default function Sidebar() {
  const { user } = useAuth()
  return (
    <aside style={{width:220, minHeight:'100vh', background:'var(--surface)',
      borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
      flexShrink:0, position:'sticky', top:0, height:'100vh'}}>
      <div style={{padding:'22px 20px 16px', borderBottom:'1px solid var(--border)'}}>
        <div style={{fontFamily:'var(--font-display)', fontSize:26, letterSpacing:'-0.3px'}}>Apex</div>
        <div style={{fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', marginTop:2, letterSpacing:'0.5px'}}>INVESTMENT RESEARCH</div>
      </div>
      <nav style={{flex:1, padding:'10px 10px', overflowY:'auto'}}>
        {NAV.map(({ to, icon, label, highlight }) => (
          <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10,
            padding:'8px 12px', borderRadius:'var(--radius)',
            marginBottom:2, fontSize:13, fontWeight:500,
            color: isActive?'var(--accent)': highlight?'var(--amber)':'var(--text2)',
            background: isActive?'var(--accent-dim)': highlight?'rgba(244,167,36,0.06)':'transparent',
            border: highlight&&!isActive?'1px solid rgba(244,167,36,0.15)':'1px solid transparent',
            transition:'all 0.15s', textDecoration:'none',
          })}>
            <span style={{fontSize:12, opacity:0.9}}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{padding:'14px 16px', borderTop:'1px solid var(--border)'}}>
        <div style={{fontSize:10, color:'var(--muted)', fontFamily:'var(--font-mono)',
          marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {user?.email}
        </div>
        <button onClick={()=>signOut()}
          style={{width:'100%', padding:'7px 12px', background:'transparent',
            border:'1px solid var(--border2)', color:'var(--text2)',
            borderRadius:'var(--radius)', fontSize:12, fontWeight:500, transition:'all 0.15s'}}
          onMouseEnter={e=>{e.target.style.borderColor='var(--red)';e.target.style.color='var(--red)'}}
          onMouseLeave={e=>{e.target.style.borderColor='var(--border2)';e.target.style.color='var(--text2)'}}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
