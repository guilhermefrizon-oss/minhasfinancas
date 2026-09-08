/* ══════ RECEITAS ══════ */
/* FIX 2: Ordenação */
let _recPrefs={};try{_recPrefs=JSON.parse(localStorage.getItem('gastos_view_rec')||'{}');}catch(e){}
let recSortKey=_recPrefs.sortKey||'val', recSortDir=_recPrefs.sortDir||-1;
let recFilterStatus=_recPrefs.status||'all', recFilterCat=_recPrefs.cat||'all';
function saveRecViewPrefs(){localStorage.setItem('gastos_view_rec',JSON.stringify({sortKey:recSortKey,sortDir:recSortDir,status:recFilterStatus,cat:recFilterCat}));}

function setRecFilter(type, value){
  if(type==='status') recFilterStatus=value;
  if(type==='cat') recFilterCat=value;
  saveRecViewPrefs();
  renderRecTable();
}
function clearRecFilters(){
  recFilterStatus='all'; recFilterCat='all';
  saveRecViewPrefs();
  const search=document.getElementById('rec-search'); if(search) search.value='';
  document.getElementById('rec-search-wrap')?.classList.remove('has-value','search-open');
  renderRecTable();
}
function updateRecCategoryFilter(){
  const select=document.getElementById('rec-cat-filter');
  if(!select) return;
  const categories=[...new Set(DATA.receitas.map(r=>r.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(recFilterCat!=='all'&&!categories.includes(recFilterCat)) recFilterCat='all';
  select.innerHTML=`<option value="all">Categoria</option>`+categories.map(cat=>`<option value="${cat}">${cat}</option>`).join('');
  select.value=recFilterCat;
  const status=document.getElementById('rec-status-filter'); if(status) status.value=recFilterStatus;
  const clear=document.getElementById('rec-clear-filters');
  const activeCount = Number(recFilterStatus!=='all') + Number(recFilterCat!=='all') + Number(!!document.getElementById('rec-search')?.value);
  if(clear){
    clear.style.display=activeCount?'inline-flex':'none';
    clear.textContent=`Limpar filtros (${activeCount})`;
    clear.setAttribute('aria-label', `Limpar ${activeCount} filtro${activeCount>1?'s':''} ativo${activeCount>1?'s':''}`);
  }
}
function sortRec(key){
  if(recSortKey===key)recSortDir*=-1; else{recSortKey=key;recSortDir=key==='val'?-1:1;}
  syncRecSortIndicator();
  saveRecViewPrefs();
  renderRecTable();
}
function syncRecSortIndicator(){
  document.querySelectorAll('[id^="sort-rec-"]').forEach(el=>{el.textContent='↕';el.parentElement.classList.remove('sorted');});
  const el=document.getElementById('sort-rec-'+recSortKey);
  if(el){el.textContent=recSortDir===1?'↑':'↓';el.parentElement.classList.add('sorted');}
}

let recPickerYear=null,editingRecId=null;
function renderReceitas(){
  // Mostra skeleton imediatamente
  const rtbody = document.getElementById('rec-tbody');
  if(rtbody && !rtbody.children.length) rtbody.innerHTML = tableSkeleton(4,5).replace('<tbody','<tbody id="rec-tbody"').replace('</tbody>','');
  const months=allMonths();
  if(!recSelectedMonth||!months.includes(recSelectedMonth)){const now=new Date(),cm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;recSelectedMonth=months.includes(cm)?cm:months[months.length-1];}
  updateRecMonthBtn();renderRecTable();renderRecCharts();
}
function updateRecMonthBtn(){const[y,mo]=recSelectedMonth.split('-');document.getElementById('rec-month-btn-label').textContent=new Date(+y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase();}
function toggleRecMonthPicker(){
  const picker=document.getElementById('rec-month-picker');const open=picker.style.display==='block';
  if(open){closeRecMonthPicker();return;}
  picker.style.display='block';document.getElementById('rec-month-chevron').style.transform='rotate(180deg)';
  recPickerYear=parseInt(recSelectedMonth.split('-')[0]);renderRecPickerYear();
  // Posiciona o picker
  const btn=document.getElementById('rec-month-btn');
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
    document.addEventListener('click',recPickerOutside);
    document.addEventListener('touchstart',recPickerOutside,{passive:true});
  },50);
}
function recPickerOutside(e){
  const picker=document.getElementById('rec-month-picker');
  const btn=document.getElementById('rec-month-btn');
  if(!picker||!btn)return;
  if(!picker.contains(e.target)&&!btn.contains(e.target))closeRecMonthPicker();
}
function closeRecMonthPicker(){document.getElementById('rec-month-picker').style.display='none';document.getElementById('rec-month-chevron').style.transform='rotate(0deg)';const bd=document.getElementById('picker-backdrop');if(bd)bd.style.display='none';document.removeEventListener('click',recPickerOutside);document.removeEventListener('touchstart',recPickerOutside);}
function shiftRecYear(delta){const years=[...new Set(allMonths().map(m=>parseInt(m.split('-')[0])))];const idx=years.indexOf(recPickerYear)+delta;if(idx<0||idx>=years.length)return;recPickerYear=years[idx];renderRecPickerYear();}
function renderRecPickerYear(){
  const months=allMonths().filter(m=>parseInt(m.split('-')[0])===recPickerYear);
  const MN=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('rec-year-label').textContent=recPickerYear;
  document.getElementById('rec-month-list').innerHTML=months.length?months.map(m=>{const mo=parseInt(m.split('-')[1]),active=m===recSelectedMonth;return`<div onclick="selectRecMonth('${m}')" style="padding:10px 18px;cursor:pointer;font-size:13px;font-weight:${active?700:500};color:${active?'var(--green)':'var(--text2)'};background:${active?'var(--surface2)':'transparent'};transition:all .1s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='${active?'var(--surface2)':'transparent'}'"> ${MN[mo-1]}</div>`;}).join(''):`<div style="padding:12px 18px;font-size:12px;color:var(--text3)">Sem dados em ${recPickerYear}</div>`;
}
function selectRecMonth(m){recSelectedMonth=m;updateRecMonthBtn();closeRecMonthPicker();renderRecTable();}
function stepRecMonth(delta){const months=allMonths();const idx=months.indexOf(recSelectedMonth)+delta;if(idx<0||idx>=months.length)return;recSelectedMonth=months[idx];updateRecMonthBtn();renderRecTable();}

function renderRecTable(){
  syncRecSortIndicator();
  const m=recSelectedMonth;
  const q=(document.getElementById('rec-search')?.value||'').toLowerCase().trim();
  updateRecCategoryFilter();
  let items=DATA.receitas.filter(r=>r.mes===m).filter(r=>
    (recFilterStatus==='all'||(r.status||'Recebido')===recFilterStatus) &&
    (recFilterCat==='all'||r.cat===recFilterCat) &&
    (!q||(r.nome||'').toLowerCase().includes(q)||(r.cat||'').toLowerCase().includes(q))
  );
  /* FIX 2: apply sort */
  items=[...items].sort((a,b)=>{
    let va,vb;
    if(recSortKey==='nome'){va=(a.nome||'').toLowerCase();vb=(b.nome||'').toLowerCase();return recSortDir*(va<vb?-1:va>vb?1:0);}
    if(recSortKey==='cat'){va=(a.cat||'').toLowerCase();vb=(b.cat||'').toLowerCase();return recSortDir*(va<vb?-1:va>vb?1:0);}
    if(recSortKey==='val'){return recSortDir*((b.val||0)-(a.val||0));}
    if(recSortKey==='status'){va=a.status||'';vb=b.status||'';return recSortDir*(va<vb?-1:va>vb?1:0);}
    return 0;
  });
  const totalRecebido=items.filter(r=>(r.status||'Recebido')==='Recebido').reduce((s,r)=>s+(r.val||0),0);
  const totalAguardando=items.filter(r=>r.status==='Aguardando').reduce((s,r)=>s+(r.val||0),0);
  const totalRec=totalRecebido+totalAguardando;
  document.getElementById('cards-rec').innerHTML=`
    <div class="finance-summary-card anim-fade-up anim-d1">
      <div class="finance-summary-heading"><span class="finance-summary-dot" style="background:var(--green)"></span>Resumo do mês</div>
      <div class="cmv-hero">
        <div class="cmv-hero-label">Total de receitas</div>
        <div class="cmv-hero-val" style="color:var(--green)">${fmt(totalRec)}</div>
      </div>
      <div class="cmv-sub-row">
        <div class="cmv-sub-item"><span class="cmv-sub-label">Recebido</span><span class="cmv-sub-val" style="color:var(--green)">${fmt(totalRecebido)}</span></div>
        <div class="cmv-sub-sep"></div>
        <div class="cmv-sub-item cmv-sub-desp"><span class="cmv-sub-label">Aguardando</span><span class="cmv-sub-val" style="color:var(--amber)">${fmt(totalAguardando)}</span></div>
      </div>
    </div>`;
  // título e badge removidos (info já aparece nos cards acima)
  const recRows = items.length
    ?items.map((r,ri)=>{const aguard=(r.status||'Recebido')==='Aguardando';const rd=`anim-d${Math.min(ri+1,10)}`;return`<tr class="tr-anim ${rd}" style="${aguard?'background:rgba(245,197,66,0.03)':''}">
        <td><div class="entry-name">${r.nome}</div>${r.cat?`<div class="entry-cat">${r.cat}</div>`:''}</td>
        <td><span class="cat-pill" style="background:var(--green-bg);color:var(--green)">${r.cat||'—'}</span></td>
        <td><span style="font-weight:700;color:${aguard?'var(--amber)':'var(--green)'}">${r.val>0?fmt(r.val):'—'}</span></td>
        <td><span class="badge ${aguard?'falta':'pago'}" style="${aguard?'background:var(--amber-bg);color:var(--amber)':''}">${aguard?'Aguardando':'Recebido'}</span></td>
        <td style="white-space:nowrap"><button class="edit-btn" onclick="openRecModal(${r.id})" style="margin-right:4px;display:inline-flex;align-items:center" title="Editar">${uiIcon('edit',14)}</button><button class="btn-del" onclick="deleteRecEntry(${r.id})" style="display:inline-flex;align-items:center" title="Excluir">${uiIcon('trash',14)}</button></td>
      </tr>`;}).join('')
    +`<tr class="total-row"><td colspan="2">Total recebido</td><td style="color:var(--green)">${fmt(totalRecebido)}</td><td></td><td></td></tr>`
    :`<tr><td colspan="5" class="empty-msg">Nenhuma receita neste mês.</td></tr>`;
  document.getElementById('rec-tbody').innerHTML = recRows;

  // Mobile cards
  const rml = document.getElementById('rec-mobile-list');
  if(rml){
    rml.innerHTML = items.length
      ? mobileGestureHint('Marcar como recebido')+items.map((r,ri)=>mobRecCard(r,ri)).join('')+
        `<div class="mob-total-row"><span>Total recebido</span><span style="color:var(--green)">${fmt(totalRecebido)}</span></div>`
      : `<div class="empty-msg">Nenhuma receita neste mês.</div>`;
    initSwipeDeleteRec();
  }
}
function renderRecCharts(){
  const months=allMonths();
  const rec=months.map(m=>DATA.receitas.filter(r=>r.mes===m).reduce((s,r)=>s+(r.val||0),0));
  const recebido=months.map(m=>DATA.receitas.filter(r=>r.mes===m&&(r.status||'Recebido')==='Recebido').reduce((s,r)=>s+(r.val||0),0));
  const aguard=months.map(m=>DATA.receitas.filter(r=>r.mes===m&&r.status==='Aguardando').reduce((s,r)=>s+(r.val||0),0));
  const ttB={backgroundColor:'#1a1830',borderColor:'#2e2c50',borderWidth:1};
  if(recC)recC.destroy();
  recC=new Chart(document.getElementById('chartRec'),{type:'bar',data:{labels:months.map(mesLabel),datasets:[
    {label:'Recebido',data:recebido.map(v=>Math.round(v*100)/100),backgroundColor:'rgba(52,210,122,0.7)',borderRadius:4},
    {label:'Aguardando',data:aguard.map(v=>Math.round(v*100)/100),backgroundColor:'rgba(245,197,66,0.5)',borderRadius:4}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{...ttB,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${fmt(ctx.raw)}`}}},scales:{x:{ticks:{color:'#5c5a80',autoSkip:false,maxRotation:45,font:{size:11}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#5c5a80',callback:v=>'R$'+v.toLocaleString('pt-BR'),font:{size:11}},grid:{color:'rgba(255,255,255,0.06)'}}}}});
  if(saldoRecC)saldoRecC.destroy();saldoRecC=null;
}
function openRecModal(id){
  const r=DATA.receitas.find(x=>x.id===id);if(!r)return;
  editingRecId=id;
  document.getElementById('edit-rec-modal-title').textContent=`Editar — ${r.nome}`;
  document.getElementById('edit-rec-nome').value=r.nome;
  document.getElementById('edit-rec-cat').value=r.cat||'Salário';
  setMoneyField('edit-rec-valor', r.val>0?r.val:null);
  document.getElementById('edit-rec-status').value=r.status||'Recebido';
  document.getElementById('edit-rec-mes').value=r.mes;
  document.getElementById('edit-rec-modal').classList.add('open');
}
function saveRecEdit(){
  if(!editingRecId)return;
  clearFieldErrors(['edit-rec-nome','edit-rec-valor']);
  const r=DATA.receitas.find(x=>x.id===editingRecId);if(!r)return;
  const nome=document.getElementById('edit-rec-nome').value.trim();
  const cat=document.getElementById('edit-rec-cat').value;
  const val=readMoneyField('edit-rec-valor');
  const mes=document.getElementById('edit-rec-mes').value;
  const status=document.getElementById('edit-rec-status').value;
  if(!nome){ fieldError('edit-rec-nome','Nome obrigatório'); return; }
  if(val!==null&&val<0){ fieldError('edit-rec-valor','Valor inválido'); return; }
  r.nome=nome;r.cat=cat;if(val!==null&&val>0)r.val=val;if(mes)r.mes=mes;r.status=status;
  saveData();closeRecModal();renderReceitas();showToast('Receita atualizada!');
}
function closeRecModal(){document.getElementById('edit-rec-modal').classList.remove('open');editingRecId=null;}
document.getElementById('edit-rec-modal').addEventListener('click',function(e){if(e.target===this)closeRecModal();});
function deleteRecEntry(id){
  id=Number(id);
  const r=DATA.receitas.find(x=>x.id===id);
  if(!r)return;
  showConfirm(`Mover "${r.nome}" para a lixeira?`, ()=>{
    moveToTrash('receita',r);
    DATA.receitas=DATA.receitas.filter(x=>x.id!==id);
    saveData();renderReceitas();showToast('Movido para a lixeira!');
  },{label:'Mover',sub:'Você poderá restaurar este lançamento depois.',tone:'neutral'});
}
function initSwipeDeleteRec(){
  document.querySelectorAll('[data-rec-id]').forEach(wrapper=>{
    const id=Number(wrapper.dataset.recId);
    bindSwipeActions(wrapper,()=>markRevenueReceived(id),()=>deleteRecEntry(id));
  });
}
function markRevenueReceived(id){
  const r=DATA.receitas.find(x=>x.id===id);if(!r)return;
  if((r.status||'Recebido')==='Recebido'){showToast('Essa receita já foi recebida.');return;}
  toggleRecStatus(id);
}
