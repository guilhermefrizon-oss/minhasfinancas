/* Formulários e período compartilhado entre Geral, Despesas e Receitas. */
function financeCurrentMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function financeMonths(){
  const known=[...new Set([...allMonths(),financeCurrentMonth(),getCurMonth()])].sort(),months=[];
  let month=known[0];while(month<=known.at(-1)){months.push(month);month=monthKeyOffset(month,1);}
  return months;
}
function setFinanceMonth(month,render=true){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||''))return false;
  curMonthSelected=month;despSelectedMonth=month;recSelectedMonth=month;
  updateFinanceMonthControls();
  if(render)renderFinanceMonth();
  return true;
}
function updateFinanceMonthControls(){
  const month=getCurMonth(),[year,number]=month.split('-'),label=new Date(Number(year),Number(number)-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}),months=financeMonths(),idx=months.indexOf(month);
  ['cur-month-name','desp-month-btn-label','rec-month-btn-label'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=label.charAt(0).toUpperCase()+label.slice(1);});
  document.querySelectorAll('[data-finance-step]').forEach(btn=>{btn.disabled=Number(btn.dataset.financeStep)<0?idx<=0:idx>=months.length-1;});
  document.querySelectorAll('.finance-month-current').forEach(btn=>{btn.hidden=month===financeCurrentMonth();});
}
function renderFinanceMonth(){
  const page=document.querySelector('.page.active')?.id;
  if(page==='page-despesas')renderDespTable();
  else if(page==='page-receitas'){renderRecTable();renderRecCharts();}
  else if(page==='page-overview')renderOverview();
}
function stepFinanceMonth(delta){const months=financeMonths(),idx=months.indexOf(getCurMonth())+delta;if(idx>=0&&idx<months.length)setFinanceMonth(months[idx]);}
function goToCurrentFinanceMonth(){setFinanceMonth(financeCurrentMonth());}
let financePickerYear=null;
function openFinanceMonthPicker(){
  financePickerYear=Number(getCurMonth().slice(0,4));renderFinanceMonthPicker();
  document.getElementById('finance-month-modal').classList.add('open');setupFinanceForm('finance-month-modal');
}
function closeFinanceMonthPicker(){closeFinanceForm('finance-month-modal');}
function shiftFinanceYear(delta){const years=[...new Set(financeMonths().map(m=>Number(m.slice(0,4))))],idx=years.indexOf(financePickerYear)+delta;if(idx<0||idx>=years.length)return;financePickerYear=years[idx];renderFinanceMonthPicker();}
function renderFinanceMonthPicker(){
  const months=financeMonths(),years=[...new Set(months.map(m=>Number(m.slice(0,4))))],idx=years.indexOf(financePickerYear);
  document.getElementById('finance-picker-year').textContent=financePickerYear;
  document.getElementById('finance-year-prev').disabled=idx<=0;
  document.getElementById('finance-year-next').disabled=idx>=years.length-1;
  document.getElementById('finance-picker-months').innerHTML=Array.from({length:12},(_,i)=>{
    const month=`${financePickerYear}-${String(i+1).padStart(2,'0')}`,selected=month===getCurMonth(),current=month===financeCurrentMonth();
    const name=new Date(financePickerYear,i,1).toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
    return `<button type="button" ${months.includes(month)?'':'disabled'} class="${selected?'is-selected':''}" aria-pressed="${selected}" aria-label="${mesLabel(month)}${current?', mês atual':''}" onclick="selectFinanceMonth('${month}')"><strong>${name}</strong>${current?'<small>Atual</small>':''}</button>`;
  }).join('');
}
function selectFinanceMonth(month){if(setFinanceMonth(month))closeFinanceMonthPicker();}
function setDespMonth(month){setFinanceMonth(month);}
function setRecMonth(month){setFinanceMonth(month);}

