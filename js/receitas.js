/* ══════ RECEITAS ══════ */
/* FIX 2: Ordenação */
let recSortKey='val', recSortDir=-1;
function sortRec(key){
  if(recSortKey===key)recSortDir*=-1; else{recSortKey=key;recSortDir=key==='val'?-1:1;}
  document.querySelectorAll('[id^="sort-rec-"]').forEach(el=>{el.textContent='↕';el.parentElement.classList.remove('sorted');});
  const el=document.getElementById('sort-rec-'+key);
  if(el){el.textContent=recSortDir===1?'↑':'↓';el.parentElement.classList.add('sorted');}
  renderRecTable();
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
  setTimeout(()=>document.addEventListener('click',recPickerOutside),0);
}
function recPickerOutside(e){if(!document.getElementById('rec-month-picker').contains(e.target)&&!document.querySelector('[onclick="toggleRecMonthPicker()"]').contains(e.target))closeRecMonthPicker();}
function closeRecMonthPicker(){document.getElementById('rec-month-picker').style.display='none';document.getElementById('rec-month-chevron').style.transform='rotate(0deg)';document.removeEventListener('click',recPickerOutside);}
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
  const m=recSelectedMonth;
  let items=DATA.receitas.filter(r=>r.mes===m);
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
    <div class="card anim-fade-up anim-d1"><div class="card-stripe" style="background:var(--green)"></div><div class="card-label">Recebido</div><div class="card-value green">${fmt(totalRecebido)}</div></div>
    <div class="card anim-fade-up anim-d2"><div class="card-stripe" style="background:var(--amber)"></div><div class="card-label">Aguardando</div><div class="card-value ${totalAguardando>0?'amber':''}">${fmt(totalAguardando)}</div></div>
    <div class="card anim-fade-up anim-d3"><div class="card-stripe" style="background:var(--purple)"></div><div class="card-label">Total</div><div class="card-value purple">${fmt(totalRec)}</div></div>`;
  document.getElementById('rec-table-title').textContent=`Receitas — ${mesLabel(m)}`;
  document.getElementById('rec-total-badge').textContent=fmt(totalRecebido)+(totalAguardando>0?` + ${fmt(totalAguardando)} aguardando`:'');
  const recRows = items.length
    ?items.map((r,ri)=>{const aguard=(r.status||'Recebido')==='Aguardando';const rd=`anim-d${Math.min(ri+1,10)}`;return`<tr class="tr-anim ${rd}" style="${aguard?'background:rgba(245,197,66,0.03)':''}">
        <td><div class="entry-name">${r.nome}</div>${r.cat?`<div class="entry-cat">${r.cat}</div>`:''}</td>
        <td><span class="cat-pill" style="background:var(--green-bg);color:var(--green)">${r.cat||'—'}</span></td>
        <td><span style="font-weight:700;color:${aguard?'var(--amber)':'var(--green)'}">${r.val>0?fmt(r.val):'—'}</span></td>
        <td><span class="badge ${aguard?'falta':'pago'}" style="${aguard?'background:var(--amber-bg);color:var(--amber)':''}">${aguard?'Aguardando':'Recebido'}</span></td>
        <td style="white-space:nowrap"><button class="edit-btn" onclick="openRecModal(${r.id})" style="margin-right:4px">✏️</button><button class="btn-del" onclick="deleteRecEntry(${r.id})">×</button></td>
      </tr>`;}).join('')
    +`<tr class="total-row"><td colspan="2">Total recebido</td><td style="color:var(--green)">${fmt(totalRecebido)}</td><td></td><td></td></tr>`
    :`<tr><td colspan="5" class="empty-msg">Nenhuma receita neste mês.</td></tr>`;
  document.getElementById('rec-tbody').innerHTML = recRows;

  // Mobile cards
  const rml = document.getElementById('rec-mobile-list');
  if(rml){
    rml.innerHTML = items.length
      ? items.map((r,ri)=>mobRecCard(r,ri)).join('')+
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
  showConfirm(`Excluir "${r.nome}"?`, ()=>{
    DATA.receitas=DATA.receitas.filter(x=>x.id!==id);
    saveData();renderReceitas();showToast('Removido!');
  });
}
function initSwipeDeleteRec(){
  document.querySelectorAll('[data-rec-id]').forEach(wrapper=>{
    const inner=wrapper.querySelector('.mob-card-inner');
    const bg=wrapper.querySelector('.swipe-delete-bg');
    if(!inner||!bg)return;
    let startX=0,startY=0,curX=0,swiping=false,locked=false;
    const THRESHOLD=80;
    inner.addEventListener('touchstart',e=>{
      startX=e.touches[0].clientX;startY=e.touches[0].clientY;
      curX=0;swiping=false;locked=false;inner.style.transition='none';
    },{passive:true});
    inner.addEventListener('touchmove',e=>{
      const dx=e.touches[0].clientX-startX;const dy=e.touches[0].clientY-startY;
      if(!swiping&&!locked){if(Math.abs(dy)>Math.abs(dx)){locked=true;return;}if(Math.abs(dx)>5)swiping=true;}
      if(!swiping||locked)return;
      e.preventDefault();curX=Math.min(0,dx);inner.style.transform=`translateX(${curX}px)`;
      bg.style.opacity=Math.min(1,Math.abs(curX)/THRESHOLD);
    },{passive:false});
    inner.addEventListener('touchend',()=>{
      inner.style.transition='transform .25s cubic-bezier(.4,0,.2,1)';
      if(Math.abs(curX)>=THRESHOLD){inner.style.transform='translateX(-100%)';bg.style.opacity='1';
        const id=Number(wrapper.dataset.recId);setTimeout(()=>deleteRecEntry(id),220);
      }else{inner.style.transform='';bg.style.opacity='0';}
    });
  });
}
