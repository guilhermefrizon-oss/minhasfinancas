/* ══════ LANÇAMENTOS ══════ */
let manageFilter='all';
function filterManage(f,el){manageFilter=f;document.querySelectorAll('#manage-filter .pfchip').forEach(c=>c.classList.remove('active'));el.classList.add('active');renderManageList();}

/* ── Inline toggle helper ── */
function setToggle(groupId, hiddenId, btn){
  document.querySelectorAll('#'+groupId+' .toggle-opt').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(hiddenId).value = btn.dataset.val;
  if(typeof updateNewRecurringSummary==='function')updateNewRecurringSummary();
  if(typeof updateNewInstallmentSummary==='function')updateNewInstallmentSummary();
}

/* ── Gerenciar recorrentes: modal próprio ── */
function openManageRecorrentes(){
  initializeRecurringAccounts();
  renderManageList();
  document.getElementById('manage-recorr-modal').classList.add('open');
}
function closeManageRecorrentes(){
  document.getElementById('manage-recorr-modal').classList.remove('open');
}

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
function recurringIdForName(nome){
  let hash=0;for(const ch of (nome||'')){hash=((hash<<5)-hash)+ch.charCodeAt(0);hash|=0;}
  return `rec-${Math.abs(hash).toString(36)}`;
}
function currentMonthKey(){const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;}
function recurringDueDate(month,day){if(!day)return null;const[y,m]=month.split('-').map(Number);const max=new Date(y,m,0).getDate();return `${month}-${String(Math.min(Number(day),max)).padStart(2,'0')}`;}
function recurringConfigForMonth(r,month){
  const cfg={...r};
  (r.alteracoes||[]).filter(a=>a.from<=month).sort((a,b)=>a.from.localeCompare(b.from)).forEach(a=>Object.assign(cfg,a.data));
  return cfg;
}

function initializeRecurringAccounts(persist=true){
  let changed=false;
  if(!Array.isArray(DATA.recorrentes)){
    DATA.recorrentes=[];
    changed=true;
  }
  // Corrige a primeira versão da migração, que confundia compras repetidas no
  // histórico (viagens, passeios etc.) com contas realmente recorrentes.
  const inferredIds=new Set(DATA.recorrentes
    .filter(r=>r.id===recurringIdForName(r.nome))
    .map(r=>r.id));
  if(inferredIds.size){
    DATA.despesas=DATA.despesas.filter(d=>!(d.origem==='recorrente'&&inferredIds.has(d.recorrenteId)));
    DATA.despesas.forEach(d=>{if(inferredIds.has(d.recorrenteId)){delete d.recorrenteId;delete d.origem;}});
    DATA.recorrentes=DATA.recorrentes.filter(r=>!inferredIds.has(r.id));
    changed=true;
  }
  // Recupera uma única vez apenas as contas que já estavam programadas para
  // o mês atual ou para o futuro. Despesas encerradas no passado ficam fora.
  if(DATA.recorrentesVersao!==2){
    const cm=currentMonthKey(),groups={};
    DATA.despesas.filter(d=>d.origem!=='recorrente').forEach(d=>{(groups[d.nome]||(groups[d.nome]=[])).push(d);});
    Object.values(groups).filter(items=>items.length>1&&items.some(d=>(d.mes||'')>=cm)).forEach(items=>{
      const sorted=[...items].sort((a,b)=>(a.mes||'').localeCompare(b.mes||''));
      const latest=sorted[sorted.length-1];
      if(DATA.recorrentes.some(r=>r.nome.toLowerCase()===latest.nome.toLowerCase()))return;
      const id=`rec-v2-${recurringIdForName(latest.nome).slice(4)}`;
      items.forEach(d=>{d.recorrenteId=id;});
      DATA.recorrentes.push({id,nome:latest.nome,cat:latest.cat||'Outros',pag:latest.pag||'',val:latest.val??null,diaVenc:latest.diaVenc||(latest.venc?Number(latest.venc.slice(-2)):null),status:latest.status==='Débito auto'?'Débito auto':'Falta Pagar',tipo:latest.tipo||guessTipo(latest.cat),icon:latest.icon||null,ativo:true,inicio:sorted[0].mes||cm,migradoAtivo:true,criadoEm:Date.now()});
    });
    DATA.recorrentesVersao=2;
    changed=true;
  }
  changed=ensureRecurringEntriesForMonth(currentMonthKey(),false)||changed;
  if(changed&&persist&&typeof saveData==='function')saveData();
  return changed;
}

