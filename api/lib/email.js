import nodemailer from 'nodemailer'

export function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // App Password, not your real password
    },
  })
}

export async function sendEmail({ to, subject, html }) {
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"Apex Alerts" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

// ─── EMAIL TEMPLATES ────────────────────────────────────────────────────────

export function thresholdAlertHtml({ ticker, name, currentPrice, targetPrice, direction, change }) {
  const isAbove = direction === 'above'
  const arrow = isAbove ? '▲' : '▼'
  const color = isAbove ? '#20c878' : '#f05252'
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#111318;border:1px solid #1f2235;border-radius:12px;overflow:hidden;">
  <div style="background:#161820;padding:20px 28px;border-bottom:1px solid #1f2235;">
    <span style="font-size:22px;font-weight:700;color:#e8eaf2;letter-spacing:-0.5px;">Apex</span>
    <span style="font-size:11px;color:#545878;margin-left:10px;font-family:monospace;">PRICE ALERT</span>
  </div>
  <div style="padding:28px;">
    <div style="font-size:13px;color:#9ca3b8;margin-bottom:6px;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;">Threshold triggered</div>
    <div style="font-size:22px;font-weight:700;color:#e8eaf2;letter-spacing:-0.5px;margin-bottom:4px;">
      ${arrow} ${ticker} <span style="color:${color}">${isAbove ? 'rose above' : 'fell below'} $${targetPrice.toFixed(2)}</span>
    </div>
    <div style="font-size:14px;color:#9ca3b8;margin-bottom:24px;">${name}</div>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#0a0c10;border:1px solid #1f2235;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Current Price</div>
        <div style="font-size:18px;font-weight:700;color:#e8eaf2;font-family:monospace;">$${currentPrice.toFixed(2)}</div>
      </div>
      <div style="flex:1;background:#0a0c10;border:1px solid #1f2235;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Your Target</div>
        <div style="font-size:22px;font-weight:700;color:${color};font-family:monospace;">$${targetPrice.toFixed(2)}</div>
      </div>
      <div style="flex:1;background:#0a0c10;border:1px solid #1f2235;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Day Change</div>
        <div style="font-size:22px;font-weight:700;color:${change >= 0 ? '#20c878' : '#f05252'};font-family:monospace;">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</div>
      </div>
    </div>

    <div style="margin-bottom:12px;padding:8px 12px;background:#5b8af010;border-left:2px solid #5b8af0;border-radius:0 4px 4px 0;font-size:11px;color:#8890b8;line-height:1.6;">
      💬 Ask Apex Chat: "What does this move mean for ${ticker}? Should I act on it?"
    </div>
    <a href="${process.env.VITE_APP_URL || 'https://srk-personal-investments.vercel.app'}/chat"
      style="display:block;background:#5b8af0;color:#fff;text-align:center;padding:10px;border-radius:6px;font-weight:600;font-size:13px;text-decoration:none;">
      Open Apex →
    </a>
  </div>
  <div style="padding:10px 24px;border-top:1px solid #1f2235;font-size:9px;color:#545878;font-family:monospace;">
    Apex · Personal alerts · Not financial advice · ${new Date().toUTCString()}
  </div>
</div>
</body></html>`
}

export function bigMoveAlertHtml({ ticker, name, currentPrice, changePct, prevClose }) {
  const up = changePct >= 0
  const color = up ? '#20c878' : '#f05252'
  const arrow = up ? '▲' : '▼'
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#111318;border:1px solid #1f2235;border-radius:12px;overflow:hidden;">
  <div style="background:#161820;padding:20px 28px;border-bottom:1px solid #1f2235;">
    <span style="font-size:22px;font-weight:700;color:#e8eaf2;letter-spacing:-0.5px;">Apex</span>
    <span style="font-size:11px;color:#545878;margin-left:10px;font-family:monospace;">BIG MOVE DETECTED</span>
  </div>
  <div style="padding:28px;">
    <div style="font-size:13px;color:#9ca3b8;margin-bottom:6px;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;">Significant price move</div>
    <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px;">
      <span style="color:#e8eaf2;">${ticker}</span>
      <span style="color:${color};margin-left:12px;">${arrow} ${Math.abs(changePct).toFixed(2)}%</span>
    </div>
    <div style="font-size:14px;color:#9ca3b8;margin-bottom:24px;">${name}</div>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#0a0c10;border:1px solid #1f2235;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;margin-bottom:4px;">Current</div>
        <div style="font-size:20px;font-weight:700;color:#e8eaf2;font-family:monospace;">$${currentPrice.toFixed(2)}</div>
      </div>
      <div style="flex:1;background:#0a0c10;border:1px solid #1f2235;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;margin-bottom:4px;">Prev Close</div>
        <div style="font-size:20px;font-weight:700;color:#9ca3b8;font-family:monospace;">$${prevClose.toFixed(2)}</div>
      </div>
      <div style="flex:1;background:#0a0c10;border:1px solid #1f2235;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;color:#545878;font-family:monospace;text-transform:uppercase;margin-bottom:4px;">Move</div>
        <div style="font-size:20px;font-weight:700;font-family:monospace;color:${color};">${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%</div>
      </div>
    </div>

    <div style="margin-bottom:12px;padding:8px 12px;background:#5b8af010;border-left:2px solid #5b8af0;border-radius:0 4px 4px 0;font-size:11px;color:#8890b8;line-height:1.6;">
      💬 Ask Apex Chat: "What does this move mean for ${ticker}? Should I act on it?"
    </div>
    <a href="${process.env.VITE_APP_URL || 'https://srk-personal-investments.vercel.app'}/chat"
      style="display:block;background:#5b8af0;color:#fff;text-align:center;padding:10px;border-radius:6px;font-weight:600;font-size:13px;text-decoration:none;">
      Open Apex →
    </a>
  </div>
  <div style="padding:10px 24px;border-top:1px solid #1f2235;font-size:9px;color:#545878;font-family:monospace;">
    Apex · Personal alerts · Not financial advice · ${new Date().toUTCString()}
  </div>
</div>
</body></html>`
}

export function weeklyDigestHtml({ stocks, date }) {
  const rows = stocks.map(s => {
    const up = s.changePct >= 0
    const changeColor = up ? '#20c878' : '#f05252'
    const scoreColor = s.score >= 4 ? '#20c878' : s.score === 3 ? '#f4a724' : '#f05252'
    return `
    <tr style="border-bottom:1px solid #1f2235;">
      <td style="padding:10px 12px;font-family:monospace;color:#5b8af0;font-weight:700;font-size:13px;">${s.ticker}</td>
      <td style="padding:10px 12px;color:#e8eaf2;font-size:12px;">${s.name}</td>
      <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:#e8eaf2;text-align:right;">
        ${s.price ? `$${s.price.toFixed(2)}` : '—'}
      </td>
      <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:${changeColor};text-align:right;">
        ${s.changePct != null ? `${up ? '+' : ''}${s.changePct.toFixed(2)}%` : '—'}
      </td>
      <td style="padding:10px 12px;text-align:center;">
        <span style="background:${scoreColor}22;color:${scoreColor};padding:2px 8px;border-radius:4px;font-family:monospace;font-size:11px;font-weight:600;">${s.score}/5</span>
      </td>
    </tr>`
  }).join('')

  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:620px;margin:32px auto;background:#111318;border:1px solid #1f2235;border-radius:12px;overflow:hidden;">
  <div style="background:#161820;padding:20px 28px;border-bottom:1px solid #1f2235;">
    <span style="font-size:22px;font-weight:700;color:#e8eaf2;letter-spacing:-0.5px;">Apex</span>
    <span style="font-size:11px;color:#545878;margin-left:10px;font-family:monospace;">WEEKLY DIGEST</span>
    <div style="font-size:11px;color:#545878;margin-top:4px;font-family:monospace;">${date}</div>
  </div>
  <div style="padding:24px 28px 12px;">
    <div style="font-size:15px;font-weight:600;color:#e8eaf2;margin-bottom:16px;">Your Watchlist — Weekly Summary</div>
    <table style="width:100%;border-collapse:collapse;background:#0a0c10;border-radius:8px;overflow:hidden;border:1px solid #1f2235;">
      <thead>
        <tr style="background:#161820;border-bottom:1px solid #1f2235;">
          <th style="padding:8px 12px;text-align:left;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Ticker</th>
          <th style="padding:8px 12px;text-align:left;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Company</th>
          <th style="padding:8px 12px;text-align:right;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
          <th style="padding:8px 12px;text-align:right;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Day Chg</th>
          <th style="padding:8px 12px;text-align:center;font-size:9px;font-family:monospace;color:#545878;text-transform:uppercase;letter-spacing:0.5px;">Score</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div style="padding:20px 28px;">
    <a href="${process.env.VITE_APP_URL || 'https://srk-personal-investments.vercel.app'}"
      style="display:block;background:#5b8af0;color:#fff;text-align:center;padding:12px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;">
      Open Apex Dashboard →
    </a>
  </div>
  <div style="padding:14px 28px;border-top:1px solid #1f2235;font-size:10px;color:#545878;font-family:monospace;">
    Apex Investment Research · Weekly digest · To unsubscribe, remove companies from your watchlist.
  </div>
</div>
</body></html>`
}
