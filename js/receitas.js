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
  select.innerHTML=`<option value="all">Categoria</option>`+categories.map(cat=>`<option value="${historyEscape(cat)}">${historyEscape(cat)}</option>`).join('');
  select.value=recFilterCat;
  const status=document.getElementById('rec-status-filter'); if(status) status.value=recFilterStatus;

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
  recSelectedMonth=getCurMonth();
  updateRecMonthBtn();renderRecTable();renderRecCharts();
}
function updateRecMonthBtn(){if(typeof updateFinanceMonthControls==='function')updateFinanceMonthControls();}
function toggleRecMonthPicker(){openFinanceMonthPicker();}
function closeRecMonthPicker(){if(typeof closeFinanceMonthPicker==='function')closeFinanceMonthPicker();}
function selectRecMonth(month){selectFinanceMonth(month);}
function stepRecMonth(delta){stepFinanceMonth(delta);}

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
  const monthTotal=DATA.receitas.filter(r=>r.mes===m).length;
  const filtersActive=updateHistoryFilterSummary('rec',items.length,monthTotal);
  const emptyState=historyEmptyState('rec',monthTotal);
  const totalRecebido=items.filter(r=>(r.status||'Recebido')==='Recebido').reduce((s,r)=>s+(r.val||0),0);
  const totalAguardando=items.filter(r=>r.status==='Aguardando').reduce((s,r)=>s+(r.val||0),0);
  const totalRec=totalRecebido+totalAguardando;
  document.getElementById('cards-rec').innerHTML=`
    <div class="finance-summary-card anim-fade-up anim-d1">
      <div class="finance-summary-heading"><span class="finance-summary-dot" style="background:var(--green)"></span>${filtersActive?'Resumo filtrado':'Resumo do mês'}</div>
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
        <td><span class="badge ${aguard?'falta':'pago'}" style="${aguard?'background:var(--amber-bg);color:var(--amber)':''}">${aguard?'Aguardando':'Recebido'}</span>${aguard?`<button type="button" class="entry-table-pay" onclick="markRevenueReceived(${r.id})">Receber</button>`:''}</td>
        <td style="white-space:nowrap"><button class="edit-btn" onclick="openRecModal(${r.id})" style="margin-right:4px;display:inline-flex;align-items:center" title="Editar lançamento" aria-label="Editar lançamento">${uiIcon('edit',14)} Editar</button><button class="btn-del" onclick="deleteRecEntry(${r.id})" style="display:inline-flex;align-items:center" title="Enviar à lixeira" aria-label="Enviar lançamento à lixeira">${uiIcon('trash',14)} Lixeira</button></td>
      </tr>`;}).join('')
    +`<tr class="total-row"><td colspan="2">Total recebido</td><td style="color:var(--green)">${fmt(totalRecebido)}</td><td></td><td></td></tr>`
    :`<tr><td colspan="5" class="empty-msg">${emptyState}</td></tr>`;
  document.getElementById('rec-tbody').innerHTML = recRows;

  // Mobile cards
  const rml = document.getElementById('rec-mobile-list');
  if(rml){
    rml.innerHTML = items.length
      ? mobileGestureHint('Marcar como recebido')+items.map((r,ri)=>mobRecCard(r,ri)).join('')+
        `<div class="mob-total-row"><span>Total recebido</span><span style="color:var(--green)">${fmt(totalRecebido)}</span></div>`
      : `<div class="empty-msg">${emptyState}</div>`;
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
  if(typeof setupFinanceForm==='function')setupFinanceForm('edit-rec-modal');
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
  saveData();closeRecModal();if(typeof setFinanceMonth==='function'&&mes)setFinanceMonth(mes,false);renderReceitas();showToast('Receita atualizada!');
}
function closeRecModal(){document.getElementById('edit-rec-modal').classList.remove('open');if(typeof closeFinanceForm==='function')closeFinanceForm('edit-rec-modal');editingRecId=null;}
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