function ensureRecurringEntriesForMonth(month,persist=true){
  if(!Array.isArray(DATA.recorrentes))return false;
  let changed=false;
  DATA.recorrentes.filter(r=>r.ativo!==false&&(!r.inicio||r.inicio<=month)).forEach(r=>{
    if((r.pularMeses||[]).includes(month))return;
    let existing=DATA.despesas.find(d=>d.mes===month&&(d.recorrenteId===r.id||(!d.recorrenteId&&d.nome===r.nome)));
    if(existing){if(!existing.recorrenteId){existing.recorrenteId=r.id;changed=true;}return;}
    const cfg=recurringConfigForMonth(r,month);
    DATA.despesas.push({id:Date.now()+Math.random(),recorrenteId:r.id,origem:'recorrente',nome:cfg.nome,cat:cfg.cat,pag:cfg.pag,mes:month,val:cfg.val,status:cfg.status||'Falta Pagar',venc:recurringDueDate(month,cfg.diaVenc),diaVenc:cfg.diaVenc||null,tipo:cfg.tipo||guessTipo(cfg.cat),icon:cfg.icon||null,pagoEm:null});
    changed=true;
  });
  if(changed&&persist)saveData();
  return changed;
}

function recurringEntries(filter='all'){
  initializeRecurringAccounts(false);
  let entries=[...(DATA.recorrentes||[])];
  if(filter==='active')entries=entries.filter(r=>r.ativo!==false);
  if(filter==='paused')entries=entries.filter(r=>r.ativo===false);
  return entries.sort((a,b)=>(a.diaVenc||99)-(b.diaVenc||99)||a.nome.localeCompare(b.nome,'pt-BR'));
}
function recurringCard(r){
  r=recurringConfigForMonth(r,currentMonthKey());
  const active=r.ativo!==false;
  const value=r.val==null?'Valor variável':fmt(r.val);
  const due=r.diaVenc?`Vence dia ${r.diaVenc}`:'Sem vencimento';
  return `<article class="recurring-admin-card ${active?'':'is-paused'}">
    <div class="recurring-admin-main">${itemIcon(r.nome,r.icon)}<div class="recurring-admin-copy"><div class="recurring-admin-title">${r.nome}</div><div class="recurring-admin-meta">${catLabel(r.cat)}${r.pag?' · '+r.pag:''}</div><div class="recurring-admin-details"><strong>${value}</strong><span>${due}</span></div></div></div>
    <span class="recurring-state ${active?'is-active':'is-paused'}">${active?'Ativa':'Pausada'}</span>
    <div class="recurring-admin-actions"><button type="button" class="recurring-action" onclick="toggleRecurringAccount('${r.id}')" title="${active?'Pausar':'Ativar'}">${uiIcon(active?'pause':'play',15)}<span>${active?'Pausar':'Ativar'}</span></button><button type="button" class="recurring-action" onclick="openEditRecurringAccount('${r.id}')" title="Editar">${uiIcon('edit',15)}<span>Editar</span></button><button type="button" class="recurring-action is-danger" onclick="deleteRecurringAccount('${r.id}')" title="Excluir">${uiIcon('trash',15)}<span>Excluir</span></button></div>
  </article>`;
}
function renderRecurringCollection(elementId,filter){
  const el=document.getElementById(elementId);if(!el)return;
  const entries=recurringEntries(filter);
  el.innerHTML=entries.length?entries.map(recurringCard).join(''):`<div class="recurring-empty">Nenhuma conta ${filter==='paused'?'pausada':filter==='active'?'ativa':'recorrente'}.</div>`;
}
function renderRecorrentesList(){renderRecurringCollection('recorrentes-list',recorrentesFilter);updateRecorrentesBadge();}
function renderManageList(){renderRecurringCollection('manage-list',manageFilter);}
function updateRecorrentesBadge(){
  const list=Array.isArray(DATA.recorrentes)?DATA.recorrentes:[];
  const active=list.filter(r=>r.ativo!==false).length;
  const badge=document.getElementById('recorrentes-count-badge');if(badge)badge.textContent=active?`${active} ativa${active>1?'s':''}`:'Nenhuma ativa';
}
function refreshRecurringAdmin(){updateRecorrentesBadge();if(recorrentesOpen)renderRecorrentesList();renderManageList();if(typeof renderDespTable==='function')renderDespTable();if(typeof renderOverview==='function')renderOverview();}
function toggleRecurringAccount(id){const r=(DATA.recorrentes||[]).find(x=>x.id===id);if(!r)return;r.ativo=r.ativo===false;saveData();refreshRecurringAdmin();showToast(r.ativo?'Conta ativada!':'Conta pausada.');}
function deleteRecurringAccount(id){
  const r=(DATA.recorrentes||[]).find(x=>x.id===id);if(!r)return;
  showConfirm(`Mover o cadastro recorrente de "${r.nome}" para a lixeira?`,()=>{moveToTrash('recorrente',r);DATA.recorrentes=DATA.recorrentes.filter(x=>x.id!==id);saveData();refreshRecurringAdmin();showToast('Cadastro movido para a lixeira.');},{label:'Mover',sub:'Você poderá restaurá-lo depois. Os lançamentos já criados serão preservados.',tone:'neutral',icon:'trash'});
}

