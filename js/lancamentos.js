/* ══════ LANÇAMENTOS ══════ */
let manageFilter='all';
function filterManage(f,el){manageFilter=f;document.querySelectorAll('#manage-filter .pfchip').forEach(c=>c.classList.remove('active'));el.classList.add('active');renderManageList();}

/* ══ PAINEL RECORRENTES (página Despesas) ══ */
let recorrentesFilter="all";
let recorrentesOpen=false;
function toggleRecorrentesPanel(){
  recorrentesOpen=!recorrentesOpen;
  const panel=document.getElementById("recorrentes-panel");
  const chevron=document.getElementById("recorrentes-chevron");
  if(recorrentesOpen){panel.style.display="block";chevron.style.transform="rotate(180deg)";renderRecorrentesList();
  }else{panel.style.display="none";chevron.style.transform="rotate(0deg)";}
}
function filterRecorrentes(f,el){
  recorrentesFilter=f;
  document.querySelectorAll("#recorrentes-filter .pfchip").forEach(c=>c.classList.remove("active"));
  el.classList.add("active");
  renderRecorrentesList();
}
function renderRecorrentesList(){
  const grouped={};
  DATA.despesas.forEach(d=>{
    if(!grouped[d.nome])grouped[d.nome]={nome:d.nome,cat:d.cat,icon:d.icon,count:0,statuses:new Set()};
    grouped[d.nome].count++;grouped[d.nome].statuses.add(d.status);
    if(d.icon)grouped[d.nome].icon=d.icon;
  });
  let entries=Object.values(grouped).filter(e=>e.count>1).sort((a,b)=>a.nome.localeCompare(b.nome));
  const badge=document.getElementById("recorrentes-count-badge");
  const total=Object.values(grouped).filter(e=>e.count>1).length;
  if(badge)badge.textContent=total?(total+" conta"+(total>1?"s":"")):" ";
  if(recorrentesFilter!=="all")entries=entries.filter(e=>e.statuses.has(recorrentesFilter));
  const el=document.getElementById("recorrentes-list");
  if(!el)return;
  if(!entries.length){el.innerHTML='<div class="empty-msg" style="padding:1rem 0">Nenhuma conta recorrente encontrada.</div>';return;}
  el.innerHTML=entries.map(e=>{
    const hasFalta=[...e.statuses].includes("Falta Pagar");
    const hasDebito=[...e.statuses].includes("Débito auto");
    const statusLabel=hasFalta?'<span class="badge falta" style="font-size:10px;padding:2px 7px">Falta Pagar</span>':hasDebito?'<span class="badge pago" style="font-size:10px;padding:2px 7px">Débito auto</span>':'<span class="badge pago" style="font-size:10px;padding:2px 7px">Pago</span>';
    const nomeSafe=e.nome.replace(/'/g,"\\'");
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--border);flex-wrap:wrap"><div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">${itemIcon(e.nome,e.icon)}<div style="min-width:0"><div style="font-weight:600;font-size:13px">${e.nome}</div><div style="font-size:11px;color:var(--text3);margin-top:2px;display:flex;align-items:center;gap:6px">${catLabel(e.cat)} · ${e.count} meses ${statusLabel}</div></div></div><div style="display:flex;gap:6px;flex-shrink:0"><button class="edit-btn" onclick="editAllByName('${nomeSafe}')">✏️ Editar</button><button class="edit-btn" style="border-color:var(--red);color:var(--red)" onclick="deleteAllByName('${nomeSafe}')">🗑</button></div></div>`;
  }).join("");
}
function updateRecorrentesBadge(){
  const grouped={};
  (DATA.despesas||[]).forEach(d=>{if(!grouped[d.nome])grouped[d.nome]=0;grouped[d.nome]++;});
  const count=Object.values(grouped).filter(c=>c>1).length;
  const badge=document.getElementById("recorrentes-count-badge");
  if(badge)badge.textContent=count?(count+" conta"+(count>1?"s":"")):" ";
}
function renderManageList(){
  const grouped={};
  DATA.despesas.forEach(d=>{
    if(!grouped[d.nome])grouped[d.nome]={nome:d.nome,cat:d.cat,icon:d.icon,count:0,statuses:new Set()};
    grouped[d.nome].count++;grouped[d.nome].statuses.add(d.status);
    if(d.icon)grouped[d.nome].icon=d.icon;
  });
  let entries=Object.values(grouped).sort((a,b)=>a.nome.localeCompare(b.nome));
  if(manageFilter!=='all')entries=entries.filter(e=>e.statuses.has(manageFilter));
  const el=document.getElementById('manage-list');
  if(!entries.length){el.innerHTML=`<div class="empty-msg" style="padding:1rem">Nenhuma conta encontrada.</div>`;return;}
  el.innerHTML=entries.map(e=>`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--border);flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
        ${itemIcon(e.nome,e.icon)}
        <div><div style="font-weight:600;font-size:13px">${e.nome}</div><div style="font-size:11px;color:var(--text3)">${catLabel(e.cat)} · ${e.count} mês(es)</div></div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="edit-btn" onclick="editAllByName('${e.nome.replace(/'/g,"\\'")}')">✏️</button>
        <button class="edit-btn" style="border-color:var(--red);color:var(--red)" onclick="deleteAllByName('${e.nome.replace(/'/g,"\\'")}')">🗑</button>
      </div>
    </div>`).join('');
}
function deleteAllByName(nome){
  const count=DATA.despesas.filter(d=>d.nome===nome).length;
  showConfirm(`Excluir todos os ${count} lançamentos de "${nome}"?`, ()=>{
    DATA.despesas=DATA.despesas.filter(d=>d.nome!==nome);
    saveData();showToast(`${count} lançamentos excluídos!`);renderManageList();
  });
}
function editAllByName(nome){
  const items=DATA.despesas.filter(d=>d.nome===nome);if(!items.length)return;
  const d=items[0];
  editingId=d.id;editingBulkName=nome;selectedIconEdit=d.icon||d.nome;
  document.getElementById('modal-title').textContent=`Editar todos — "${nome}" (${items.length} meses)`;
  document.getElementById('edit-nome').value=nome;
  document.getElementById('edit-name-hint').textContent=`Renomear todos os ${items.length} lançamentos.`;
  document.getElementById('edit-icon-preview').innerHTML=ICONS[selectedIconEdit]||DEFAULT_ICON;
  document.getElementById('edit-status').value=d.status||'Falta Pagar';
  document.getElementById('edit-venc').value='';
  document.getElementById('edit-valor').value=d.val>0?d.val:'';
  document.getElementById('edit-venc-scope-wrap').style.display='none';
  // Garante que o modal de edição aparece por cima do modal de despesa
  document.getElementById('add-desp-modal').classList.remove('open');
  document.getElementById('edit-modal').classList.add('open');
}

function toggleMesRange(){const v=document.getElementById('in-recorr').value;document.getElementById('mes-unico-wrap').style.display=v==='unico'?'flex':'none';document.getElementById('mes-range-wrap').style.display=v==='recorrente'?'block':'none';}
function toggleRecMesRange(){const v=document.getElementById('in-rec-recorr').value;document.getElementById('rec-mes-unico-wrap').style.display=v==='unico'?'flex':'none';document.getElementById('rec-mes-range-wrap').style.display=v==='recorrente'?'block':'none';}
function monthsBetween(ini,fim){const meses=[];let[y,m]=ini.split('-').map(Number);const[yf,mf]=fim.split('-').map(Number);while(y<yf||(y===yf&&m<=mf)){meses.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++;}}return meses;}

/* ── Validação de formulários ── */
function fieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('field-error');
  // Remove mensagem anterior se existir
  const prev = el.parentElement.querySelector('.field-error-msg');
  if (prev) prev.remove();
  const hint = document.createElement('div');
  hint.className = 'field-error-msg';
  hint.innerHTML = '⚠ ' + msg;
  el.parentElement.appendChild(hint);
  el.focus();
  el.addEventListener('input', function clear() {
    el.classList.remove('field-error');
    el.classList.add('field-ok');
    hint.remove();
    el.removeEventListener('input', clear);
    setTimeout(() => el.classList.remove('field-ok'), 1200);
  }, { once: false });
}
function clearFieldErrors(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('field-error', 'field-ok');
    const prev = el.parentElement.querySelector('.field-error-msg');
    if (prev) prev.remove();
  });
}

function addEntry(){
  const desc=document.getElementById('in-desc').value.trim();
  const cat=document.getElementById('in-cat').value;
  const pag=document.getElementById('in-pag').value;
  const valRaw=document.getElementById('in-valor').value;
  const val=valRaw===''?null:parseFloat(valRaw);
  const diaVencRaw=document.getElementById('in-dia-venc').value;
  const diaVenc=diaVencRaw?parseInt(diaVencRaw):null;
  const status=document.getElementById('in-status').value;
  const recorr=document.getElementById('in-recorr').value;
  clearFieldErrors(['in-desc','in-valor','in-mes','in-mes-ini','in-mes-fim']);
  let hasError = false;
  if(!desc){ fieldError('in-desc','Nome obrigatório'); hasError=true; }
  if(valRaw !== '' && (isNaN(val) || val < 0)){ fieldError('in-valor','Digite um valor válido (ex: 150,00)'); hasError=true; }
  let meses=[];
  if(recorr==='unico'){
    const mes=document.getElementById('in-mes').value;
    if(!mes){ fieldError('in-mes','Selecione o mês'); hasError=true; }
    else meses=[mes];
  } else {
    const ini=document.getElementById('in-mes-ini').value;
    const fim=document.getElementById('in-mes-fim').value;
    if(!ini){ fieldError('in-mes-ini','Selecione o mês inicial'); hasError=true; }
    if(!fim){ fieldError('in-mes-fim','Selecione o mês final'); hasError=true; }
    if(ini&&fim&&ini>fim){ fieldError('in-mes-fim','Mês final deve ser após o inicial'); hasError=true; }
    if(!hasError) meses=monthsBetween(ini,fim);
  }
  if(hasError) return;
  meses.forEach(mes=>{
    let venc=null;
    if(diaVenc){const[y,mo]=mes.split('-');const maxDay=new Date(+y,+mo,0).getDate();const dd=String(Math.min(diaVenc,maxDay)).padStart(2,'0');venc=`${mes}-${dd}`;}
    DATA.despesas.push({id:Date.now()+Math.random(),nome:desc,cat,pag,mes,val,status,venc,diaVenc,icon:selectedIcon||null});
  });
  saveData();
  document.getElementById('in-desc').value='';document.getElementById('in-valor').value='';document.getElementById('in-dia-venc').value='';
  selectedIcon=null;document.getElementById('icon-picker-preview').innerHTML=DEFAULT_ICON;
  closeAddDesp();
  const now=new Date(),cm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  despSelectedMonth=allMonths().includes(cm)?cm:meses[meses.length-1];
  showPage('despesas');
  showToast(meses.length>1?`${meses.length} lançamentos adicionados!`:'Despesa adicionada!');
}

function addReceita(){
  const desc=document.getElementById('in-rec-desc').value.trim();
  const valRaw=document.getElementById('in-rec-valor').value;
  const val=valRaw===''?null:parseFloat(valRaw);
  const recorr=document.getElementById('in-rec-recorr').value;
  clearFieldErrors(['in-rec-desc','in-rec-valor','in-rec-mes','in-rec-mes-ini','in-rec-mes-fim']);
  let hasErrorR = false;
  if(!desc){ fieldError('in-rec-desc','Nome obrigatório'); hasErrorR=true; }
  if(valRaw !== '' && (isNaN(val) || val < 0)){ fieldError('in-rec-valor','Digite um valor válido (ex: 3500,00)'); hasErrorR=true; }
  let meses=[];
  if(recorr==='unico'){
    const mes=document.getElementById('in-rec-mes').value;
    if(!mes){ fieldError('in-rec-mes','Selecione o mês'); hasErrorR=true; }
    else meses=[mes];
  } else {
    const ini=document.getElementById('in-rec-mes-ini').value;
    const fim=document.getElementById('in-rec-mes-fim').value;
    if(!ini){ fieldError('in-rec-mes-ini','Selecione o mês inicial'); hasErrorR=true; }
    if(!fim){ fieldError('in-rec-mes-fim','Selecione o mês final'); hasErrorR=true; }
    if(ini&&fim&&ini>fim){ fieldError('in-rec-mes-fim','Mês final deve ser após o inicial'); hasErrorR=true; }
    if(!hasErrorR) meses=monthsBetween(ini,fim);
  }
  if(hasErrorR) return;
  meses.forEach(mes=>{DATA.receitas.push({id:Date.now()+Math.random(),nome:desc,cat:document.getElementById('in-rec-cat').value,mes,val,status:document.getElementById('in-rec-status').value});});
  saveData();
  document.getElementById('in-rec-desc').value='';document.getElementById('in-rec-valor').value='';
  closeAddRec();showPage('receitas');
  showToast(meses.length>1?`${meses.length} receitas adicionadas!`:'Receita adicionada!');
}

function deleteDespEntry(id){
  id=Number(id);
  const d=DATA.despesas.find(x=>x.id===id);
  if(!d)return;
  showConfirm(`Excluir "${d.nome}"?`, ()=>{
    DATA.despesas=DATA.despesas.filter(x=>x.id!==id);
    saveData();renderDespTable();renderCurMonth();showToast('Removido!');
  });
}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
