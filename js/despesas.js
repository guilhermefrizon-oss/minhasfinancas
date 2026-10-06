/* ── Tipo da despesa ── */
const CATS_FIXAS_DEFAULT = ['Moradia','Gastos Fixos','Transporte','Streaming','Financeiro','Saúde'];
function guessTipo(cat){
  const main = (cat||'').split(' · ')[0];
  return CATS_FIXAS_DEFAULT.includes(main) ? 'fixa' : 'variavel';
}
function installmentBadge(d){return d.parcelamentoId&&d.parcelaAtual&&d.parcelasTotal?`<span class="installment-badge">${d.parcelaAtual}/${d.parcelasTotal}</span>`:'';}
function mobileGestureHint(doneLabel){return`<div class="mobile-gesture-hint"><span>Toque no lançamento para edição rápida.</span><span>Deslize → para ${doneLabel.toLowerCase()} · ← para enviar à lixeira.</span></div>`;}


/* Shared feedback for filters in both lists. Values are escaped before rendering. */
function historyEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function historyActiveFilters(type){
  const status=type==='rec'?recFilterStatus:despFilterStatus;
  const cat=type==='rec'?recFilterCat:despFilterCat;
  const search=document.getElementById(type+'-search')?.value.trim()||'';
  const filters=[];
  if(status!=='all')filters.push({key:'status',label:'Status: '+status});
  if(cat!=='all')filters.push({key:'cat',label:'Categoria: '+(type==='rec'?cat:catLabel(cat))});
  if(search)filters.push({key:'search',label:'Busca: '+search});
  return filters;
}
function removeHistoryFilter(type,key){
  if(key==='search'){
    const input=document.getElementById(type+'-search');if(input)input.value='';
    document.getElementById(type+'-search-wrap')?.classList.remove('has-value','search-open');
    if(type==='rec')renderRecTable();else renderDespTable();
  }else if(type==='rec')setRecFilter(key,'all');else setDespFilter(key,'all');
}
function updateHistoryFilterSummary(type,shown,total){
  const filters=historyActiveFilters(type);
  const box=document.getElementById(type+'-filter-summary');
  const clear=document.getElementById(type+'-clear-filters');
  if(clear){clear.style.display=filters.length?'inline-flex':'none';clear.textContent='Limpar filtros';}
  if(box)box.innerHTML=`<p class="history-result-count" aria-live="polite">${shown} de ${total} ${type==='rec'?'receitas':'despesas'} neste mês${filters.length?' · filtros ativos':''}</p>`+
    (filters.length?`<div class="history-active-filters">${filters.map(f=>`<button type="button" class="history-filter-chip" onclick="removeHistoryFilter('${type}','${f.key}')" aria-label="${historyEscape('Remover '+f.label)}">${historyEscape(f.label)}<span aria-hidden="true">×</span></button>`).join('')}</div>`:'');
  return filters.length>0;
}
function historyEmptyState(type,total){
  const filtered=total>0&&historyActiveFilters(type).length>0;
  return `<div class="history-empty"><strong>${filtered?'Nenhum lançamento corresponde aos filtros.':`Nenhuma ${type==='rec'?'receita':'despesa'} neste mês.`}</strong>`+
    (filtered?`<p>Há ${total} ${type==='rec'?'receitas':'despesas'} neste mês. Limpe os filtros para ver todas.</p><button type="button" class="history-empty-clear" onclick="${type==='rec'?'clearRecFilters':'clearDespFilters'}()">Limpar filtros</button>`:'')+'</div>';
}
function mobilePaymentControl(type,id,done,automatic=false){
  const isRec=type==='rec';
  const label=done?(isRec?'Recebido: editar receita':'Pago: editar despesa'):(isRec?'Marcar como recebido':'Marcar como pago');
  const action=done?(isRec?'openRecModal':'openModal'):(isRec?'markRevenueReceived':'markExpensePaid');
  return `<button type="button" class="mob-toggle-btn ${done?'pago':automatic?'debito':''}" onclick="event.stopPropagation();${action}(${id})" title="${label}" aria-label="${label}">${uiIcon(done?'check':'circle',20)}</button>`;
}

/* ── Painel de ordenação mobile ── */
const SORT_OPTIONS = [
  { key:'venc',   label:'Vencimento',  icon:'calendar' },
  { key:'val',    label:'Valor',       icon:'wallet' },
  { key:'nome',   label:'Nome',        icon:'type' },
  { key:'cat',    label:'Categoria',   icon:'tag' },
  { key:'status', label:'Status',      icon:'check' },
  { key:'tipo',   label:'Tipo (Fixa/Variável)', icon:'pin' },
];
const REC_SORT_OPTIONS = [
  { key:'val',    label:'Valor',     icon:'wallet' },
  { key:'nome',   label:'Nome',      icon:'type' },
  { key:'cat',    label:'Categoria', icon:'tag' },
  { key:'status', label:'Status',    icon:'check' },
];
let mobileSortType='desp';