let editingRecurringId=null,selectedRecurringIcon=null,editingRecurringMonth=null,editingRecurringMonths=new Set(),editingRecurringScope='from';
function recurringTimelineMonths(){
  const now=new Date(),months=[];
  for(let offset=-2;offset<=7;offset++){const d=new Date(now.getFullYear(),now.getMonth()+offset,1);months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}
  return months;
}
function recurringMonthEntry(id,month){return DATA.despesas.find(d=>d.recorrenteId===id&&d.mes===month);}
function recurringMonthLabel(month){const[y,m]=month.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('pt-BR',{month:'short'}).replace('.','');}
function renderRecurringTimeline(){
  const el=document.getElementById('recurring-timeline');if(!el)return;
  const cm=currentMonthKey();
  el.innerHTML=recurringTimelineMonths().map(month=>{
    const entry=recurringMonthEntry(editingRecurringId,month),paid=entry?.status==='Pago',past=month<cm,disabled=past||paid;
    const state=paid?'is-paid':entry?'is-generated':'is-future';
    return `<button type="button" class="recurring-month ${state} ${editingRecurringMonths.has(month)?'is-selected':''}" ${disabled?'disabled':''} onclick="selectRecurringMonth('${month}')"><span>${recurringMonthLabel(month)}</span><small>${month.slice(0,4)}</small><i></i></button>`;
  }).join('');
  requestAnimationFrame(()=>el.querySelector('.is-selected')?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}));
}
function loadRecurringMonthForm(){
  const r=(DATA.recorrentes||[]).find(x=>x.id===editingRecurringId);if(!r)return;
  const entry=recurringMonthEntry(r.id,editingRecurringMonth),cfg=entry||recurringConfigForMonth(r,editingRecurringMonth);
  selectedRecurringIcon=cfg.icon||guessIconKey(cfg.nome)||null;
  document.getElementById('recurring-edit-name').value=cfg.nome||'';
  document.getElementById('recurring-edit-cat').value=cfg.cat||'';
  document.getElementById('recurring-edit-pag').value=cfg.pag||'';
  setMoneyField('recurring-edit-value',cfg.val);
  document.getElementById('recurring-edit-day').value=cfg.diaVenc||'';
  document.getElementById('recurring-edit-status').value=cfg.status==='Débito auto'?'Débito auto':'Falta Pagar';
  document.getElementById('recurring-edit-icon-preview').innerHTML=iconContent(selectedRecurringIcon);
  updateRecurringSaveLabel();
}
function selectRecurringMonth(month){
  if(editingRecurringScope==='only'){
    if(editingRecurringMonths.has(month)){if(editingRecurringMonths.size>1)editingRecurringMonths.delete(month);}
    else editingRecurringMonths.add(month);
    editingRecurringMonth=[...editingRecurringMonths].sort()[0];
  }else{
    editingRecurringMonths=new Set([month]);editingRecurringMonth=month;loadRecurringMonthForm();
  }
  renderRecurringTimeline();updateRecurringSaveLabel();
}
function setRecurringEditScope(scope,btn){
  editingRecurringScope=scope;
  if(scope==='from'){
    const first=[...editingRecurringMonths].sort()[0]||editingRecurringMonth;
    editingRecurringMonth=first;editingRecurringMonths=new Set([first]);loadRecurringMonthForm();
  }
  setToggle('recurring-scope-toggle','recurring-edit-scope',btn);renderRecurringTimeline();updateRecurringSaveLabel();
}
function updateRecurringSaveLabel(){
  if(!editingRecurringMonth)return;
  const btn=document.getElementById('recurring-save-btn');
  const label=mesLabel(editingRecurringMonth);
  const count=editingRecurringMonths.size;
  if(btn)btn.textContent=editingRecurringScope==='only'?(count===1?`Salvar em ${label}`:`Salvar em ${count} meses`):`Salvar a partir de ${label}`;
  updateRecurringChangeSummary();
}
function updateRecurringChangeSummary(){
  const el=document.getElementById('recurring-change-summary');if(!el||!editingRecurringMonth)return;
  const months=[...editingRecurringMonths].sort(),count=months.length,val=readMoneyField('recurring-edit-value');
  const day=document.getElementById('recurring-edit-day').value,status=document.getElementById('recurring-edit-status').value;
  const monthNames=months.map(m=>mesLabel(m).replace(' de ','/')).join(' · ');
  const selected=editingRecurringScope==='only';
  const title=selected?(count===1?'Alteração em 1 mês':`Alteração em ${count} meses`):'Alteração permanente';
  const period=selected?monthNames:`A partir de ${mesLabel(editingRecurringMonth)}`;
  const total=val==null?'A definir':selected?fmt(val*count):fmt(val);
  el.innerHTML=`<div class="recurring-impact-top"><span class="recurring-impact-icon">${uiIcon('calendar',15)}</span><div><strong>${title}</strong><span>${period}</span></div></div><div class="recurring-impact-values"><div><small>${selected?'POR MÊS':'NOVO VALOR MENSAL'}</small><b>${val==null?'Variável':fmt(val)}</b></div>${selected?`<div><small>TOTAL PREVISTO</small><b>${total}</b></div>`:''}</div><div class="recurring-impact-foot">${day?`Vencimento dia ${day}`:'Sem vencimento'} <span>•</span> ${status==='Débito auto'?'Débito automático':'Falta pagar'}</div>`;
}
function updateNewRecurringSummary(){
  const el=document.getElementById('new-recurring-summary');if(!el)return;
  const recurring=document.getElementById('in-recorr')?.value==='recorrente';
  el.style.display=recurring?'block':'none';if(!recurring)return;
  const name=document.getElementById('in-desc').value.trim()||'Nova conta recorrente';
  const month=document.getElementById('in-mes-ini').value,val=readMoneyField('in-valor');
  const day=document.getElementById('in-dia-venc').value,status=document.getElementById('in-status').value;
  const cat=document.getElementById('in-cat').value,pag=document.getElementById('in-pag').value;
  el.innerHTML=`<div class="recurring-impact-top"><span class="recurring-impact-icon">${uiIcon('repeat',15)}</span><div><strong>${name}</strong><span>${month?`Começa em ${mesLabel(month)}`:'Escolha o mês de início'}</span></div></div><div class="recurring-impact-values"><div><small>VALOR MENSAL</small><b>${val==null?'Variável':fmt(val)}</b></div><div><small>PRÓXIMOS 3 MESES</small><b>${val==null?'A definir':fmt(val*3)}</b></div></div><div class="recurring-impact-foot">${cat||'Sem categoria'} <span>•</span> ${pag||'Sem pagamento'} <span>•</span> ${day?`Vence dia ${day}`:'Sem vencimento'} <span>•</span> ${status==='Débito auto'?'Débito automático':'Falta pagar'}</div>`;
}
function monthKeyOffset(month,offset){const[y,m]=month.split('-').map(Number),d=new Date(y,m-1+offset,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function splitInstallmentValues(total,count){
  if(total==null)return Array(count).fill(null);
  const cents=Math.round(total*100),base=Math.floor(cents/count),remainder=cents-(base*count);
  return Array.from({length:count},(_,i)=>(base+(i<remainder?1:0))/100);
}
function updateNewInstallmentSummary(){
  const el=document.getElementById('new-installment-summary');if(!el)return;
  const active=document.getElementById('in-recorr')?.value==='parcelada';el.style.display=active?'block':'none';if(!active)return;
  const name=document.getElementById('in-desc').value.trim()||'Nova compra parcelada';
  const start=document.getElementById('in-parcela-mes').value,count=Math.max(2,Math.min(60,Number(document.getElementById('in-parcelas-total').value)||2));
  const total=readMoneyField('in-valor'),values=splitInstallmentValues(total,count),monthly=values[0],end=start?monthKeyOffset(start,count-1):null;
  el.innerHTML=`<div class="recurring-impact-top"><span class="recurring-impact-icon">${uiIcon('card',15)}</span><div><strong>${name}</strong><span>${start?`${count} parcelas · ${mesLabel(start)} até ${mesLabel(end)}`:'Escolha o primeiro mês'}</span></div></div><div class="recurring-impact-values"><div><small>VALOR DA PARCELA</small><b>${monthly==null?'A definir':fmt(monthly)}</b></div><div><small>VALOR TOTAL</small><b>${total==null?'A definir':fmt(total)}</b></div></div><div class="recurring-impact-foot">Compromisso por ${count} meses${end?` <span>•</span> termina em ${mesLabel(end)}`:''}</div>`;
}
function openEditRecurringAccount(id){
  const r=(DATA.recorrentes||[]).find(x=>x.id===id);if(!r)return;
  editingRecurringId=id;editingRecurringScope='from';
  const cat=document.getElementById('recurring-edit-cat'),pag=document.getElementById('recurring-edit-pag');
  if(!cat.options.length)cat.innerHTML=document.getElementById('in-cat').innerHTML;
  if(!pag.options.length)pag.innerHTML=document.getElementById('in-pag').innerHTML;
  const cm=currentMonthKey(),currentEntry=recurringMonthEntry(id,cm);
  editingRecurringMonth=currentEntry?.status==='Pago'?recurringTimelineMonths().find(m=>m>cm):cm;
  editingRecurringMonths=new Set([editingRecurringMonth]);
  document.getElementById('recurring-edit-scope').value='from';
  document.querySelectorAll('#recurring-scope-toggle .toggle-opt').forEach(btn=>btn.classList.toggle('active',btn.dataset.val==='from'));
  loadRecurringMonthForm();renderRecurringTimeline();
  document.getElementById('edit-recurring-modal').classList.add('open');
}
function closeEditRecurringAccount(){document.getElementById('edit-recurring-modal').classList.remove('open');editingRecurringId=null;selectedRecurringIcon=null;editingRecurringMonth=null;editingRecurringMonths=new Set();}
function saveRecurringAccount(){
  const r=(DATA.recorrentes||[]).find(x=>x.id===editingRecurringId);if(!r)return;
  const name=document.getElementById('recurring-edit-name').value.trim();if(!name){fieldError('recurring-edit-name','Nome obrigatório');return;}
  const val=readMoneyField('recurring-edit-value'),dayRaw=document.getElementById('recurring-edit-day').value,day=dayRaw?Math.max(1,Math.min(31,Number(dayRaw))):null;
  const data={nome:name,cat:document.getElementById('recurring-edit-cat').value,pag:document.getElementById('recurring-edit-pag').value,val,diaVenc:day,status:document.getElementById('recurring-edit-status').value,icon:selectedRecurringIcon||null};
  data.tipo=guessTipo(data.cat);
  if(editingRecurringScope==='only'){
    [...editingRecurringMonths].sort().forEach(month=>{
      let entry=recurringMonthEntry(r.id,month);
      if(!entry){entry={id:Date.now()+Math.random(),recorrenteId:r.id,origem:'recorrente',mes:month,pagoEm:null};DATA.despesas.push(entry);}
      if(entry.status!=='Pago')Object.assign(entry,data,{venc:recurringDueDate(month,day)});
    });
  }else{
    r.alteracoes=(r.alteracoes||[]).filter(a=>a.from<editingRecurringMonth);
    if(editingRecurringMonth===currentMonthKey())Object.assign(r,data);
    else r.alteracoes.push({from:editingRecurringMonth,data});
    DATA.despesas.filter(d=>d.recorrenteId===r.id&&d.mes>=editingRecurringMonth&&d.status!=='Pago').forEach(d=>Object.assign(d,data,{venc:recurringDueDate(d.mes,day)}));
  }
  saveData();closeEditRecurringAccount();refreshRecurringAdmin();showToast('Conta recorrente atualizada!');
}

function toggleMesRange(){
  const v=document.getElementById('in-recorr').value;
  document.getElementById('mes-unico-wrap').style.display=v==='unico'?'flex':'none';
  document.getElementById('mes-range-wrap').style.display=v==='recorrente'?'block':'none';
  document.getElementById('parcela-range-wrap').style.display=v==='parcelada'?'block':'none';
  if(v==='recorrente'||v==='parcelada'){
    document.getElementById('in-status').value='Falta Pagar';
    document.querySelectorAll('#status-toggle .toggle-opt').forEach(btn=>btn.classList.toggle('active',btn.dataset.val==='Falta Pagar'));
  }
  document.getElementById('expense-value-label').textContent=v==='parcelada'?'Valor total':'Valor';
  document.getElementById('expense-value-hint').textContent=v==='parcelada'?'(dividido automaticamente)':'(opcional — pode preencher depois)';
  document.getElementById('add-expense-submit').textContent=v==='parcelada'?'+ Adicionar parcelamento':'+ Adicionar despesa';
  updateNewRecurringSummary();
  updateNewInstallmentSummary();
}
function toggleRecMesRange(){const v=document.getElementById('in-rec-recorr').value;document.getElementById('rec-mes-unico-wrap').style.display=v==='unico'?'flex':'none';document.getElementById('rec-mes-range-wrap').style.display=v==='recorrente'?'block':'none';}
function monthsBetween(ini,fim){const meses=[];let[y,m]=ini.split('-').map(Number);const[yf,mf]=fim.split('-').map(Number);while(y<yf||(y===yf&&m<=mf)){meses.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++;}}return meses;}
function normalizeEntryName(name){return(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function duplicateMonthsFor(collection,name,months){const normalized=normalizeEntryName(name);return months.filter(month=>collection.some(item=>item.mes===month&&normalizeEntryName(item.nome)===normalized));}
function warnPossibleDuplicate(kind,name,months,proceed){
  const monthText=months.length===1?mesLabel(months[0]):`${months.length} meses selecionados`;
  showConfirm(`Já existe ${kind} “${name}” em ${monthText}.`,proceed,{label:'Adicionar mesmo assim',sub:'Pode ser um lançamento duplicado. Continue somente se forem compromissos diferentes.',tone:'neutral',icon:'warning'});
}

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
  hint.innerHTML = uiIcon('warning',12) + ' ' + msg;
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

function addEntry(forceDuplicate=false){
  const desc=document.getElementById('in-desc').value.trim();
  const cat=document.getElementById('in-cat').value;
  const pag=document.getElementById('in-pag').value;
  const val=readMoneyField('in-valor');
  const valRaw=val===null?'':String(val); // para compatibilidade com validação abaixo
  const diaVencRaw=document.getElementById('in-dia-venc').value;
  const diaVenc=diaVencRaw?parseInt(diaVencRaw):null;
  const status=document.getElementById('in-status').value;
  const recorr=document.getElementById('in-recorr').value;
  clearFieldErrors(['in-desc','in-valor','in-mes','in-mes-ini','in-parcela-mes','in-parcelas-total']);
  let hasError = false;
  if(!desc){ fieldError('in-desc','Nome obrigatório'); hasError=true; }
  if(val !== null && val < 0){ fieldError('in-valor','Digite um valor válido'); hasError=true; }
  let meses=[];
  let installmentCount=0;
  if(recorr==='unico'){
    const mes=document.getElementById('in-mes').value;
    if(!mes){ fieldError('in-mes','Selecione o mês'); hasError=true; }
    else meses=[mes];
  } else if(recorr==='recorrente') {
    const ini=document.getElementById('in-mes-ini').value;
    if(!ini){ fieldError('in-mes-ini','Selecione o mês inicial'); hasError=true; }
    if(!hasError) meses=[ini];
  } else {
    const ini=document.getElementById('in-parcela-mes').value;
    installmentCount=Number(document.getElementById('in-parcelas-total').value);
    if(!ini){fieldError('in-parcela-mes','Selecione o primeiro mês');hasError=true;}
    if(!Number.isInteger(installmentCount)||installmentCount<2||installmentCount>60){fieldError('in-parcelas-total','Use entre 2 e 60 parcelas');hasError=true;}
    if(val==null||val<=0){fieldError('in-valor','Informe o valor total da compra');hasError=true;}
    if(!hasError)meses=Array.from({length:installmentCount},(_,i)=>monthKeyOffset(ini,i));
  }
  if(hasError) return;
  if(recorr==='recorrente'){
    const existingTemplate=(DATA.recorrentes||[]).find(r=>normalizeEntryName(r.nome)===normalizeEntryName(desc));
    if(existingTemplate){showConfirm(`Já existe uma conta recorrente chamada “${desc}”.`,()=>{closeAddDesp();openEditRecurringAccount(existingTemplate.id);},{label:'Editar existente',sub:'Abra o cadastro atual para evitar duas cobranças recorrentes iguais.',tone:'neutral',icon:'edit'});return;}
  }else if(!forceDuplicate){
    const duplicateMonths=duplicateMonthsFor(DATA.despesas,desc,meses);
    if(duplicateMonths.length){warnPossibleDuplicate('uma despesa',desc,duplicateMonths,()=>addEntry(true));return;}
  }
  let recurringTemplate=null;
  if(recorr==='recorrente'){
    if(!Array.isArray(DATA.recorrentes))initializeRecurringAccounts(false);
    recurringTemplate=(DATA.recorrentes||[]).find(r=>r.nome.toLowerCase()===desc.toLowerCase());
    const templateData={nome:desc,cat,pag,val,diaVenc,status:status==='Débito auto'?'Débito auto':'Falta Pagar',tipo:document.getElementById('in-tipo').value||guessTipo(cat),icon:selectedIcon||null,ativo:true,inicio:meses[0]};
    if(recurringTemplate)Object.assign(recurringTemplate,templateData);
    else{recurringTemplate={id:`rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,cadastroManual:true,criadoEm:Date.now(),...templateData};DATA.recorrentes.push(recurringTemplate);}
  }
  const installmentId=recorr==='parcelada'?`parc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`:null;
  const installmentValues=installmentId?splitInstallmentValues(val,installmentCount):[];
  meses.forEach((mes,index)=>{
    let venc=null;
    if(diaVenc){const[y,mo]=mes.split('-');const maxDay=new Date(+y,+mo,0).getDate();const dd=String(Math.min(diaVenc,maxDay)).padStart(2,'0');venc=`${mes}-${dd}`;}
    const existing=recurringTemplate&&DATA.despesas.find(d=>d.mes===mes&&(d.recorrenteId===recurringTemplate.id||d.nome===desc));
    const entryStatus=installmentId&&index>0?(status==='Débito auto'?'Débito auto':'Falta Pagar'):status;
    if(!existing)DATA.despesas.push({id:Date.now()+Math.random(),recorrenteId:recurringTemplate?.id||null,parcelamentoId:installmentId,parcelaAtual:installmentId?index+1:null,parcelasTotal:installmentId?installmentCount:null,valorTotal:installmentId?val:null,origem:recurringTemplate?'recorrente':installmentId?'parcelamento':'manual',nome:desc,cat,pag,mes,val:installmentId?installmentValues[index]:val,status:entryStatus,venc,diaVenc,tipo:document.getElementById('in-tipo').value||guessTipo(cat),icon:selectedIcon||null,pagoEm: entryStatus==='Pago' ? (venc || new Date().toISOString().slice(0,10)) : null});
  });
  saveData();
  document.getElementById('in-desc').value='';document.getElementById('in-valor').value='';document.getElementById('in-dia-venc').value='';
  setMoneyField('in-valor','');
  selectedIcon=null;document.getElementById('icon-picker-preview').innerHTML=DEFAULT_ICON;
  closeAddDesp();
  const now=new Date(),cm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  despSelectedMonth=allMonths().includes(cm)?cm:meses[meses.length-1];
  showPage('despesas');
  showToast(recurringTemplate?'Conta recorrente cadastrada!':installmentId?`Compra parcelada em ${installmentCount} vezes!`:'Despesa adicionada!');if(typeof renderEmptyState==='function')renderEmptyState();
}

function addReceita(forceDuplicate=false){
  const desc=document.getElementById('in-rec-desc').value.trim();
  const val=readMoneyField('in-rec-valor');
  const valRaw=val===null?'':String(val);
  const recorr=document.getElementById('in-rec-recorr').value;
  clearFieldErrors(['in-rec-desc','in-rec-valor','in-rec-mes','in-rec-mes-ini','in-rec-mes-fim']);
  let hasErrorR = false;
  if(!desc){ fieldError('in-rec-desc','Nome obrigatório'); hasErrorR=true; }
  if(val !== null && val < 0){ fieldError('in-rec-valor','Digite um valor válido'); hasErrorR=true; }
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
  if(!forceDuplicate){
    const duplicateMonths=duplicateMonthsFor(DATA.receitas,desc,meses);
    if(duplicateMonths.length){warnPossibleDuplicate('uma receita',desc,duplicateMonths,()=>addReceita(true));return;}
  }
  meses.forEach(mes=>{DATA.receitas.push({id:Date.now()+Math.random(),nome:desc,cat:document.getElementById('in-rec-cat').value,mes,val,status:document.getElementById('in-rec-status').value});});
  saveData();
  document.getElementById('in-rec-desc').value='';document.getElementById('in-rec-valor').value='';
  closeAddRec();showPage('receitas');
  showToast(meses.length>1?`${meses.length} receitas adicionadas!`:'Receita adicionada!');if(typeof renderEmptyState==='function')renderEmptyState();
}

function deleteDespEntry(id){
  id=Number(id);
  const d=DATA.despesas.find(x=>x.id===id);
  if(!d)return;
  showConfirm(`Mover "${d.nome}" para a lixeira?`, ()=>{
    moveToTrash('despesa',d);
    const recurring=(DATA.recorrentes||[]).find(r=>r.id===d.recorrenteId);
    if(recurring&&d.mes)recurring.pularMeses=[...new Set([...(recurring.pularMeses||[]),d.mes])];
    DATA.despesas=DATA.despesas.filter(x=>x.id!==id);
    saveData();renderDespTable();renderCurMonth();showToast('Movido para a lixeira!');
  },{label:'Mover',sub:'Você poderá restaurar este lançamento depois.',tone:'neutral'});
}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