function expenseEditScopeText(){
  const d=DATA.despesas.find(x=>x.id===editingId);if(!d)return '';
  const date=document.getElementById('edit-venc').value||null;
  const forward=date!==originalVenc&&document.querySelector('input[name="venc-scope"]:checked')?.value==='forward';
  if(editingBulkName)return 'Altera todos os lançamentos já cadastrados com este nome.';
  if(!forward)return `Altera somente este lançamento de ${mesLabel(d.mes)}. Os outros meses permanecem iguais.`;
  const count=DATA.despesas.filter(x=>x.nome===d.nome&&x.mes>=d.mes).length;
  return `Nome, valor, status e tipo: somente este lançamento de ${mesLabel(d.mes)}. Vencimento: ${count} lançamento${count===1?'':'s'} já cadastrado${count===1?'':'s'}, deste mês em diante. Não altera o cadastro recorrente.`;
}
function revenueEditScopeText(){
  const r=DATA.receitas.find(x=>x.id===editingRecId);if(!r)return '';
  const month=document.getElementById('edit-rec-mes').value||r.mes;
  return month===r.mes?`Altera somente esta receita de ${mesLabel(r.mes)}. Os outros meses permanecem iguais.`:`Move somente esta receita de ${mesLabel(r.mes)} para ${mesLabel(month)}. Os outros lançamentos permanecem iguais.`;
}
function addExpenseScopeText(){
  const mode=document.getElementById('in-recorr').value;
  if(mode==='recorrente'){const m=document.getElementById('in-mes-ini').value;return m?`Cria uma conta mensal a partir de ${mesLabel(m)}, até você pausar ou encerrar.`:'Escolha o mês inicial da conta recorrente.';}
  if(mode==='parcelada'){
    const m=document.getElementById('in-parcela-mes').value,n=Math.max(2,Math.min(60,Number(document.getElementById('in-parcelas-total').value)||2));
    return m?`Cria ${n} parcelas, de ${mesLabel(m)} até ${mesLabel(monthKeyOffset(m,n-1))}.`:'Escolha o mês da primeira parcela.';
  }
  const m=document.getElementById('in-mes').value;return m?`Cria somente uma despesa em ${mesLabel(m)}.`:'Escolha o mês da despesa.';
}
function addRevenueScopeText(){
  const recurring=document.getElementById('in-rec-recorr').value==='recorrente';
  const start=document.getElementById(recurring?'in-rec-mes-ini':'in-rec-mes').value,end=document.getElementById('in-rec-mes-fim').value;
  if(!start)return 'Escolha o mês da receita.';
  if(!recurring)return `Cria somente uma receita em ${mesLabel(start)}.`;
  if(!end||end<start)return 'Escolha um mês final igual ou posterior ao inicial.';
  const count=(Number(end.slice(0,4))-Number(start.slice(0,4)))*12+Number(end.slice(5))-Number(start.slice(5))+1;
  return `Cria ${count} receita${count===1?'':'s'}, de ${mesLabel(start)} até ${mesLabel(end)}. Não continua após esse período.`;
}
function updateFinanceScopeSummaries(){
  const summaries={'edit-modal':['expense-edit-scope-summary',expenseEditScopeText],'edit-rec-modal':['revenue-edit-scope-summary',revenueEditScopeText],'add-desp-modal':['expense-add-scope-summary',addExpenseScopeText],'add-rec-modal':['revenue-add-scope-summary',addRevenueScopeText]};
  Object.entries(summaries).forEach(([modal,[id,fn]])=>{if(!document.getElementById(modal)?.classList.contains('open'))return;const el=document.getElementById(id),text=fn();if(el.textContent!==text)el.textContent=text;});
}
function syncFinanceModalScroll(){document.body.classList.toggle('finance-modal-open',!!document.querySelector('.finance-modal.open,.recurring-modal.open'));}
const financeFormReturnFocus=new Map();
function setupFinanceForm(id){
  const modal=document.getElementById(id);financeFormReturnFocus.set(id,document.activeElement);
  const body=modal.querySelector('.finance-modal-body');if(body)body.scrollTop=0;
  syncFinanceModalScroll();updateFinanceScopeSummaries();
  modal.querySelector('.finance-modal-close')?.focus({preventScroll:true});
}
function closeFinanceForm(id){
  document.getElementById(id).classList.remove('open');syncFinanceModalScroll();
  const previous=financeFormReturnFocus.get(id);if(previous?.isConnected)previous.focus({preventScroll:true});financeFormReturnFocus.delete(id);
}
function topOpenFinanceModal(){return [...document.querySelectorAll('.modal-overlay.open')].sort((a,b)=>Number(getComputedStyle(b).zIndex)-Number(getComputedStyle(a).zIndex))[0];}
document.addEventListener('input',event=>{if(event.target.closest('.finance-modal'))updateFinanceScopeSummaries();});
document.addEventListener('change',event=>{if(event.target.closest('.finance-modal'))updateFinanceScopeSummaries();});
document.addEventListener('click',event=>{if(event.target.closest('.finance-modal .toggle-opt'))updateFinanceScopeSummaries();});
document.addEventListener('keydown',event=>{
  const modal=topOpenFinanceModal();if(!modal?.classList.contains('finance-modal'))return;
  if(event.key==='Escape'){
    const close={'edit-modal':closeModal,'edit-rec-modal':closeRecModal,'add-desp-modal':closeAddDesp,'add-rec-modal':closeAddRec,'finance-month-modal':closeFinanceMonthPicker}[modal.id];
    if(close){event.preventDefault();close();}
  }else if(event.key==='Tab'){
    const fields=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled])')].filter(el=>el.getClientRects().length);
    const first=fields[0],last=fields.at(-1);if(!first)return;
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
