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
  setTimeout(()=>document.addEventListener('click',despPickerOutside),0);
}
function despPickerOutside(e){
  if(!document.getElementById('desp-month-picker').contains(e.target)&&!document.querySelector('[onclick="toggleDespMonthPicker()"]').contains(e.target))closeDespMonthPicker();
}
function closeDespMonthPicker(){
  document.getElementById('desp-month-picker').style.display='none';
  document.getElementById('desp-month-chevron').style.transform='rotate(0deg)';
  document.removeEventListener('click',despPickerOutside);
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

  return `<div class="swipe-wrapper${isPago?' mob-card-pago':''}" data-id="${d.id}">
    <div class="swipe-delete-bg">🗑</div>
    <div class="mob-card-inner">
      <div class="mob-status-bar" style="background:${barCol}"></div>
      <div class="mob-card-icon">${itemIcon(d.nome,d.icon)}</div>
      <div class="mob-card-main">
        <div class="mob-card-name">${d.nome}</div>
        <div class="mob-card-sub">
          <span style="background:${catCol}1a;color:${catCol};padding:1px 8px;border-radius:6px;font-weight:600;font-size:10px;opacity:.8">${catLabel(d.cat)}</span>
          ${d.pag?`<span>·</span><span>${d.pag}</span>`:''}
          ${vencStr?`<span>·</span>${vencStr}`:''}
        </div>
      </div>
      <div class="mob-card-right">
        <span class="mob-card-val" style="color:${isPago?'var(--text3)':d.val>0?'var(--text)':'var(--text3)'}">${d.val>0?fmt(d.val):'—'}</span>
        <div class="mob-card-actions">
          <button class="mob-edit-btn" onclick="openModal(${d.id})" title="Editar">✏️</button>
          <button class="mob-toggle-btn ${toggleClass}" onclick="togglePago(${d.id})" title="${toggleTitle}">${toggleIcon}</button>
        </div>
      </div>
    </div>
  </div>`;
}

function mobRecCard(r, ri){
  const aguard=(r.status||'Recebido')==='Aguardando';
  const barCol=aguard?'var(--amber)':'var(--green)';
  const toggleClass=aguard?'':'pago';
  const toggleIcon=aguard?'○':'✓';
  const toggleTitle=aguard?'Marcar como recebido':'Recebido — clique para editar';
  const catCol='var(--green)';
  return `<div class="swipe-wrapper" data-rec-id="${r.id}">
    <div class="swipe-delete-bg">🗑</div>
    <div class="mob-card-inner">
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
          <button class="mob-edit-btn" onclick="openRecModal(${r.id})" title="Editar">✏️</button>
          <button class="mob-toggle-btn ${toggleClass}" onclick="toggleRecStatus(${r.id})" title="${toggleTitle}">${toggleIcon}</button>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleRecStatus(id){
  const r=DATA.receitas.find(x=>x.id===id);
  if(!r)return;
  if((r.status||'Recebido')==='Recebido'){
    openRecModal(id);
    return;
  }
  r.status='Recebido';
  saveData();renderReceitas();showToast('✅ Marcado como Recebido!');
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
    return 0;
  });
  const total=items.reduce((s,d)=>s+(d.val||0),0);
  const pago=items.filter(d=>d.status==='Pago').reduce((s,d)=>s+(d.val||0),0);
  const falta=items.filter(d=>d.status==='Falta Pagar').reduce((s,d)=>s+(d.val||0),0);
  const today7=new Date();today7.setHours(0,0,0,0);
  const em7dias=new Date(today7);em7dias.setDate(em7dias.getDate()+7);
  const aVencer=items.filter(d=>d.status!=='Pago'&&d.venc&&(()=>{const dv=new Date(d.venc+'T00:00:00');return dv>=today7&&dv<=em7dias;})()).reduce((s,d)=>s+(d.val||0),0);
  document.getElementById('cards-desp').innerHTML=`
    <div class="card anim-fade-up anim-d1"><div class="card-stripe" style="background:var(--red)"></div><div class="card-label">Total</div><div class="card-value red">${fmt(total)}</div></div>
    <div class="card anim-fade-up anim-d2"><div class="card-stripe" style="background:var(--green)"></div><div class="card-label">Pago</div><div class="card-value green">${fmt(pago)}</div></div>
    <div class="card anim-fade-up anim-d3"><div class="card-stripe" style="background:var(--amber)"></div><div class="card-label">Falta pagar</div><div class="card-value ${falta>0?'amber':''}">${fmt(falta)}</div></div>
    <div class="card anim-fade-up anim-d4"><div class="card-stripe" style="background:var(--purple)"></div><div class="card-label">A vencer (7d)</div><div class="card-value ${aVencer>0?'purple':''}">${aVencer>0?fmt(aVencer):'R$ 0,00'}</div></div>`;
  document.getElementById('desp-title').textContent=`Despesas — ${mesLabel(m)}`;
  document.getElementById('desp-total-badge').textContent=fmt(total);
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
  const fixas = items.filter(d=>CATS_FIXAS.includes((d.cat||'').split(' · ')[0]));
  const variaveis = items.filter(d=>!CATS_FIXAS.includes((d.cat||'').split(' · ')[0]));
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
  if(editingBulkName){
    const oldName=editingBulkName;
    DATA.despesas.filter(d=>d.nome===oldName).forEach(d=>{
      d.status=newStatus;
      if(newVal!==undefined)d.val=newVal;
      if(newNome)d.nome=newNome;
      if(newIcon)d.icon=newIcon;
      if(newVenc){const day=new Date(newVenc+'T00:00:00').getDate();const[y,mo]=d.mes.split('-');const maxDay=new Date(+y,+mo,0).getDate();d.venc=`${d.mes}-${String(Math.min(day,maxDay)).padStart(2,'0')}`;}
    });
    editingBulkName=null;
  } else {
    const d=DATA.despesas.find(x=>x.id===editingId);if(!d)return;
    d.status=newStatus;
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