function openSortPanel(type='desp'){
  const overlay = document.getElementById('sort-panel-overlay');
  const panel   = document.getElementById('sort-panel');
  if(!overlay||!panel) return;
  mobileSortType=type;
  const options=type==='rec'?REC_SORT_OPTIONS:SORT_OPTIONS;
  const activeKey=type==='rec'?recSortKey:despSortKey;
  const activeDir=type==='rec'?recSortDir:despSortDir;
  // Monta opções
  document.getElementById('sort-options').innerHTML = options.map(o => {
    const active = activeKey === o.key;
    const dir = active ? (activeDir === 1 ? ' ↑' : ' ↓') : '';
    return `<button onclick="applySortMobile('${o.key}')"
      style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;border:1px solid ${active?'var(--purple)':'var(--border)'};background:${active?'var(--surface3)':'var(--surface2)'};font-family:var(--font);font-size:14px;font-weight:${active?700:500};color:${active?'var(--purple)':'var(--text)'};cursor:pointer;text-align:left;width:100%;transition:all .15s">
      <span style="display:inline-flex">${uiIcon(o.icon,16)}</span>
      <span style="flex:1">${o.label}</span>
      <span style="font-size:12px;color:var(--text3)">${dir}</span>
    </button>`;
  }).join('');
  overlay.style.display = 'block';
  panel.style.display = 'block';
  requestAnimationFrame(()=>{ panel.style.transform = 'translateY(0)'; });
}

function closeSortPanel(){
  const panel = document.getElementById('sort-panel');
  if(panel){ panel.style.transform='translateY(100%)'; setTimeout(()=>{ panel.style.display='none'; document.getElementById('sort-panel-overlay').style.display='none'; },300); }
}

function applySortMobile(key){
  if(mobileSortType==='rec') sortRec(key); else sortDesp(key);
  closeSortPanel();
}

function toggleCompactSearch(type){
  const wrap=document.getElementById(type+'-search-wrap');
  const input=document.getElementById(type+'-search');
  if(!wrap||!input) return;
  const willOpen=!wrap.classList.contains('search-open');
  document.querySelectorAll('.history-search.search-open').forEach(el=>el.classList.remove('search-open'));
  if(willOpen){
    wrap.classList.add('search-open');
    requestAnimationFrame(()=>input.focus());
  }
}
function closeCompactSearch(type){
  setTimeout(()=>document.getElementById(type+'-search-wrap')?.classList.remove('search-open'),120);
}
function handleCompactSearch(type){
  const wrap=document.getElementById(type+'-search-wrap');
  const input=document.getElementById(type+'-search');
  wrap?.classList.toggle('has-value',!!input?.value.trim());
  if(type==='rec') renderRecTable(); else renderDespTable();
}

/* ══════ DESPESAS ══════ */
/* FIX 2: Ordenação */
let _despPrefs={};try{_despPrefs=JSON.parse(localStorage.getItem('gastos_view_desp')||'{}');}catch(e){}
let despSortKey=_despPrefs.sortKey||'venc', despSortDir=_despPrefs.sortDir||1;
let despFilterStatus=_despPrefs.status||'all', despFilterCat=_despPrefs.cat||'all';
function saveDespViewPrefs(){localStorage.setItem('gastos_view_desp',JSON.stringify({sortKey:despSortKey,sortDir:despSortDir,status:despFilterStatus,cat:despFilterCat}));}

