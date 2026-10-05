const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function app() {
  const fields = {};
  const storage = new Map();
  function field(id){
    if(fields[id])return fields[id];
    const classes=new Set(),attributes={};
    return fields[id]={value:'',options:[],hidden:false,disabled:false,innerHTML:'',textContent:'',scrollTop:0,clientWidth:250,
      addEventListener(){},setAttribute:(name,value)=>attributes[name]=value,getAttribute:name=>attributes[name],
      focus(){},querySelector:()=>field('modal-body'),scrollTo(){},scrollBy(){},
      classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),toggle(name,force){const on=force===undefined?!classes.has(name):force;on?classes.add(name):classes.delete(name);return on;}}};
  }
  const ctx = vm.createContext({
    DATA: {despesas: [], receitas: [], recorrentes: [], recorrentesVersao: 2},
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ['2026-10-05T15:00:00Z'])); }
    },
    navigator: {}, uiIcon:()=>'',guessIconKey:()=>'',iconContent:()=>'',itemIcon:()=>'',catLabel:cat=>cat,requestAnimationFrame:fn=>fn(),
    document: {addEventListener(){},body:field('body'),getElementById:field,querySelector:()=>['edit-recurring-modal','manage-recorr-modal'].map(field).find(el=>el.classList.contains('open')),querySelectorAll:()=>[]},
    localStorage: {getItem: key => storage.get(key) || null,setItem:(key,value)=>storage.set(key,value)},
    saves: 0,
    saveData() { ctx.saves++; storage.set('data', JSON.stringify(ctx.DATA)); },
  });
  for (const name of ['utils','despesas','lancamentos','overview','settings']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8'),ctx);
  }
  vm.runInContext(`
    syncDespSortIndicator=()=>{throw new Error('render-stop')};
    closeAddDesp=()=>{}; showPage=()=>{}; showToast=()=>{};
    clearFieldErrors=()=>{}; selectedIcon=null; DEFAULT_ICON='';
    updateRecorrentesBadge=()=>{};
  `,ctx);
  return {ctx, fields, storage};
}
function visit(ctx, month, overview=false) {
  vm.runInContext(overview ? `curMonthSelected='${month}'` : `despSelectedMonth='${month}'`,ctx);
  if(overview) ctx.document.getElementById=()=>{throw new Error('render-stop')};
  assert.throws(()=>vm.runInContext(overview?'renderCurMonth()':'renderDespTable()',ctx),/render-stop/);
}
function createAccount(a) {
  const values = {'in-desc':'NuCel','in-cat':'Celular','in-pag':'Cartão','in-valor':'R$ 25,00','in-dia-venc':'5','in-status':'Pago','in-recorr':'recorrente','in-mes-ini':'2026-10','in-tipo':'fixa'};
  for(const [id,value] of Object.entries(values)) a.ctx.document.getElementById(id).value=value;
  vm.runInContext('addEntry()',a.ctx);
}

