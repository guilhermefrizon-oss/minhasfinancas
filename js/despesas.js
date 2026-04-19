/* ── Tipo da despesa ── */
const CATS_FIXAS_DEFAULT = ['Moradia','Gastos Fixos','Transporte','Streaming','Financeiro','Saúde'];
function guessTipo(cat){
  const main = (cat||'').split(' · ')[0];
  return CATS_FIXAS_DEFAULT.includes(main) ? 'fixa' : 'variavel';
}

/* ── Painel de ordenação mobile ── */
const SORT_OPTIONS = [
  { key:'venc',   label:'Vencimento',  icon:'📅' },
  { key:'val',    label:'Valor',       icon:'💰' },
  { key:'nome',   label:'Nome',        icon:'🔤' },
  { key:'cat',    label:'Categoria',   icon:'🏷️' },
  { key:'status', label:'Status',      icon:'✅' },
  { key:'tipo',   label:'Tipo (Fixa/Variável)', icon:'📌' },
];

function openSortPanel(){
  const overlay = document.getElementById('sort-panel-overlay');
  const panel   = document.getElementById('sort-panel');
  if(!overlay||!panel) return;
  // Monta opções
  document.getElementById('sort-options').innerHTML = SORT_OPTIONS.map(o => {
    const active = despSortKey === o.key;
    const dir = active ? (despSortDir === 1 ? ' ↑' : ' ↓') : '';
    return `<button onclick="applySortMobile('${o.key}')"
      style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;border:1px solid ${active?'var(--purple)':'var(--border)'};background:${active?'rgba(123,140,255,.08)':'var(--surface2)'};font-family:var(--font);font-size:14px;font-weight:${active?700:500};color:${active?'var(--purple)':'var(--text)'};cursor:pointer;text-align:left;width:100%;transition:all .15s">
      <span style="font-size:16px">${o.icon}</span>
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
  sortDesp(key);
  // Atualiza label do botão
  const opt = SORT_OPTIONS.find(o=>o.key===key);
  const lbl = document.getElementById('sort-label-mobile');
  if(lbl && opt) lbl.textContent = opt.label + (despSortDir===1?' ↑':' ↓');
  closeSortPanel();
}

/* ══════ DESPESAS ══════ */
/* FIX 2: Ordenação */
let despSortKey='venc', despSortDir=1;
function sortDesp(key){
  if(despSortKey===key)despSortDir*=-1; else{despSortKey=key;despSortDir=key==='val'?-1:1;}
  document.querySelectorAll('[id^="sort-desp-"]').forEach(el=>{el.textContent='↕';el.parentElement.classList.remove('sorted');});
  const el=document.getElementById('sort-desp-'+key);
  if(el){el.textContent=despSortDir===1?'↑':'↓';el.parentElement.classList.add('sorted');}
  renderDespTable();
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
  // Mostra skeleton imediatamente
  const tbody = document.getElementById('desp-tbody');
  if(tbody && !tbody.children.length) tbody.innerHTML = tableSkeleton(5,6).replace('<tbody','<tbody id="desp-tbody"').replace('</tbody>','');
  const months=allMonths();
  if(!despSelectedMonth||!months.includes(despSelectedMonth)){
    const now=new Date(),cm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    despSelectedMonth=months.includes(cm)?cm:months[months.length-1];
  }
  updateDespMonthBtn();renderDespTable();
}
function updateDespMonthBtn(){
  const[y,mo]=despSelectedMonth.split('-');
  document.getElementById('desp-month-btn-label').textContent=new Date(+y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase();
}
function toggleDespMonthPicker(){
  const picker=document.getElementById('desp-month-picker');
  const open=picker.style.display==='block';
  if(open){closeDespMonthPicker();return;}
  picker.style.display='block';
  document.getElementById('desp-month-chevron').style.transform='rotate(180deg)';
  despPickerYear=parseInt(despSelectedMonth.split('-')[0]);
  renderDespPickerYear();
  // Posiciona o picker
  const btn=document.getElementById('desp-month-btn');
  const r=btn.getBoundingClientRect();
  if(window.innerWidth<768){
    // Mobile: centraliza na tela
    picker.style.width='280px';
    picker.style.left=((window.innerWidth-280)/2)+'px';
    picker.style.top=((window.innerHeight-picker.offsetHeight)/2)+'px';
    const bd=document.getElementById('picker-backdrop');
    if(bd)bd.style.display='block';
  } else {
    // Desktop: abaixo do botão
    picker.style.width='';
    picker.style.left=r.left+'px';
    picker.style.top=(r.bottom+6)+'px';
  }
  setTimeout(()=>{
    document.addEventListener('click',despPickerOutside);
    document.addEventListener('touchstart',despPickerOutside,{passive:true});
  },50);
}
function despPickerOutside(e){
  const picker=document.getElementById('desp-month-picker');
  const btn=document.getElementById('desp-month-btn');
  if(!picker||!btn)return;
  if(!picker.contains(e.target)&&!btn.contains(e.target))closeDespMonthPicker();
}
function closeDespMonthPicker(){
  document.getElementById('desp-month-picker').style.display='none';
  document.getElementById('desp-month-chevron').style.transform='rotate(0deg)';
  const bd=document.getElementById('picker-backdrop');
  if(bd)bd.style.display='none';
  document.removeEventListener('click',despPickerOutside);
  document.removeEventListener('touchstart',despPickerOutside);
}
function shiftDespYear(delta){const years=[...new Set(allMonths().map(m=>parseInt(m.split('-')[0])))];const idx=years.indexOf(despPickerYear)+delta;if(idx<0||idx>=years.length)return;despPickerYear=years[idx];renderDespPickerYear();}
function renderDespPickerYear(){
  const months=allMonths().filter(m=>parseInt(m.split('-')[0])===despPickerYear);
  const MN=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('desp-year-label').textContent=despPickerYear;
  document.getElementById('desp-month-list').innerHTML=months.length?months.map(m=>{const mo=parseInt(m.split('-')[1]),active=m===despSelectedMonth;return`<div onclick="selectDespMonth('${m}')" style="padding:10px 18px;cursor:pointer;font-size:13px;font-weight:${active?700:500};color:${active?'var(--purple)':'var(--text2)'};background:${active?'var(--surface2)':'transparent'};transition:all .1s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='${active?'var(--surface2)':'transparent'}'"> ${MN[mo-1]}</div>`;}).join(''):`<div style="padding:12px 18px;font-size:12px;color:var(--text3)">Sem dados em ${despPickerYear}</div>`;
}
function selectDespMonth(m){despSelectedMonth=m;updateDespMonthBtn();closeDespMonthPicker();renderDespTable();}
function stepDespMonth(delta){const months=allMonths();const idx=months.indexOf(despSelectedMonth)+delta;if(idx<0||idx>=months.length)return;despSelectedMonth=months[idx];updateDespMonthBtn();renderDespTable();}


/* ── Toggle rápido para Pago ── */
function initSwipeDelete(){
  document.querySelectorAll('.swipe-wrapper').forEach(wrapper=>{
    const inner=wrapper.querySelector('.mob-card-inner');
    const bg=wrapper.querySelector('.swipe-delete-bg');
    if(!inner||!bg)return;
    let startX=0,startY=0,curX=0,swiping=false,locked=false;
    const THRESHOLD=80;
    inner.addEventListener('touchstart',e=>{
      startX=e.touches[0].clientX;startY=e.touches[0].clientY;
      curX=0;swiping=false;locked=false;
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
      curX=Math.min(0,dx);
      inner.style.transform=`translateX(${curX}px)`;
      const ratio=Math.min(1,Math.abs(curX)/THRESHOLD);
      bg.style.opacity=ratio;
    },{passive:false});
    inner.addEventListener('touchend',()=>{
      inner.style.transition='transform .25s cubic-bezier(.4,0,.2,1)';
      if(Math.abs(curX)>=THRESHOLD){
        inner.style.transform='translateX(-100%)';
        bg.style.opacity='1';
        const id=Number(wrapper.dataset.id);
        setTimeout(()=>deleteDespEntry(id),220);
      } else {
        inner.style.transform='';
        bg.style.opacity='0';
      }
    });
  });
}

function togglePago(id){
  const d = DATA.despesas.find(x=>x.id===id);
  if(!d) return;
  if(d.status==='Pago'){
    openModal(id); // já pago: abre modal para editar
    return;
  }
  d.status = 'Pago';
  saveData();
  renderDespTable();
  renderCurMonth();
  showToast('✅ Marcado como Pago!');
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
    if(diff<0) vencStr=`<span style="color:var(--red);font-weight:700">⚠ Venceu</span>`;
    else if(diff===0) vencStr=`<span style="color:var(--amber);font-weight:700">⚠ Hoje</span>`;
    else if(diff<=3) vencStr=`<span style="color:var(--amber);font-weight:700">⚠ Em ${diff}d</span>`;
    else vencStr=`<span style="color:var(--text3)">${dv.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>`;
  } else if(!isPago && !d.venc){
    vencStr='';
  }

  const catCol=catColor(d.cat);

  // Toggle button: ✓ verde = pago, ○ = não pago (igual pra débito e falta pagar)
  const toggleClass=isPago?'pago':isDebito?'debito':'';
  const toggleIcon=isPago?'✓':'○';
  const toggleTitle=isPago?'Pago':'Marcar como pago';

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
  return `<div class="swipe-wrapper${isPago?' mob-card-pago':''}" data-id="${d.id}">
    <div class="swipe-delete-bg">🗑</div>
    <div class="mob-card-inner" onclick="toggleInlineEdit(${d.id},event)">
      <div class="mob-status-bar" style="background:${barCol}"></div>
      <div class="mob-card-icon">${itemIcon(d.nome,d.icon)}</div>
      <div class="mob-card-main">
        <div class="mob-card-name">${d.nome}</div>
        <div class="mob-card-row1">
          <span class="mob-cat-badge" style="background:${catCol}18;color:${catCol}">${catLabel(d.cat)}</span>
        </div>
        ${metaLine}
      </div>
      <div class="mob-card-right">
        <span class="mob-card-val" style="color:${isPago?'var(--text3)':d.val>0?'var(--text)':'var(--text3)'}">${d.val>0?fmt(d.val):'—'}</span>
        <div class="mob-card-actions">
          <button class="mob-toggle-btn ${toggleClass}" onclick="event.stopPropagation();togglePago(${d.id})" title="${toggleTitle}">${toggleIcon}</button>
        </div>
      </div>
    </div>
    <div class="mob-inline-edit" id="inline-edit-${sid}" style="display:none">
      <div class="mie-body">
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
        <button class="mie-btn-full" onclick="event.stopPropagation();openModal(${d.id})">Editar tudo ›</button>
        <button class="mie-btn-del" onclick="event.stopPropagation();deleteDespEntry(${d.id})">🗑</button>
      </div>
    </div>
  </div>`;
}

function mobRecCard(r, ri){
  const aguard=(r.status||'Recebido')==='Aguardando';
  const barCol=aguard?'var(--amber)':'var(--green)';
  const toggleClass=aguard?'':'pago';
  const toggleIcon=aguard?'○':'✓';
  const toggleTitle=aguard?'Marcar como recebido':'Recebido';
  const catCol='var(--green)';
  const sid=mieId(r.id);
  return `<div class="swipe-wrapper" data-rec-id="${r.id}">
    <div class="swipe-delete-bg">🗑</div>
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
        <div class="mob-card-actions">
          <button class="mob-toggle-btn ${toggleClass}" onclick="event.stopPropagation();toggleRecStatus(${r.id})" title="${toggleTitle}">${toggleIcon}</button>
        </div>
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
        <button class="mie-btn-del" onclick="event.stopPropagation();deleteRecEntry(${r.id})">🗑</button>
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
  saveData();renderReceitas();showToast(r.status==='Recebido'?'✅ Marcado como Recebido!':'↩ Marcado como Aguardando');
}

function renderDespTable(){updateRecorrentesBadge();if(recorrentesOpen)renderRecorrentesList();
  const m=despSelectedMonth;
  const searchEl=document.getElementById('desp-search');
  const q=(searchEl?searchEl.value:'').toLowerCase().trim();
  let items=DATA.despesas.filter(d=>d.mes===m).filter(d=>
    !q ||
    (d.nome||'').toLowerCase().includes(q) ||
    (d.cat||'').toLowerCase().includes(q) ||
    (d.pag||'').toLowerCase().includes(q)
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
  const total=items.reduce((s,d)=>s+(d.val||0),0);
  const pago=items.filter(d=>d.status==='Pago').reduce((s,d)=>s+(d.val||0),0);
  const aPagar=items.filter(d=>d.status==='Falta Pagar'||d.status==='Débito auto').reduce((s,d)=>s+(d.val||0),0);
  document.getElementById('cards-desp').innerHTML=`
    <div class="card anim-fade-up anim-d1"><div class="card-stripe" style="background:var(--red)"></div><div class="card-label">Total</div><div class="card-value red">${fmt(total)}</div></div>
    <div class="card anim-fade-up anim-d2"><div class="card-stripe" style="background:var(--amber)"></div><div class="card-label">A pagar</div><div class="card-value ${aPagar>0?'amber':''}">${fmt(aPagar)}</div></div>
    <div class="card anim-fade-up anim-d3"><div class="card-stripe" style="background:var(--green)"></div><div class="card-label">Pago</div><div class="card-value green">${fmt(pago)}</div></div>`;
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
    return `<tr class="tr-anim ${dc}" style="${d.status==='Falta Pagar'?'background:rgba(240,96,96,0.03)':d.status==='Débito auto'?'background:rgba(123,140,255,0.03)':''}">
        <td><div style="display:flex;align-items:center;gap:8px">${itemIcon(d.nome,d.icon)}<div><div class="entry-name">${d.nome}</div><div class="entry-cat">${d.pag||''}</div></div></div></td>
        <td><span class="cat-pill" style="background:${catColor(d.cat)}18;color:${catColor(d.cat)};opacity:.75">${catLabel(d.cat)}</span></td>
        <td>${valCell(d)}</td>
        <td>${vencBadge(d)}</td>
        <td><span class="badge ${bc[d.status]||'nd'}" style="cursor:pointer" onclick="togglePago(${d.id})">${d.status}</span></td>
        <td style="white-space:nowrap"><button class="edit-btn" onclick="openModal(${d.id})" style="margin-right:4px">✏️</button><button class="btn-del" onclick="deleteDespEntry(${d.id})">×</button></td>
      </tr>`;
  }
  function sectionHeader(label, subtotal){
    return `<tr><td colspan="6" style="padding:10px 16px 4px;background:var(--surface2);font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center">${label}<span style="font-weight:700;color:var(--text2);font-size:11px;text-transform:none;letter-spacing:0">${fmt(subtotal)}</span></div>
    </td></tr>`;
  }
  _rowIdx=0;
  if(!items.length){
    document.getElementById('desp-tbody').innerHTML=`<tr><td colspan="6" class="empty-msg">Nenhuma despesa neste mês.</td></tr>`;
    const ml=document.getElementById('desp-mobile-list');
    if(ml) ml.innerHTML=`<div class="empty-msg">Nenhuma despesa neste mês.</div>`;
  } else if(fixas.length && variaveis.length){
    const totalFixas=fixas.reduce((s,d)=>s+(d.val||0),0);
    const totalVariaveis=variaveis.reduce((s,d)=>s+(d.val||0),0);
    document.getElementById('desp-tbody').innerHTML=
      sectionHeader('Contas Fixas',totalFixas)+fixas.map(rowHtml).join('')+
      sectionHeader('Variáveis & Outros',totalVariaveis)+variaveis.map(rowHtml).join('')+
      `<tr class="total-row"><td colspan="2">Total</td><td>${fmt(total)}</td><td></td><td></td><td></td></tr>`;
    const ml=document.getElementById('desp-mobile-list');
    if(ml) ml.innerHTML=
      mobSectionHeader('Contas Fixas',totalFixas)+fixas.map(mobDespCard).join('')+
      mobSectionHeader('Variáveis & Outros',totalVariaveis)+variaveis.map(mobDespCard).join('')+
      `<div class="mob-total-row"><span>Total</span><span style="color:var(--red)">${fmt(total)}</span></div>`;
  } else {
    document.getElementById('desp-tbody').innerHTML=
      items.map(rowHtml).join('')+
      `<tr class="total-row"><td colspan="2">Total</td><td>${fmt(total)}</td><td></td><td></td><td></td></tr>`;
    const ml=document.getElementById('desp-mobile-list');
    if(ml) ml.innerHTML=
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
  document.getElementById('edit-icon-preview').innerHTML=ICONS[selectedIconEdit]||DEFAULT_ICON;
  document.getElementById('edit-status').value=d.status||'Falta Pagar';
  if(document.getElementById('edit-tipo')) document.getElementById('edit-tipo').value=d.tipo||guessTipo(d.cat);
  document.getElementById('edit-venc').value=d.venc||'';
  document.getElementById('edit-valor').value=d.val>0?d.val:'';
  document.getElementById('edit-venc-scope-wrap').style.display='none';
  document.querySelector('input[name="venc-scope"][value="only"]').checked=true;
  document.getElementById('edit-modal').classList.add('open');
}
document.getElementById('edit-venc').addEventListener('change',function(){
  document.getElementById('edit-venc-scope-wrap').style.display=this.value&&this.value!==originalVenc?'block':'none';
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
      d.status=newStatus;
      if(editTipo) d.tipo=editTipo.value;
      if(newVal!==undefined)d.val=newVal;
      if(newNome)d.nome=newNome;
      if(newIcon)d.icon=newIcon;
      if(newVenc){const day=new Date(newVenc+'T00:00:00').getDate();const[y,mo]=d.mes.split('-');const maxDay=new Date(+y,+mo,0).getDate();d.venc=`${d.mes}-${String(Math.min(day,maxDay)).padStart(2,'0')}`;}
    });
    editingBulkName=null;
  } else {
    const d=DATA.despesas.find(x=>x.id===editingId);if(!d)return;
    d.status=newStatus;
    if(editTipo) d.tipo=editTipo.value;
    if(newVal!==undefined)d.val=newVal;
    if(newNome)d.nome=newNome;
    if(newIcon)d.icon=newIcon;
    if(newVenc!==originalVenc){
      if(scope==='forward'){
        DATA.despesas.forEach(x=>{
          if(x.nome===d.nome&&x.mes>=d.mes){
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
    d.status = t === 'Falta pagar' ? 'Falta Pagar' : t === 'Débito auto' ? 'Débito auto' : 'Pago';
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