function setDespFilter(type, value){
  if(type==='status') despFilterStatus=value;
  if(type==='cat') despFilterCat=value;
  saveDespViewPrefs();
  renderDespTable();
}
function clearDespFilters(){
  despFilterStatus='all'; despFilterCat='all';
  saveDespViewPrefs();
  const search=document.getElementById('desp-search'); if(search) search.value='';
  document.getElementById('desp-search-wrap')?.classList.remove('has-value','search-open');
  renderDespTable();
}
function updateDespCategoryFilter(){
  const select=document.getElementById('desp-cat-filter');
  if(!select) return;
  const categories=[...new Set(DATA.despesas.map(d=>d.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(despFilterCat!=='all'&&!categories.includes(despFilterCat)) despFilterCat='all';
  select.innerHTML=`<option value="all">Categoria</option>`+categories.map(cat=>`<option value="${historyEscape(cat)}">${historyEscape(catLabel(cat))}</option>`).join('');
  select.value=despFilterCat;
  const status=document.getElementById('desp-status-filter'); if(status) status.value=despFilterStatus;

}
function sortDesp(key){
  if(despSortKey===key)despSortDir*=-1; else{despSortKey=key;despSortDir=key==='val'?-1:1;}
  syncDespSortIndicator();
  saveDespViewPrefs();
  renderDespTable();
}
function syncDespSortIndicator(){
  document.querySelectorAll('[id^="sort-desp-"]').forEach(el=>{el.textContent='↕';el.parentElement.classList.remove('sorted');});
  const el=document.getElementById('sort-desp-'+despSortKey);
  if(el){el.textContent=despSortDir===1?'↑':'↓';el.parentElement.classList.add('sorted');}
}

let despPickerYear=null;
function tableSkeleton(rows=5, cols=6){
  return '<tbody class="table-skeleton">' +
    Array.from({length:rows}, () =>
      `<tr class="table-sk-row" style="display:table-row">` +
      `<td style="padding:10px 16px"><div style="display:flex;align-items:center;gap:10px">` +
      `<div class="table-sk-circle skeleton sk-block"></div>` +
      `<div><div class="table-sk-line skeleton sk-block" style="width:100px;margin-bottom:5px"></div>` +
      `<div class="table-sk-line skeleton sk-block" style="width:60px"></div></div></div></td>` +
      Array.from({length:cols-1}, (_,i) =>
        `<td style="padding:10px 16px"><div class="table-sk-line skeleton sk-block" style="width:${[80,55,70,65,30][i]||50}px"></div></td>`
      ).join('') +
      `</tr>`
    ).join('') +
  '</tbody>';
}

function renderDespesas(){
  // Garante que os cadastros ativos já tenham o lançamento do mês atual.
  if(typeof initializeRecurringAccounts==='function')initializeRecurringAccounts();
  // Mostra skeleton imediatamente
  const tbody = document.getElementById('desp-tbody');
  if(tbody && !tbody.children.length) tbody.innerHTML = tableSkeleton(5,6).replace('<tbody','<tbody id="desp-tbody"').replace('</tbody>','');
  despSelectedMonth=getCurMonth();
  updateDespMonthBtn();renderDespTable();
}
function updateDespMonthBtn(){if(typeof updateFinanceMonthControls==='function')updateFinanceMonthControls();}
function toggleDespMonthPicker(){openFinanceMonthPicker();}
function closeDespMonthPicker(){if(typeof closeFinanceMonthPicker==='function')closeFinanceMonthPicker();}
function selectDespMonth(month){selectFinanceMonth(month);}
function stepDespMonth(delta){stepFinanceMonth(delta);}

/* ── Toggle rápido para Pago ── */
function bindSwipeActions(wrapper,onRight,onLeft){
    const inner=wrapper.querySelector('.mob-card-inner');
    const deleteBg=wrapper.querySelector('.swipe-delete-bg'),paidBg=wrapper.querySelector('.swipe-paid-bg');
    if(!inner||!deleteBg||!paidBg)return;
    let startX=0,startY=0,curX=0,swiping=false,locked=false,buzzed=false,suppressClick=false;
    const THRESHOLD=80;
    inner.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
    inner.addEventListener('touchstart',e=>{
      startX=e.touches[0].clientX;startY=e.touches[0].clientY;
      curX=0;swiping=false;locked=false;buzzed=false;
      inner.style.transition='none';
    },{passive:true});
    inner.addEventListener('touchmove',e=>{
      const dx=e.touches[0].clientX-startX;
      const dy=e.touches[0].clientY-startY;
      if(!swiping&&!locked){
        if(Math.abs(dy)>Math.abs(dx)){locked=true;return;}
        if(Math.abs(dx)>5)swiping=true;
      }
      if(!swiping||locked)return;
      e.preventDefault();
      curX=Math.max(-120,Math.min(120,dx));
      inner.style.transform=`translateX(${curX}px)`;
      const ratio=Math.min(1,Math.abs(curX)/THRESHOLD);
      deleteBg.style.opacity=curX<0?ratio:0;paidBg.style.opacity=curX>0?ratio:0;
      if(ratio>=1&&!buzzed){buzzed=true;if(navigator.vibrate)navigator.vibrate(18);}
    },{passive:false});
    inner.addEventListener('touchend',()=>{
      inner.style.transition='transform .25s cubic-bezier(.4,0,.2,1)';
      const action=Math.abs(curX)>=THRESHOLD?(curX>0?'right':'left'):null;
      suppressClick=!!action;inner.style.transform='';deleteBg.style.opacity='0';paidBg.style.opacity='0';
      if(action)setTimeout(()=>{action==='right'?onRight():onLeft();},120);
      setTimeout(()=>{suppressClick=false;},360);
    });
}
function initSwipeDelete(){
  document.querySelectorAll('.swipe-wrapper[data-id]').forEach(wrapper=>{
    const id=Number(wrapper.dataset.id);
    bindSwipeActions(wrapper,()=>markExpensePaid(id),()=>deleteDespEntry(id));
  });
}

function markExpensePaid(id){
  const d=DATA.despesas.find(x=>x.id===id);if(!d)return;
  if(d.status==='Pago'){showToast('Essa despesa já está paga.');return;}
  togglePago(id);
}

function togglePago(id){
  const d = DATA.despesas.find(x=>x.id===id);
  if(!d) return;
  if(d.status==='Pago'){
    openModal(id); // já pago: abre modal para editar
    return;
  }
  d.status = 'Pago';
  d.pagoEm = new Date().toISOString().slice(0,10); // data real do pagamento, usada na Evolução de gastos
  saveData();
  renderDespTable();
  renderCurMonth();
  showToast('Marcado como Pago!');
}

function mobSectionHeader(label, subtotal){
  return `<div class="mob-section-header"><span>${label}</span><span style="color:var(--text2);font-size:11px;text-transform:none;letter-spacing:0;font-weight:700">${fmt(subtotal)}</span></div>`;
}

function mobDespCard(d){
  const today=new Date();today.setHours(0,0,0,0);
  const isPago=d.status==='Pago';
  const isDebito=d.status==='Débito auto';
  const isFalta=d.status==='Falta Pagar';

  // Borda esquerda: verde=pago, roxo=débito auto, vermelho=falta pagar
  const barCol=isPago?'var(--green)':isDebito?'var(--purple)':'var(--red)';

  // Urgency label
  let vencStr='';
  if(!isPago && d.venc){
    const dv=new Date(d.venc+'T00:00:00');
    const diff=Math.round((dv-today)/(1000*60*60*24));
    if(diff<0) vencStr=`<span style="color:var(--red);font-weight:700">${uiIcon('warning',12)}Venceu</span>`;
    else if(diff===0) vencStr=`<span style="color:var(--amber);font-weight:700">${uiIcon('warning',12)}Hoje</span>`;
    else if(diff<=3) vencStr=`<span style="color:var(--amber);font-weight:700">${uiIcon('warning',12)}Em ${diff}d</span>`;
    else vencStr=`<span style="color:var(--text3)">${dv.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>`;
  } else if(!isPago && !d.venc){
    vencStr='';
  }

  const catCol=catColor(d.cat);

  // Meta line: pagamento + vencimento — sempre na segunda linha, sem quebrar
  const metaParts = [
    d.pag || null,
    vencStr || null
  ].filter(Boolean);
  const metaLine = metaParts.length
    ? `<div class="mob-card-meta">${metaParts.join('<span class="mob-meta-sep">·</span>')}</div>`
    : '';

  const pagOpts=['Cartão','Vale Alimentação','PIX','Boleto','Débito automático','Dinheiro'].map(o=>`<option${o===d.pag?' selected':''}>${o}</option>`).join('');
  const sid=mieId(d.id);
  const nomeSafe=(d.nome||'').replace(/'/g,"\\'");
  return `<div class="swipe-wrapper${isPago?' mob-card-pago':''}" data-id="${d.id}">
    <div class="swipe-paid-bg">${uiIcon('check',22)}<span>Pago</span></div>
    <div class="swipe-delete-bg">${uiIcon('trash',22)}</div>
    <div class="mob-card-inner" onclick="toggleInlineEdit(${d.id},event)">
      <div class="mob-status-bar" style="background:${barCol}"></div>
      <div class="mob-card-icon">${itemIcon(d.nome,d.icon)}</div>
      <div class="mob-card-main">
        <div class="mob-card-name">${d.nome}${installmentBadge(d)}</div>
        <div class="mob-card-row1">
          <span class="mob-cat-badge" style="background:${catCol}18;color:${catCol}">${catLabel(d.cat)}</span>
        </div>
        ${metaLine}
      </div>
      <div class="mob-card-right">
        <span class="mob-card-val" style="color:${isPago?'var(--text3)':d.val>0?'var(--text)':'var(--text3)'}">${d.val>0?fmt(d.val):'—'}</span>
        <div class="mob-card-actions">${mobilePaymentControl('desp',d.id,isPago,isDebito)}</div>
      </div>
    </div>
    <div class="mob-inline-edit" id="inline-edit-${sid}" style="display:none">
      <div class="mie-body">
        <p class="finance-inline-scope">Altera somente este lançamento de ${mesLabel(d.mes)}.</p>
        <div class="mie-field">
          <div class="mie-lbl">Valor</div>
          <input class="mie-input mie-val" type="text" inputmode="numeric" placeholder="R$ 0,00" value="${d.val>0?d.val:''}" id="mie-valor-${sid}" autocomplete="off" onclick="event.stopPropagation()">
        </div>
        <div class="mie-field">
          <div class="mie-lbl">Status</div>
          <div class="mie-toggle" id="mie-status-${sid}">
            <button class="mie-opt${d.status==='Pago'?' active':''}" onclick="event.stopPropagation();mieSetToggle('mie-status-${sid}',this)">Pago</button>
            <button class="mie-opt${d.status==='Falta Pagar'?' active':''}" onclick="event.stopPropagation();mieSetToggle('mie-status-${sid}',this)">Falta pagar</button>
            <button class="mie-opt${d.status==='Débito auto'?' active':''}" onclick="event.stopPropagation();mieSetToggle('mie-status-${sid}',this)">Débito auto</button>
          </div>
        </div>
        <div class="mie-row">
          <div class="mie-field">
            <div class="mie-lbl">Pagamento</div>
            <select class="mie-select" id="mie-pag-${sid}" onclick="event.stopPropagation()">${pagOpts}</select>
          </div>
          <div class="mie-field">
            <div class="mie-lbl">Vencimento</div>
            <input class="mie-input" type="number" placeholder="Dia" min="1" max="31" value="${d.diaVenc||''}" id="mie-venc-${sid}" onclick="event.stopPropagation()">
          </div>
        </div>
      </div>
      <div class="mie-footer">
        <button class="mie-btn-save" onclick="event.stopPropagation();saveInlineEdit(${d.id})">Salvar</button>
        <button class="mie-btn-icon" onclick="event.stopPropagation();openParcela(${d.id})" title="Somar outro valor no mês" aria-label="Somar outro valor no mês">${uiIcon('plus',18)}</button>
        <button class="mie-btn-icon" onclick="event.stopPropagation();openModal(${d.id})" title="Editar lançamento completo" aria-label="Editar lançamento completo">${uiIcon('edit',18)}</button>
        <button class="mie-btn-history" onclick="event.stopPropagation();openItemDetail('${nomeSafe}',event)" title="Ver histórico" aria-label="Ver histórico">${uiIcon('barChart',18)}</button>
        <button class="mie-btn-del" aria-label="Enviar lançamento à lixeira" title="Enviar à lixeira" onclick="event.stopPropagation();deleteDespEntry(${d.id})">${uiIcon('trash',18,'var(--red)')}</button>
      </div>
    </div>
  </div>`;
}

function mobRecCard(r, ri){
  const aguard=(r.status||'Recebido')==='Aguardando';
  const barCol=aguard?'var(--amber)':'var(--green)';
  const sid=mieId(r.id);
  return `<div class="swipe-wrapper" data-rec-id="${r.id}">
    <div class="swipe-paid-bg">${uiIcon('check',22)}<span>Recebido</span></div>
    <div class="swipe-delete-bg">${uiIcon('trash',22)}</div>
    <div class="mob-card-inner" onclick="toggleInlineEditRec(${r.id},event)">
      <div class="mob-status-bar" style="background:${barCol}"></div>
      <div class="mob-card-main" style="padding-left:4px">
        <div class="mob-card-name">${r.nome}</div>
        <div class="mob-card-sub">
          ${r.cat?`<span style="background:rgba(52,210,122,.1);color:var(--green);padding:1px 8px;border-radius:6px;font-weight:600;font-size:10px;opacity:.8">${r.cat}</span>`:''}
        </div>
      </div>
      <div class="mob-card-right">
        <span class="mob-card-val" style="color:${aguard?'var(--amber)':'var(--green)'}">${r.val>0?fmt(r.val):'—'}</span>
        <div class="mob-card-actions">${mobilePaymentControl('rec',r.id,!aguard)}</div>
      </div>
    </div>
    <div class="mob-inline-edit" id="rec-inline-edit-${sid}" style="display:none">
      <div class="mie-body">
        <div class="mie-field">
          <div class="mie-lbl">Valor</div>
          <input class="mie-input mie-val" type="text" inputmode="numeric" placeholder="R$ 0,00" value="${r.val>0?r.val:''}" id="mie-rec-valor-${sid}" autocomplete="off" onclick="event.stopPropagation()">
        </div>
        <div class="mie-field">
          <div class="mie-lbl">Status</div>
          <div class="mie-toggle" id="mie-rec-status-${sid}">
            <button class="mie-opt${(r.status||'Recebido')==='Recebido'?' active':''}" onclick="event.stopPropagation();mieSetToggle('mie-rec-status-${sid}',this)">Recebido</button>
            <button class="mie-opt${(r.status||'Recebido')==='Aguardando'?' active':''}" onclick="event.stopPropagation();mieSetToggle('mie-rec-status-${sid}',this)">Aguardando</button>
          </div>
        </div>
      </div>
      <div class="mie-footer">
        <button class="mie-btn-save" onclick="event.stopPropagation();saveInlineEditRec(${r.id})">Salvar</button>
        <button class="mie-btn-full" onclick="event.stopPropagation();openRecModal(${r.id})">Editar tudo ›</button>
        <button class="mie-btn-del" aria-label="Enviar lançamento à lixeira" title="Enviar à lixeira" onclick="event.stopPropagation();deleteRecEntry(${r.id})">${uiIcon('trash',18,'var(--red)')}</button>
      </div>
    </div>
  </div>`;
}

function toggleRecStatus(id){
  const r=DATA.receitas.find(x=>x.id===id);
  if(!r)return;
  if((r.status||'Recebido')==='Recebido'){
    r.status='Aguardando';
  } else {
    r.status='Recebido';
  }
  saveData();renderReceitas();showToast(r.status==='Recebido'?'Marcado como Recebido!':'Marcado como Aguardando');
}

function renderDespByName(items){
  const box = document.getElementById('desp-byname-box');
  const listEl = document.getElementById('desp-byname-list');
  if(!box||!listEl) return;
  const groups = {};
  items.forEach(d=>{
    const key = (d.nome||'Sem nome').trim();
    if(!groups[key]) groups[key] = { total:0, count:0 };
    groups[key].total += (d.val||0);
    groups[key].count += 1;
  });
  const repeated = Object.entries(groups)
    .filter(([,g]) => g.count > 1)
    .sort((a,b) => b[1].total - a[1].total);

  if(!repeated.length){ box.style.display='none'; return; }
  box.style.display='';
  listEl.innerHTML = repeated.map(([nome,g]) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:.7rem 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px;min-width:0">
        <span style="font-size:14px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nome}</span>
        <span class="badge nd" style="flex-shrink:0">${g.count}x</span>
      </div>
      <span style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--text);flex-shrink:0">${fmt(g.total)}</span>
    </div>`).join('');
  // remove borda do último item
  const lastRow = listEl.lastElementChild;
  if(lastRow) lastRow.style.borderBottom = 'none';
}

function renderDespTable(){
  // Toda navegação (seletor, setas e atualização em tempo real) passa aqui.
  if(despSelectedMonth&&typeof ensureRecurringEntriesForMonth==='function')ensureRecurringEntriesForMonth(despSelectedMonth);
  updateRecorrentesBadge();if(recorrentesOpen)renderRecorrentesList();
  syncDespSortIndicator();
  const m=despSelectedMonth;
  const searchEl=document.getElementById('desp-search');
  const q=(searchEl?searchEl.value:'').toLowerCase().trim();
  updateDespCategoryFilter();
  let items=DATA.despesas.filter(d=>d.mes===m).filter(d=>
    (despFilterStatus==='all'||d.status===despFilterStatus) &&
    (despFilterCat==='all'||d.cat===despFilterCat) &&
    (!q ||
      (d.nome||'').toLowerCase().includes(q) ||
      (d.cat||'').toLowerCase().includes(q) ||
      (d.pag||'').toLowerCase().includes(q))
  );
  /* FIX 2: apply sort */
  items=[...items].sort((a,b)=>{
    let va,vb;
    if(despSortKey==='nome'){va=(a.nome||'').toLowerCase();vb=(b.nome||'').toLowerCase();return despSortDir*(va<vb?-1:va>vb?1:0);}
    if(despSortKey==='cat'){va=(a.cat||'').toLowerCase();vb=(b.cat||'').toLowerCase();return despSortDir*(va<vb?-1:va>vb?1:0);}
    if(despSortKey==='val'){return despSortDir*((b.val||0)-(a.val||0));}
    if(despSortKey==='venc'){va=a.venc||'9999';vb=b.venc||'9999';return despSortDir*(va<vb?-1:va>vb?1:0);}
    if(despSortKey==='status'){va=a.status||'';vb=b.status||'';return despSortDir*(va<vb?-1:va>vb?1:0);}
    if(despSortKey==='tipo'){va=(a.tipo||guessTipo(a.cat));vb=(b.tipo||guessTipo(b.cat));return despSortDir*(va<vb?-1:va>vb?1:0);}
    return 0;
  });
  const monthTotal=DATA.despesas.filter(d=>d.mes===m).length;
  const filtersActive=updateHistoryFilterSummary('desp',items.length,monthTotal);
  const emptyState=historyEmptyState('desp',monthTotal);
  const total=items.reduce((s,d)=>s+(d.val||0),0);
  const pago=items.filter(d=>d.status==='Pago').reduce((s,d)=>s+(d.val||0),0);
  const aPagar=items.filter(d=>d.status==='Falta Pagar'||d.status==='Débito auto').reduce((s,d)=>s+(d.val||0),0);
  document.getElementById('cards-desp').innerHTML=`
    <div class="finance-summary-card anim-fade-up anim-d1">
      <div class="finance-summary-heading"><span class="finance-summary-dot" style="background:var(--red)"></span>${filtersActive?'Resumo filtrado':'Resumo do mês'}</div>
      <div class="cmv-hero">
        <div class="cmv-hero-label">Total de despesas</div>
        <div class="cmv-hero-val" style="color:var(--red)">${fmt(total)}</div>
      </div>
      <div class="cmv-sub-row">
        <div class="cmv-sub-item"><span class="cmv-sub-label">A pagar</span><span class="cmv-sub-val" style="color:var(--amber)">${fmt(aPagar)}</span></div>
        <div class="cmv-sub-sep"></div>
        <div class="cmv-sub-item cmv-sub-desp"><span class="cmv-sub-label">Pago</span><span class="cmv-sub-val" style="color:var(--green)">${fmt(pago)}</span></div>
      </div>
    </div>`;
  renderDespByName(items);
  // título e badge removidos (info já aparece nos cards acima)
  const bc={Pago:'pago','Falta Pagar':'falta','Débito auto':'auto'};
  const today=new Date();today.setHours(0,0,0,0);
  function vencBadge(d){
    if(d.status==='Pago')return'<span style="color:var(--text3);font-size:12px">—</span>';
    if(!d.venc)return`<button class="edit-btn" onclick="openModal(${d.id})">+ Definir</button>`;
    const dv=new Date(d.venc+'T00:00:00');const diff=Math.round((dv-today)/(1000*60*60*24));
    const verb=d.status==='Débito auto'?'Débito':'Vence';
    if(diff<0)return`<span class="notif-venc urgente">Venceu ${Math.abs(diff)}d atrás</span>`;
    if(diff===0)return`<span class="notif-venc hoje">${verb} hoje</span>`;
    if(diff<=3)return`<span class="notif-venc urgente">${verb} em ${diff}d</span>`;
    return`<span class="notif-venc futuro">${dv.toLocaleDateString('pt-BR')}</span>`;
  }
  const valCell=d=>d.val>0?`<span style="font-weight:700">${fmt(d.val)}</span>`:`<button class="edit-btn" onclick="openModal(${d.id})">+ Valor</button>`;
  const CATS_FIXAS = ['Moradia','Gastos Fixos','Transporte','Streaming','Financeiro','Saúde'];
  const fixas = items.filter(d=>(d.tipo||guessTipo(d.cat))==='fixa');
  const variaveis = items.filter(d=>(d.tipo||guessTipo(d.cat))==='variavel');
  let _rowIdx=0;
  function rowHtml(d){
    const di=_rowIdx++;const dc=`anim-d${Math.min(di+1,10)}`;
    const nomeSafe=(d.nome||'').replace(/'/g,"\\'");
    return `<tr class="tr-anim ${dc}" style="${d.status==='Falta Pagar'?'background:rgba(240,96,96,0.03)':d.status==='Débito auto'?'background:rgba(123,140,255,0.03)':''}">
        <td><div style="display:flex;align-items:center;gap:8px">${itemIcon(d.nome,d.icon)}<div><div class="entry-name">${d.nome}${installmentBadge(d)}</div><div class="entry-cat">${d.pag||''}</div></div></div></td>
        <td><span class="cat-pill" style="background:${catColor(d.cat)}18;color:${catColor(d.cat)};opacity:.75">${catLabel(d.cat)}</span></td>
        <td>${valCell(d)}</td>
        <td>${vencBadge(d)}</td>
        <td><span class="badge ${bc[d.status]||'nd'}">${d.status}</span>${d.status!=='Pago'?`<button type="button" class="entry-table-pay" onclick="markExpensePaid(${d.id})">Pagar</button>`:''}</td>
        <td style="white-space:nowrap"><button class="edit-btn" onclick="openParcela(${d.id})" style="margin-right:4px;display:inline-flex;align-items:center" title="Somar outro valor no mês">${uiIcon('plus',14)}</button><button class="edit-btn" onclick="openModal(${d.id})" style="margin-right:4px;display:inline-flex;align-items:center" title="Editar lançamento" aria-label="Editar lançamento">${uiIcon('edit',14)} Editar</button><button class="edit-btn" onclick="openItemDetail('${nomeSafe}',event)" style="margin-right:4px;display:inline-flex;align-items:center" title="Ver histórico">${uiIcon('barChart',14)}</button><button class="btn-del" onclick="deleteDespEntry(${d.id})" style="display:inline-flex;align-items:center" title="Enviar à lixeira" aria-label="Enviar lançamento à lixeira">${uiIcon('trash',14)} Lixeira</button></td>
      </tr>`;
  }
  function sectionHeader(label, subtotal){
    return `<tr><td colspan="6" style="padding:10px 16px 4px;background:var(--surface2);font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center">${label}<span style="font-weight:700;color:var(--text2);font-size:11px;text-transform:none;letter-spacing:0">${fmt(subtotal)}</span></div>
    </td></tr>`;
  }
  _rowIdx=0;
  if(!items.length){
    document.getElementById('desp-tbody').innerHTML=`<tr><td colspan="6" class="empty-msg">${emptyState}</td></tr>`;
    const ml=document.getElementById('desp-mobile-list');
    if(ml) ml.innerHTML=`<div class="empty-msg">${emptyState}</div>`;
  } else if(fixas.length && variaveis.length){
    const totalFixas=fixas.reduce((s,d)=>s+(d.val||0),0);
    const totalVariaveis=variaveis.reduce((s,d)=>s+(d.val||0),0);
    document.getElementById('desp-tbody').innerHTML=
      sectionHeader('Contas Fixas',totalFixas)+fixas.map(rowHtml).join('')+
      sectionHeader('Variáveis & Outros',totalVariaveis)+variaveis.map(rowHtml).join('')+
      `<tr class="total-row"><td colspan="2">Total</td><td>${fmt(total)}</td><td></td><td></td><td></td></tr>`;
    const ml=document.getElementById('desp-mobile-list');
    if(ml) ml.innerHTML=mobileGestureHint('Marcar como pago')+
      mobSectionHeader('Contas Fixas',totalFixas)+fixas.map(mobDespCard).join('')+
      mobSectionHeader('Variáveis & Outros',totalVariaveis)+variaveis.map(mobDespCard).join('')+
      `<div class="mob-total-row"><span>Total</span><span style="color:var(--red)">${fmt(total)}</span></div>`;
  } else {
    document.getElementById('desp-tbody').innerHTML=
      items.map(rowHtml).join('')+
      `<tr class="total-row"><td colspan="2">Total</td><td>${fmt(total)}</td><td></td><td></td><td></td></tr>`;
    const ml=document.getElementById('desp-mobile-list');
    if(ml) ml.innerHTML=mobileGestureHint('Marcar como pago')+
      items.map(mobDespCard).join('')+
      `<div class="mob-total-row"><span>Total</span><span style="color:var(--red)">${fmt(total)}</span></div>`;
  }
  updateNotifBadge();
  initSwipeDelete();
}

/* ══════ MODAL EDIÇÃO DESPESA ══════ */
let editingId=null,originalVenc=null,editingBulkName=null;
function openModal(id){
  const d=DATA.despesas.find(x=>x.id===id);if(!d)return;
  editingId=id;editingBulkName=null;originalVenc=d.venc||null;selectedIconEdit=d.icon||d.nome;
  document.getElementById('modal-title').textContent=`Editar — ${d.nome}`;
  document.getElementById('edit-nome').value=d.nome;
  document.getElementById('edit-name-hint').textContent='Alterar o nome atualizará só este lançamento.';
  document.getElementById('edit-icon-preview').innerHTML=iconContent(selectedIconEdit);
  document.getElementById('edit-status').value=d.status||'Falta Pagar';
  if(document.getElementById('edit-tipo')) document.getElementById('edit-tipo').value=d.tipo||guessTipo(d.cat);
  document.getElementById('edit-venc').value=d.venc||'';
  document.getElementById('edit-valor').value=d.val>0?d.val:'';
  document.getElementById('edit-venc-scope-wrap').style.display='none';
  document.querySelector('input[name="venc-scope"][value="only"]').checked=true;
  document.getElementById('edit-modal').classList.add('open');
  if(typeof setupFinanceForm==='function')setupFinanceForm('edit-modal');
}
document.getElementById('edit-venc').addEventListener('change',function(){
  document.getElementById('edit-venc-scope-wrap').style.display=(this.value||null)!==originalVenc?'block':'none';
});
function saveEdit(){
  if(!editingId)return;
  clearFieldErrors(['edit-nome','edit-valor']);
  const newStatus=document.getElementById('edit-status').value;
  const newVenc=document.getElementById('edit-venc').value||null;
  const editValRaw = document.getElementById('edit-valor').value;
  const nv = readMoneyField('edit-valor');
  const isEmpty = editValRaw.trim() === '';
  if(!isEmpty && (nv === null || nv < 0)){ fieldError('edit-valor','Valor inválido'); return; }
  const newVal = isEmpty ? null : (nv > 0 ? nv : undefined);
  const scope=document.querySelector('input[name="venc-scope"]:checked')?.value||'only';
  const newNome=document.getElementById('edit-nome').value.trim()||null;
  const newIcon=selectedIconEdit||null;
  const editTipo = document.getElementById('edit-tipo');
  if(editingBulkName){
    const oldName=editingBulkName;
    DATA.despesas.filter(d=>d.nome===oldName).forEach(d=>{
      const wasPago=d.status==='Pago';
      d.status=newStatus;
      if(newStatus==='Pago'){ if(!wasPago) d.pagoEm=new Date().toISOString().slice(0,10); } else { d.pagoEm=null; }
      if(editTipo) d.tipo=editTipo.value;
      if(newVal!==undefined)d.val=newVal;
      if(newNome)d.nome=newNome;
      if(newIcon)d.icon=newIcon;
      if(newVenc){const day=new Date(newVenc+'T00:00:00').getDate();const[y,mo]=d.mes.split('-');const maxDay=new Date(+y,+mo,0).getDate();d.venc=`${d.mes}-${String(Math.min(day,maxDay)).padStart(2,'0')}`;}
    });
    editingBulkName=null;
  } else {
    const d=DATA.despesas.find(x=>x.id===editingId);if(!d)return;
    const originalName=d.nome;
    const wasPago=d.status==='Pago';
    d.status=newStatus;
    if(newStatus==='Pago'){ if(!wasPago) d.pagoEm=new Date().toISOString().slice(0,10); } else { d.pagoEm=null; }
    if(editTipo) d.tipo=editTipo.value;
    if(newVal!==undefined)d.val=newVal;
    if(newNome)d.nome=newNome;
    if(newIcon)d.icon=newIcon;
    if(newVenc!==originalVenc){
      if(scope==='forward'){
        DATA.despesas.forEach(x=>{
          if((x.id===d.id||x.nome===originalName)&&x.mes>=d.mes){
            if(newVenc){const day=new Date(newVenc+'T00:00:00').getDate();const[y,mo]=x.mes.split('-');const maxDay=new Date(+y,+mo,0).getDate();x.venc=`${x.mes}-${String(Math.min(day,maxDay)).padStart(2,'0')}`;}
            else x.venc=null;
          }
        });
      } else {d.venc=newVenc;}
    } else {d.venc=newVenc;}
  }
  saveData();closeModal();renderDespTable();renderManageList();showToast('Atualizado!');
}
function closeModal(){
  document.getElementById('edit-modal').classList.remove('open');
  if(typeof closeFinanceForm==='function')closeFinanceForm('edit-modal');
  // Se era edição em lote, reabre o modal de gerenciamento
  if(editingBulkName) document.getElementById('add-desp-modal').classList.add('open');
  editingId=null;originalVenc=null;editingBulkName=null;selectedIconEdit=null;
}
document.getElementById('edit-modal').addEventListener('click',function(e){if(e.target===this)closeModal();});

/* ══ EDIÇÃO INLINE ══ */
let currentInlineId = null;

function toggleInlineEdit(id, event) {
  if (event && event.target.closest('button, select, input')) return;
  const sid = mieId(id);
  const panel = document.getElementById('inline-edit-' + sid);
  if (!panel) return;
  if (currentInlineId && currentInlineId !== id) {
    const prev = document.getElementById('inline-edit-' + mieId(currentInlineId));
    if (prev) { prev.style.display = 'none'; prev.classList.remove('mie-open'); }
  }
  const isOpen = panel.style.display !== 'none';
  if (isOpen) {
    panel.style.display = 'none';
    panel.classList.remove('mie-open');
    currentInlineId = null;
  } else {
    const d = DATA.despesas.find(x => x.id === id);
    if (d) {
      const inp = document.getElementById('mie-valor-' + sid);
      if (inp) {
        setMoneyField('mie-valor-' + sid, d.val > 0 ? d.val : null);
        if (!inp._miemasked) { applyMoneyMask(inp); inp._miemasked = true; }
      }
    }
    panel.style.display = 'block';
    requestAnimationFrame(() => panel.classList.add('mie-open'));
    currentInlineId = id;
  }
}

function mieSetToggle(groupId, btn) {
  document.querySelectorAll('#' + groupId + ' .mie-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function mieId(id) { return String(id).replace(/\./g, '_'); }

function saveInlineEdit(id) {
  const d = DATA.despesas.find(x => x.id === id);
  if (!d) return;
  const sid = mieId(id);
  const statusGroup = document.getElementById('mie-status-' + sid);
  const activeStatus = statusGroup ? statusGroup.querySelector('.mie-opt.active') : null;
  if (activeStatus) {
    const t = activeStatus.textContent.trim();
    const wasPago = d.status === 'Pago';
    d.status = t === 'Falta pagar' ? 'Falta Pagar' : t === 'Débito auto' ? 'Débito auto' : 'Pago';
    if (d.status === 'Pago') { if (!wasPago) d.pagoEm = new Date().toISOString().slice(0,10); } else { d.pagoEm = null; }
  }
  const pag = document.getElementById('mie-pag-' + sid);
  if (pag) d.pag = pag.value;
  const diaVencEl = document.getElementById('mie-venc-' + sid);
  const diaVenc = diaVencEl ? parseInt(diaVencEl.value) : null;
  if (diaVenc && diaVenc >= 1 && diaVenc <= 31) {
    d.diaVenc = diaVenc;
    const [y, mo] = d.mes.split('-');
    const maxDay = new Date(+y, +mo, 0).getDate();
    d.venc = `${d.mes}-${String(Math.min(diaVenc, maxDay)).padStart(2, '0')}`;
  }
  const newVal = readMoneyField('mie-valor-' + sid);
  if (newVal !== null) d.val = newVal;
  saveData();
  currentInlineId = null;
  renderDespTable();
  showToast('Atualizado!');
}

/* ══ EDIÇÃO INLINE — RECEITAS ══ */
let currentInlineRecId = null;

function toggleInlineEditRec(id, event) {
  if (event && event.target.closest('button, select, input')) return;
  const sid = mieId(id);
  const panel = document.getElementById('rec-inline-edit-' + sid);
  if (!panel) return;
  if (currentInlineRecId && currentInlineRecId !== id) {
    const prev = document.getElementById('rec-inline-edit-' + mieId(currentInlineRecId));
    if (prev) { prev.style.display = 'none'; prev.classList.remove('mie-open'); }
  }
  const isOpen = panel.style.display !== 'none';
  if (isOpen) {
    panel.style.display = 'none';
    panel.classList.remove('mie-open');
    currentInlineRecId = null;
  } else {
    const r = DATA.receitas.find(x => x.id === id);
    if (r) {
      const inp = document.getElementById('mie-rec-valor-' + sid);
      if (inp) {
        setMoneyField('mie-rec-valor-' + sid, r.val > 0 ? r.val : null);
        if (!inp._miemasked) { applyMoneyMask(inp); inp._miemasked = true; }
      }
    }
    panel.style.display = 'block';
    requestAnimationFrame(() => panel.classList.add('mie-open'));
    currentInlineRecId = id;
  }
}

function saveInlineEditRec(id) {
  const r = DATA.receitas.find(x => x.id === id);
  if (!r) return;
  const sid = mieId(id);
  const statusGroup = document.getElementById('mie-rec-status-' + sid);
  const activeStatus = statusGroup ? statusGroup.querySelector('.mie-opt.active') : null;
  if (activeStatus) r.status = activeStatus.textContent.trim();
  const newVal = readMoneyField('mie-rec-valor-' + sid);
  if (newVal !== null) r.val = newVal;
  saveData();
  currentInlineRecId = null;
  renderReceitas();
  showToast('Atualizado!');
}