test('cadastro salvo reaparece em dezembro e janeiro sem duplicar nem repetir Pago',()=>{
  const a=app(); createAccount(a);
  assert.equal(a.ctx.DATA.recorrentes.length,1);
  a.ctx.DATA=JSON.parse(a.storage.get('data'));
  visit(a.ctx,'2026-12'); visit(a.ctx,'2027-01'); visit(a.ctx,'2026-12');
  assert.equal(a.ctx.DATA.despesas.length,3);
  assert.equal(a.ctx.DATA.despesas[0].status,'Pago');
  assert.equal(a.ctx.DATA.despesas[1].status,'Falta Pagar');
  assert.equal(a.ctx.DATA.despesas[2].venc,'2027-01-05');
  assert.equal(JSON.parse(a.storage.get('data')).despesas.length,3);
});
test('meses futuros disponíveis sem materializar cobranças nem avançar a janela por navegação',()=>{
  const a=app(); createAccount(a);
  const months=vm.runInContext('allMonths()',a.ctx);
  assert.ok(months.includes('2027-01'));
  assert.equal(months.at(-1),'2027-10');
  assert.equal(a.ctx.DATA.despesas.length,1);
  visit(a.ctx,'2027-10');
  assert.equal(vm.runInContext('allMonths()',a.ctx).at(-1),'2027-10');
});
test('resumo mensal também gera a cobrança com alteração permanente desde novembro',()=>{
  const a=app(); createAccount(a);
  a.ctx.DATA.recorrentes[0].alteracoes=[{from:'2026-11',data:{val:30,diaVenc:31}}];
  visit(a.ctx,'2027-02',true);
  const d=a.ctx.DATA.despesas.find(d=>d.mes==='2027-02');
  assert.equal(d.val,30); assert.equal(d.venc,'2027-02-28');
  assert.equal(a.ctx.DATA.despesas[0].val,25);
});
test('não gera antes do início, durante pausa ou em mês excluído',()=>{
  const a=app(); createAccount(a);
  visit(a.ctx,'2026-09');
  a.ctx.DATA.recorrentes[0].pularMeses=['2026-12'];
  visit(a.ctx,'2026-12');
  a.ctx.DATA.recorrentes[0].ativo=false;
  visit(a.ctx,'2027-01');
  assert.equal(a.ctx.DATA.despesas.length,1);
});
test('cobrança paga existente é preservada ao abrir o mês',()=>{
  const a=app(); createAccount(a); visit(a.ctx,'2026-12');
  const d=a.ctx.DATA.despesas.find(d=>d.mes==='2026-12');
  d.status='Pago'; d.val=19; d.pagoEm='2026-12-06';
  visit(a.ctx,'2026-12');
  assert.equal(d.val,19); assert.equal(d.pagoEm,'2026-12-06');
  assert.equal(a.ctx.DATA.despesas.length,2);
});

