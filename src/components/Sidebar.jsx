import { NavLink } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const NAV = [
  { to: '/',          icon: '▦', label: 'Research',       highlight: true },
  { to: '/pulse',     icon: '◉', label: 'Economic Pulse', highlight: true },
  { to: '/adviser',   icon: '✦', label: 'AI Adviser',     highlight: true },
  { to: '/tracker',   icon: '◈', label: 'Portfolio Tracker', highlight: true },
  { to: '/chat',      icon: '◎', label: 'Chat',           highlight: true },
  { to: '/research',  icon: '✎', label: 'Research Inbox' },
  { to: '/watchlist', icon: '★', label: 'My Watchlist' },
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
          marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {user?.email}
        </div>
        {/* Deploy info */}
        <div style={{
          fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)',
          marginBottom:10, paddingBottom:10, borderBottom:'1px solid var(--border)',
          lineHeight:1.6,
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{color:'var(--border2)'}}>v25 · Apex</span>
            <span style={{
              fontSize:8, padding:'1px 6px', borderRadius:3,
              background:'rgba(32,200,120,0.08)', color:'var(--green)',
              border:'1px solid rgba(32,200,120,0.2)', fontWeight:600,
            }}>LIVE</span>
          </div>
          <div style={{color:'var(--muted)', marginTop:2}}>
            Deployed {new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
          </div>
          <div style={{marginTop:4, paddingTop:4, borderTop:'1px solid var(--border)', color:'var(--muted)'}}>
            <div>⟳ Prices: on page load</div>
            <div>⟳ Macro: Sundays 6am UTC</div>
            <div>⟳ Research: daily 11am UTC</div>
            <div>⟳ Digest: Mon 8am ET</div>
            <div>⟳ Alerts: every 15 min</div>
          </div>
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
