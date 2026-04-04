/* ══════ BUSCA GLOBAL ══════ */
/* ══════ BUSCA GLOBAL ══════ */
let _gsFilter = 'all';

function openGlobalSearch(){
  const el = document.getElementById('global-search-overlay');
  el.classList.add('open');
  setTimeout(() => document.getElementById('gs-input').focus(), 80);
  renderGlobalSearch();
}
function closeGlobalSearch(){
  document.getElementById('global-search-overlay').classList.remove('open');
  document.getElementById('gs-input').value = '';
  _gsFilter = 'all';
  setGsFilter('all');
}
function setGsFilter(f){
  _gsFilter = f;
  ['all','desp','rec','pago','falta','auto'].forEach(k => {
    document.getElementById('gs-chip-'+k)?.classList.toggle('active', k===f);
  });
  renderGlobalSearch();
}

function renderGlobalSearch(){
  const q = document.getElementById('gs-input').value.trim().toLowerCase();
  const clearBtn = document.getElementById('gs-clear');
  if(clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  // Montar pool de itens
  let items = [];

  // Despesas
  if(_gsFilter === 'all' || _gsFilter === 'desp' || _gsFilter === 'pago' || _gsFilter === 'falta' || _gsFilter === 'auto'){
    DATA.despesas.forEach(d => {
      if(_gsFilter === 'pago'  && d.status !== 'Pago') return;
      if(_gsFilter === 'falta' && d.status !== 'Falta Pagar') return;
      if(_gsFilter === 'auto'  && d.status !== 'Débito auto') return;
      if(q && !d.nome?.toLowerCase().includes(q) && !d.cat?.toLowerCase().includes(q) && !d.pag?.toLowerCase().includes(q)) return;
      items.push({ ...d, _tipo: 'desp' });
    });
  }

  // Receitas
  if(_gsFilter === 'all' || _gsFilter === 'rec'){
    DATA.receitas.forEach(r => {
      if(q && !r.nome?.toLowerCase().includes(q) && !r.cat?.toLowerCase().includes(q)) return;
      items.push({ ...r, _tipo: 'rec' });
    });
  }

  // Ordenar por mês (mais recente primeiro)
  items.sort((a,b) => (b.mes||'').localeCompare(a.mes||''));

  // Agrupar por mês
  const byMonth = {};
  items.forEach(it => {
    const m = it.mes || '0000-00';
    if(!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(it);
  });

  const summary = document.getElementById('gs-summary');
  const results = document.getElementById('gs-results');
  const totalVal = items.reduce((s,i) => s + (i.val||0), 0);
  const count = items.length;

  if(!q && _gsFilter === 'all'){
    summary.textContent = '';
    results.innerHTML = `<div class="gs-empty"><div class="gs-empty-icon">🔍</div><div class="gs-empty-text">Digite para buscar</div><div style="font-size:12px;margin-top:4px">Busque por nome, categoria ou forma de pagamento</div></div>`;
    return;
  }

  if(!count){
    summary.textContent = '';
    results.innerHTML = `<div class="gs-empty"><div class="gs-empty-icon">😶</div><div class="gs-empty-text">Nenhum resultado</div><div style="font-size:12px;margin-top:4px">Tente outros termos ou filtros</div></div>`;
    return;
  }

  const totalDesp = items.filter(i=>i._tipo==='desp').reduce((s,i)=>s+(i.val||0),0);
  const totalRec  = items.filter(i=>i._tipo==='rec').reduce((s,i)=>s+(i.val||0),0);
  let sumParts = [];
  if(totalDesp > 0) sumParts.push(`<span style="color:var(--red)">${fmt(totalDesp)}</span> em despesas`);
  if(totalRec  > 0) sumParts.push(`<span style="color:var(--green)">${fmt(totalRec)}</span> em receitas`);
  summary.innerHTML = `${count} resultado${count>1?'s':''} · ${sumParts.join(' · ')}`;

  let html = '';
  Object.keys(byMonth).sort((a,b)=>b.localeCompare(a)).forEach(m => {
    const group = byMonth[m];
    const gTotal = group.reduce((s,i)=>s+(i.val||0),0);
    const mLabel = mesLabel(m);
    html += `<div class="gs-month-label">${mLabel}<span class="gs-month-total">${fmt(gTotal)}</span></div>`;
    group.forEach(it => {
      const isRec = it._tipo === 'rec';
      const iconHtml = it.icon ? `<div style="width:22px;height:22px">${it.icon}</div>` : `<span style="font-size:18px">${isRec ? '💰' : '💳'}</span>`;
      const catLabel2 = it.cat ? catLabel(it.cat) : '';
      const metaParts = [catLabel2, it.pag].filter(Boolean);
      const statusColor = it.status==='Pago'||it.status==='Recebido' ? 'var(--green)' : it.status==='Falta Pagar' ? 'var(--red)' : 'var(--amber)';
      html += `<div class="gs-item" onclick="gsGoTo(${JSON.stringify(it._tipo)}, ${JSON.stringify(it.mes)})">
        <div class="gs-icon">${iconHtml}</div>
        <div class="gs-info">
          <div class="gs-name">${it.nome||'—'}</div>
          <div class="gs-meta">${metaParts.join(' · ')}</div>
        </div>
        <div class="gs-right">
          <div class="gs-val ${isRec?'rec':'desp'}">${it.val ? fmt(it.val) : '—'}</div>
          ${it.status ? `<div class="gs-status" style="color:${statusColor}">${it.status}</div>` : ''}
        </div>
      </div>`;
    });
  });
  results.innerHTML = html;
}

function gsGoTo(tipo, mes){
  closeGlobalSearch();
  if(tipo === 'rec'){
    showPage('receitas');
    if(mes && typeof setRecMonth === 'function') setRecMonth(mes);
  } else {
    showPage('despesas');
    if(mes && typeof setDespMonth === 'function') setDespMonth(mes);
  }
}

// Fechar com Escape
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && document.getElementById('global-search-overlay').classList.contains('open')){
    closeGlobalSearch();
  }
});