function legacySchedule(a, name='Voo Gol', end='2026-12') {
  const id='rec-v2-'+a.ctx.recurringIdForName(name).slice(4);
  a.ctx.DATA.recorrentes.push({id,nome:name,inicio:'2026-10',migradoAtivo:true,ativo:true,val:201.13,cat:'Lazer · Viagem',status:'Falta Pagar'});
  const months=['2026-10','2026-11','2026-12'].filter(m=>m<=end);
  months.forEach((mes,index)=>a.ctx.DATA.despesas.push({id:index+1,recorrenteId:id,nome:name,mes,val:201.13,status:index===0?'Pago':'Falta Pagar'}));
  return id;
}
test('intervalo antigo termina no último mês original e remove cobrança indevida de janeiro',()=>{
  const a=app(),id=legacySchedule(a);
  const original=JSON.stringify(a.ctx.DATA.despesas);
  a.ctx.DATA.despesas.push({id:99,recorrenteId:id,origem:'recorrente',nome:'Voo Gol',mes:'2027-01',val:201.13,status:'Falta Pagar'});
  visit(a.ctx,'2027-01');visit(a.ctx,'2027-02');
  assert.equal(JSON.stringify(a.ctx.DATA.despesas),original);
  assert.equal(a.ctx.DATA.recorrentes[0].fim,'2026-12');
  assert.equal(a.ctx.DATA.lixeira.length,1);
  assert.equal(a.ctx.DATA.lixeira[0].item.id,99);
  assert.equal(a.ctx.DATA.recorrentesVersao,3);
  assert.equal(vm.runInContext('allMonths()',a.ctx).at(-1),'2026-12');
  a.ctx.DATA=JSON.parse(a.storage.get('data'));
  const saved=JSON.stringify(a.ctx.DATA);
  visit(a.ctx,'2027-01');
  assert.equal(JSON.stringify(a.ctx.DATA),saved);
});
test('migração não infere recorrência a partir de parcelas nem de repetições sem cadastro',()=>{
  const a=app();a.ctx.DATA.recorrentes=null;a.ctx.DATA.recorrentesVersao=null;
  for(const nome of ['Compra','Mercado']) for(const mes of ['2026-10','2026-11']) {
    a.ctx.DATA.despesas.push({id:a.ctx.DATA.despesas.length+1,nome,mes,val:50,status:'Falta Pagar',...(nome==='Compra'?{origem:'parcelamento',parcelamentoId:'parc-1',parcelasTotal:2}:{})});
  }
  const original=JSON.stringify(a.ctx.DATA.despesas);
  a.ctx.initializeRecurringAccounts();visit(a.ctx,'2027-01');
  assert.equal(a.ctx.DATA.recorrentes.length,0);
  assert.equal(JSON.stringify(a.ctx.DATA.despesas),original);
});
test('cadastro inferido de parcelas identificadas é retirado sem apagar parcelas originais',()=>{
  const a=app(),id=legacySchedule(a);
  a.ctx.DATA.despesas.forEach((d,index)=>Object.assign(d,{origem:'parcelamento',parcelamentoId:'parc-1',parcelaAtual:index+1,parcelasTotal:3}));
  a.ctx.DATA.despesas.push({id:99,recorrenteId:id,origem:'recorrente',nome:'Voo Gol',mes:'2027-01',status:'Falta Pagar'});
  visit(a.ctx,'2027-01');
  assert.equal(a.ctx.DATA.recorrentes.length,0);
  assert.equal(a.ctx.DATA.despesas.length,3);
  assert.ok(a.ctx.DATA.despesas.every(d=>d.origem==='parcelamento'&&!d.recorrenteId));
  assert.equal(a.ctx.DATA.lixeira[0].item.id,99);
});
test('pagamentos após o fim são preservados e não ampliam o prazo original',()=>{
  const a=app(),id=legacySchedule(a);
  const paid={id:98,recorrenteId:id,origem:'recorrente',nome:'Voo Gol',mes:'2027-01',val:19,status:'Pago',pagoEm:'2027-01-05'};
  const paymentRecorded={id:99,recorrenteId:id,origem:'recorrente',nome:'Voo Gol',mes:'2027-02',val:20,status:'Falta Pagar',pagoEm:'2027-02-05'};
  a.ctx.DATA.despesas.push(paid,paymentRecorded);
  visit(a.ctx,'2027-03');
  assert.equal(a.ctx.DATA.recorrentes[0].fim,'2026-12');
  assert.ok(a.ctx.DATA.despesas.includes(paid));assert.ok(a.ctx.DATA.despesas.includes(paymentRecorded));
  assert.equal(a.ctx.DATA.despesas.length,5);
});
test('exclusão da última parcela não encurta o prazo nem recria o mês excluído',()=>{
  const a=app(),id=legacySchedule(a);
  const last=a.ctx.DATA.despesas.pop();a.ctx.moveToTrash('despesa',last);
  a.ctx.DATA.recorrentes[0].pularMeses=['2026-12'];
  visit(a.ctx,'2026-12');visit(a.ctx,'2027-01');
  assert.equal(a.ctx.DATA.recorrentes[0].fim,'2026-12');
  assert.equal(a.ctx.DATA.despesas.length,2);
  assert.equal(a.ctx.DATA.lixeira.length,1);
});
test('migração conserva contas explicitamente recorrentes e alterações já salvas',()=>{
  const a=app();createAccount(a);legacySchedule(a);
  const r=a.ctx.DATA.recorrentes.find(r=>r.cadastroManual);
  r.alteracoes=[{from:'2026-11',data:{val:30}}];
  visit(a.ctx,'2027-01');
  assert.equal(r.fim,undefined);
  assert.equal(a.ctx.DATA.despesas.find(d=>d.recorrenteId===r.id&&d.mes==='2027-01').val,30);
  assert.ok(!a.ctx.DATA.despesas.some(d=>d.nome==='Voo Gol'&&d.mes==='2027-01'));
});
test('compra parcelada nova gera apenas a quantidade escolhida inclusive após recarregar',()=>{
  const a=app();createAccount(a);a.ctx.DATA.despesas=[];a.ctx.DATA.recorrentes=[];
  const values={'in-desc':'Notebook','in-recorr':'parcelada','in-parcela-mes':'2026-10','in-parcelas-total':'3','in-valor':'R$ 100,00'};
  for(const [id,value] of Object.entries(values))a.ctx.document.getElementById(id).value=value;
  vm.runInContext('addEntry()',a.ctx);
  a.ctx.DATA=JSON.parse(a.storage.get('data'));
  visit(a.ctx,'2027-01');
  assert.equal(a.ctx.DATA.despesas.length,3);
  assert.equal(a.ctx.DATA.recorrentes.length,0);
  assert.equal(a.ctx.DATA.despesas.at(-1).mes,'2026-12');
  assert.equal(a.ctx.DATA.despesas.reduce((sum,d)=>sum+Math.round(d.val*100),0),10000);
});

