const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function app(){
 const fields={},storage=new Map(),counts={};
 function field(id){if(fields[id])return fields[id];const classes=new Set();let value='';return fields[id]={id,get value(){return value;},set value(v){value=String(v);},textContent:'',innerHTML:'',style:{},dataset:{},children:[{}],isConnected:true,checked:false,disabled:false,hidden:false,scrollTop:20,offsetWidth:0,options:[],focus(){ctx.document.activeElement=this;},addEventListener(){},setAttribute(){},scrollTo(){},querySelector(sel){return field(sel.includes('body')?id+'-body':id+'-close');},classList:{add:n=>classes.add(n),remove:n=>classes.delete(n),contains:n=>classes.has(n),toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n);}}};}
 const pages=['overview','despesas','receitas','notif'].map(id=>field('page-'+id));pages[0].classList.add('active');
 const nav=pages.map((_,i)=>field('nav-'+i));
 const ctx=vm.createContext({DATA:{despesas:[],receitas:[],recorrentes:[],recorrentesVersao:3},Date:class extends Date{constructor(...args){super(...(args.length?args:['2026-10-05T15:00:00Z']));}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{innerWidth:375,scrollTo(){}},navigator:{},selectedIcon:null,DEFAULT_ICON:'',uiIcon:()=>'',itemIcon:()=>'',iconContent:()=>'',guessIconKey:()=>null,requestAnimationFrame:f=>f(),setTimeout:f=>{},getComputedStyle:el=>({zIndex:el.style.zIndex||510}),document:{activeElement:null,body:field('body'),getElementById:field,addEventListener(){},querySelector(sel){if(sel.includes('venc-scope'))return field(sel.includes('value="only"')?'scope-only':'scope-checked');if(sel==='.page.active')return pages.find(p=>p.classList.contains('active'));if(sel.includes('modal.open'))return Object.values(fields).find(p=>p.classList.contains('open'));return null;},querySelectorAll(sel){if(sel==='.page')return pages;if(sel==='.nav-btn')return nav;if(sel==='[data-finance-step]')return [field('prev'),field('next')];return [];}}});
 field('prev').dataset.financeStep='-1';field('next').dataset.financeStep='1';
 for(const name of ['utils','overview','chart-details','despesas','receitas','lancamentos','finance-ui','app'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8'),ctx);
 const renderLists={desp:ctx.renderDespTable,rec:ctx.renderRecTable};
 for(const fn of ['renderDespTable','renderRecTable','renderRecCharts','renderOverview','renderCurMonth','renderUpcomingTransactions','renderDonutChart','renderManageList'])ctx[fn]=()=>{counts[fn]=(counts[fn]||0)+1;};
 ctx.saveData=()=>{counts.saves=(counts.saves||0)+1;};ctx.showToast=()=>{};ctx.clearFieldErrors=()=>{};ctx.selectedIconEdit=null;
 return {ctx,fields,field,counts,renderLists};
}
test('mês escolhido permanece ao trocar entre Geral, Despesas e Receitas',()=>{
 const a=app();a.ctx.DATA.despesas=[{id:1,nome:'Conta',mes:'2026-11',val:20}];
 a.ctx.setFinanceMonth('2026-11',false);
 for(const page of ['despesas','receitas','overview']){a.ctx.showPage(page);assert.deepEqual(Array.from(vm.runInContext('[getCurMonth(),despSelectedMonth,recSelectedMonth]',a.ctx)),['2026-11','2026-11','2026-11']);}
 assert.equal(a.fields['cur-month-name'].textContent,a.fields['desp-month-btn-label'].textContent);
 assert.equal(a.fields['cur-month-name'].textContent,a.fields['rec-month-btn-label'].textContent);
 assert.equal(a.ctx.setFinanceMonth('2026-13'),false);
});
test('setas respeitam limites e retorno ao mês atual sincroniza as telas',()=>{
 const a=app();a.ctx.DATA.despesas=[{id:1,mes:'2026-09'},{id:2,mes:'2026-12'}];
 a.ctx.setFinanceMonth('2026-09',false);assert.equal(a.fields.prev.disabled,true);a.ctx.stepFinanceMonth(-1);assert.equal(a.ctx.getCurMonth(),'2026-09');
 a.ctx.stepFinanceMonth(1);assert.equal(a.ctx.getCurMonth(),'2026-10');
 a.ctx.setFinanceMonth('2026-12',false);assert.equal(a.fields.next.disabled,true);a.ctx.stepFinanceMonth(1);assert.equal(a.ctx.getCurMonth(),'2026-12');
 a.ctx.goToCurrentFinanceMonth();assert.equal(a.ctx.getCurMonth(),'2026-10');
});
test('seletor compartilhado abre no ano escolhido e não modifica cobranças',()=>{
 const a=app();a.ctx.DATA.despesas=[{id:1,nome:'Conta',mes:'2027-02',val:20}];
 a.ctx.setFinanceMonth('2027-02',false);const before=JSON.stringify(a.ctx.DATA);
 a.ctx.openFinanceMonthPicker();assert.equal(a.fields['finance-picker-year'].textContent,2027);assert.match(a.fields['finance-picker-months'].innerHTML,/aria-pressed="true"/);
 a.ctx.closeFinanceMonthPicker();assert.equal(a.ctx.getCurMonth(),'2027-02');assert.equal(JSON.stringify(a.ctx.DATA),before);
});
test('resumo de vencimento corresponde aos registros alterados, mesmo renomeando',()=>{
 const a=app();a.ctx.DATA.despesas=[{id:1,nome:'Internet',mes:'2026-10',val:100,status:'Falta Pagar',venc:'2026-10-05'},{id:2,nome:'Internet',mes:'2026-11',val:100,status:'Falta Pagar',venc:'2026-11-05'},{id:3,nome:'Internet',mes:'2026-09',val:100,status:'Pago',venc:'2026-09-05'},{id:4,nome:'Outra',mes:'2026-11',val:10,status:'Falta Pagar'}];
 a.ctx.openModal(1);a.fields['edit-venc'].value='2026-10-10';a.field('scope-checked').value='forward';a.fields['edit-nome'].value='Internet nova';
 assert.match(a.ctx.expenseEditScopeText(),/Vencimento: 2 lançamentos/);assert.match(a.ctx.expenseEditScopeText(),/Nome, valor, status e tipo: somente/);
 a.ctx.saveEdit();assert.equal(a.ctx.DATA.despesas[1].venc,'2026-11-10');assert.equal(a.ctx.DATA.despesas[1].nome,'Internet');assert.equal(a.ctx.DATA.despesas[2].venc,'2026-09-05');assert.equal(a.ctx.DATA.despesas[2].status,'Pago');
});
test('resumo explica alteração isolada de despesa e mudança de mês de receita',()=>{
 const a=app();a.ctx.DATA.despesas=[{id:1,nome:'Conta',mes:'2026-10',val:10,venc:null}];a.ctx.openModal(1);
 assert.match(a.ctx.expenseEditScopeText(),/somente este lançamento de out/);
 a.ctx.DATA.receitas=[{id:2,nome:'Freela',mes:'2026-10',val:100,status:'Aguardando'}];a.ctx.openRecModal(2);
 assert.match(a.ctx.revenueEditScopeText(),/somente esta receita de out/);a.fields['edit-rec-mes'].value='2026-11';assert.match(a.ctx.revenueEditScopeText(),/Move somente esta receita/);
 a.ctx.saveRecEdit();assert.equal(a.ctx.getCurMonth(),'2026-11');assert.equal(a.ctx.DATA.receitas[0].mes,'2026-11');
});
test('resumos de criação distinguem mês único, recorrente, parcelas e intervalo de receitas',()=>{
 const a=app();a.ctx.setFinanceMonth('2026-11',false);a.ctx.openAddForm('despesa');assert.equal(a.fields['in-mes'].value,'2026-11');assert.match(a.ctx.addExpenseScopeText(),/somente uma despesa/);
 a.fields['in-recorr'].value='recorrente';assert.match(a.ctx.addExpenseScopeText(),/até você pausar ou encerrar/);
 a.fields['in-recorr'].value='parcelada';a.fields['in-parcelas-total'].value='3';assert.match(a.ctx.addExpenseScopeText(),/3 parcelas, de nov.*jan/);
 a.ctx.openAddForm('receita');assert.equal(a.fields['in-rec-mes'].value,'2026-11');a.fields['in-rec-recorr'].value='recorrente';a.fields['in-rec-mes-fim'].value='2027-01';assert.match(a.ctx.addRevenueScopeText(),/3 receitas/);assert.match(a.ctx.addRevenueScopeText(),/Não continua após/);
});
test('criação em mês escolhido abre o lançamento salvo nesse mesmo período',()=>{
 const a=app();a.ctx.setFinanceMonth('2026-11',false);a.ctx.openAddForm('despesa');
 Object.entries({'in-desc':'Teste','in-cat':'Moradia','in-pag':'Cartão','in-valor':'R$ 10,00','in-dia-venc':'5'}).forEach(([id,value])=>a.field(id).value=value);
 a.ctx.addEntry();assert.equal(a.ctx.DATA.despesas[0].mes,'2026-11');assert.equal(a.ctx.getCurMonth(),'2026-11');
 assert.equal(vm.runInContext('despSelectedMonth',a.ctx),'2026-11');assert.equal(a.fields['add-desp-modal'].classList.contains('open'),false);
});
test('fechar formulário mantém lançamentos e libera rolagem',()=>{
 const a=app();a.ctx.DATA.despesas=[{id:1,nome:'Conta',mes:'2026-10',val:10,status:'Pago'}];const before=JSON.stringify(a.ctx.DATA);
 a.ctx.openModal(1);assert.equal(a.fields.body.classList.contains('finance-modal-open'),true);a.fields['edit-valor'].value='99';a.ctx.closeModal();
 assert.equal(a.fields.body.classList.contains('finance-modal-open'),false);assert.equal(JSON.stringify(a.ctx.DATA),before);
});
test('navegação visível tem somente duas setas e não exibe atalho solto',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.equal((html.match(/class="finance-month-current"/g)||[]).length,0);
 assert.equal((html.match(/id="cur-month-pulse"/g)||[]).length,0);
 assert.equal((html.match(/class="cur-month-details-btn"/g)||[]).length,0);
 const navs=[...html.matchAll(/<div class="finance-month-nav"[\s\S]*?<\/div>/g)];
 assert.equal(navs.length,3);
 navs.forEach(nav=>assert.equal((nav[0].match(/data-finance-step=/g)||[]).length,2));
});
function listApp(){
 const a=app();a.ctx.catLabel=c=>c||'';a.ctx.catColor=()=> '#777777';a.ctx.updateNotifBadge=()=>{};a.ctx.syncDespSortIndicator=()=>{};a.ctx.syncRecSortIndicator=()=>{};
 a.ctx.renderDespTable=a.renderLists.desp;a.ctx.renderRecTable=a.renderLists.rec;
 a.ctx.setFinanceMonth('2026-10',false);
 a.ctx.DATA.despesas=[{id:1,nome:'Internet',mes:'2026-10',cat:'Gastos Fixos',val:100,status:'Falta Pagar'},{id:2,nome:'Mercado',mes:'2026-10',cat:'Alimentação',val:50,status:'Pago'}];
 a.ctx.DATA.receitas=[{id:3,nome:'Salário',mes:'2026-10',cat:'Salário',val:1000,status:'Recebido'},{id:4,nome:'Freela',mes:'2026-10',cat:'Freela',val:300,status:'Aguardando'}];
 return a;
}
test('filtros combinados mostram contagem, vazio correto e remoção isolada em ambas as listas',()=>{
 for(const type of ['desp','rec']){
  const a=listApp(),isRec=type==='rec';
  const set=isRec?a.ctx.setRecFilter:a.ctx.setDespFilter;
  set('status',isRec?'Aguardando':'Falta Pagar');
  assert.match(a.field(type+'-filter-summary').innerHTML,/1 de 2/);
  a.field(type+'-search').value='inexistente';a.ctx.handleCompactSearch(type);
  assert.match(a.field(type+'-mobile-list').innerHTML,/Nenhum lançamento corresponde aos filtros/);
  assert.match(a.field(type+'-filter-summary').innerHTML,/0 de 2/);
  a.ctx.removeHistoryFilter(type,'search');
  assert.match(a.field(type+'-filter-summary').innerHTML,/1 de 2/);
  assert.match(a.field(type+'-filter-summary').innerHTML,/Status:/);
  assert.equal(a.field(type+'-clear-filters').style.display,'inline-flex');
  (isRec?a.ctx.clearRecFilters:a.ctx.clearDespFilters)();
  assert.match(a.field(type+'-filter-summary').innerHTML,/2 de 2/);
  assert.equal(a.field(type+'-clear-filters').style.display,'none');
  assert.doesNotMatch(a.field('cards-'+type).innerHTML,/Resumo filtrado/);
 }
});
test('busca é escapada nas etiquetas e mês vazio não atribui ausência aos filtros',()=>{
 const a=listApp();a.field('desp-search').value='<img src=x onerror=alert(1)>';a.ctx.renderDespTable();
 const summary=a.field('desp-filter-summary').innerHTML;
 assert.doesNotMatch(summary,/<img/);assert.match(summary,/&lt;img/);
 a.ctx.setFinanceMonth('2026-11',false);a.ctx.renderDespTable();
 assert.match(a.field('desp-mobile-list').innerHTML,/Nenhuma despesa neste mês/);
 assert.doesNotMatch(a.field('desp-mobile-list').innerHTML,/corresponde aos filtros/);
});
test('ações explícitas quitam pendência uma vez e preservam status de lançamentos concluídos',()=>{
 const a=listApp();
 a.ctx.renderDespTable();a.ctx.renderRecTable();
 assert.match(a.field('desp-mobile-list').innerHTML,/markExpensePaid\(1\)/);
 assert.doesNotMatch(a.ctx.mobilePaymentControl('desp',2,true),/markExpensePaid|togglePago/);
 assert.doesNotMatch(a.ctx.mobilePaymentControl('rec',3,true),/markRevenueReceived|toggleRecStatus/);
 a.ctx.markExpensePaid(1);a.ctx.markRevenueReceived(4);
 assert.equal(a.ctx.DATA.despesas[0].status,'Pago');assert.equal(a.ctx.DATA.receitas[1].status,'Recebido');
 const saves=a.counts.saves;a.ctx.markExpensePaid(1);a.ctx.markRevenueReceived(4);
 assert.equal(a.counts.saves,saves);
 assert.match(a.ctx.mobilePaymentControl('rec',3,true),/openRecModal\(3\)/);
 assert.match(a.ctx.mobilePaymentControl('desp',2,true),/openModal\(2\)/);
 assert.doesNotMatch(a.field('desp-mobile-list').innerHTML,/entry-mobile-actions/);
 assert.doesNotMatch(a.field('rec-mobile-list').innerHTML,/entry-mobile-actions/);
 assert.match(a.field('desp-mobile-list').innerHTML,/mob-toggle-btn pago/);
 assert.match(a.field('desp-mobile-list').innerHTML,/mie-btn-del/);
});
test('lixeira exige confirmação e preserva o lançamento até confirmar',()=>{
 for(const type of ['desp','rec']){
  const a=listApp();let confirm;const archived=[];
  a.ctx.showConfirm=(text,callback)=>{confirm=callback;assert.match(text,/lixeira/);};
  a.ctx.moveToTrash=(kind,entry)=>archived.push({kind,entry:{...entry}});
  const isRec=type==='rec',id=isRec?3:2,key=isRec?'receitas':'despesas';
  (isRec?a.ctx.deleteRecEntry:a.ctx.deleteDespEntry)(id);
  assert.ok(a.ctx.DATA[key].some(x=>x.id===id));assert.equal(archived.length,0);
  confirm();assert.equal(a.ctx.DATA[key].some(x=>x.id===id),false);
  assert.equal(archived.length,1);assert.equal(archived[0].entry.status,isRec?'Recebido':'Pago');
 }
});
