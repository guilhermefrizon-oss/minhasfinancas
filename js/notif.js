/* ══════ NOTIFICAÇÕES ══════ */
function urgencyOf(d){if(!d.venc)return 999;const today=new Date();today.setHours(0,0,0,0);return Math.round((new Date(d.venc+'T00:00:00')-today)/(1000*60*60*24));}
function updateNotifBadge(){
  const count=DATA.despesas.filter(d=>(d.status==='Falta Pagar'||d.status==='Débito auto')&&d.venc&&urgencyOf(d)>=0&&urgencyOf(d)<=3).length;
  document.getElementById('notif-badge-nav').textContent=count||'';
  const bb=document.getElementById('bn-badge');
  if(bb) bb.textContent=count||'';
  const sb=document.getElementById('sidebar-badge');
  if(sb) sb.textContent=count||'';
  // Badge no botão de notif do header (mobile)
  const hb=document.getElementById('header-notif-badge');
  if(hb) hb.textContent=count||'';
}
function renderNotif(){
  updateNotifBadge();
  const iminentes=DATA.despesas.filter(d=>(d.status==='Falta Pagar'||d.status==='Débito auto')&&d.venc&&urgencyOf(d)>=0&&urgencyOf(d)<=3).sort((a,b)=>urgencyOf(a)-urgencyOf(b));
  if(!iminentes.length){
    document.getElementById('notif-list').innerHTML=`
      <div style="text-align:center;padding:3rem 1rem">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <div style="font-size:16px;font-weight:700;color:var(--text)">Tudo em dia!</div>
        <div style="font-size:13px;color:var(--text3);margin-top:6px">Nenhuma conta vence nos próximos 3 dias.</div>
      </div>`;
    return;
  }
  document.getElementById('notif-list').innerHTML=iminentes.map((d,ni)=>{
    const diff=urgencyOf(d);
    const isDebito=d.status==='Débito auto';
    let label,urgColor;
    if(diff===0){label='Vence hoje'; urgColor='var(--amber)';}
    else if(diff===1){label='Vence amanhã'; urgColor='var(--red)';}
    else{label=`Em ${diff} dias`; urgColor='var(--blue)';}
    const nd=`anim-d${Math.min(ni+1,10)}`;
    const statusLabel = isDebito ? 'Débito auto' : 'Falta Pagar';
    const statusColor = isDebito ? 'var(--blue)' : 'var(--amber)';
    const statusBg    = isDebito ? 'rgba(123,140,255,.12)' : 'rgba(245,197,66,.12)';
    return `
    <div class="anim-fade-up ${nd}" style="
      background:var(--surface);
      border:1px solid var(--border);
      border-left:3px solid ${urgColor};
      border-radius:var(--radius);
      padding:14px 16px;
      margin-bottom:10px;
    ">
      <!-- Linha 1: ícone + nome + valor -->
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex-shrink:0">${itemIcon(d.nome,d.icon)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:15px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.nome}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:1px">${mesLabel(d.mes)}</div>
        </div>
        <div style="font-size:16px;font-weight:800;color:var(--red);flex-shrink:0">${d.val>0?fmt(d.val):'—'}</div>
      </div>
      <!-- Linha 2: status + urgência + editar -->
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap">
        <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${statusBg};color:${statusColor}">${statusLabel}</span>
        <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${urgColor}22;color:${urgColor}">${label}</span>
        <div style="flex:1"></div>
        <button class="edit-btn" onclick="openModal(${d.id})" style="padding:4px 10px">✏️ Editar</button>
      </div>
    </div>`;
  }).join('');
}