test('filtros distinguem encerradas de pausadas e mantêm a lista ativa como padrão',()=>{
  const a=app();a.ctx.DATA.recorrentesVersao=3;
  a.ctx.DATA.recorrentes=[
    {id:'a',nome:'Ativa',ativo:true,cadastroManual:true,inicio:'2026-10'},
    {id:'p',nome:'Pausada',ativo:false,cadastroManual:true,inicio:'2026-10'},
    {id:'e',nome:'Encerrada',ativo:false,cadastroManual:true,inicio:'2026-01',fim:'2026-09'},
  ];
  assert.equal(vm.runInContext('recorrentesFilter',a.ctx),'active');
  assert.equal(a.ctx.recurringEntries('active')[0].id,'a');
  assert.equal(a.ctx.recurringEntries('paused').length,1);
  assert.equal(a.ctx.recurringEntries('paused')[0].id,'p');
  assert.equal(a.ctx.recurringEntries('ended')[0].id,'e');
  assert.equal(a.ctx.recurringEntries('all').length,3);
});
test('conta encerrada abre consulta e não oferece alteração após o término',()=>{
  const a=app(),id=legacySchedule(a,'Voo Gol','2026-09');
  const r=a.ctx.DATA.recorrentes[0];r.fim='2026-09';a.ctx.DATA.recorrentesVersao=3;
  a.ctx.openEditRecurringAccount(id);
  assert.equal(a.fields['recurring-modal-title'].textContent,'Conta encerrada');
  assert.equal(a.fields['recurring-edit-fields'].disabled,true);
  assert.equal(a.fields['recurring-save-btn'].hidden,true);
  assert.equal(a.fields['recurring-cancel-btn'].textContent,'Fechar');
  assert.match(a.fields['recurring-readonly-notice'].textContent,/não gera novas cobranças/);
  const before=JSON.stringify(a.ctx.DATA),saves=a.ctx.saves;
  a.ctx.saveRecurringAccount();
  assert.equal(JSON.stringify(a.ctx.DATA),before);assert.equal(a.ctx.saves,saves);
  a.ctx.closeEditRecurringAccount();
  createAccount(a);a.ctx.openEditRecurringAccount(a.ctx.DATA.recorrentes.find(r=>r.cadastroManual).id);
  assert.equal(a.fields['recurring-edit-fields'].disabled,false);
  assert.equal(a.fields['recurring-save-btn'].hidden,false);
  assert.equal(a.fields['recurring-save-btn'].textContent,'Salvar alterações');
});
test('seleção de mês bloqueia pago, excluído e posterior ao fim sem alterar dados',()=>{
  const a=app();createAccount(a);const r=a.ctx.DATA.recorrentes[0];r.fim='2026-12';r.pularMeses=['2026-11'];
  a.ctx.openEditRecurringAccount(r.id);
  assert.equal(vm.runInContext('editingRecurringMonth',a.ctx),'2026-12');
  for(const month of ['2026-10','2026-11','2027-01'])a.ctx.selectRecurringMonth(month);
  assert.equal(vm.runInContext('editingRecurringMonth',a.ctx),'2026-12');
  assert.ok(!a.ctx.DATA.despesas.some(d=>d.mes==='2026-11'));
});
