const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function app() {
  const fields = {};
  const storage = new Map();
  const ctx = vm.createContext({
    DATA: {despesas: [], receitas: [], recorrentes: [], recorrentesVersao: 2},
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ['2026-10-05T15:00:00Z'])); }
    },
    navigator: {}, uiIcon:()=>'',
    document: {body:{classList:{add(){},remove(){},contains(){return false}}},getElementById: id => fields[id] ||= {value:'', addEventListener(){},setAttribute(){}, classList:{remove(){}}}},
    localStorage: {getItem: key => storage.get(key) || null,setItem:(key,value)=>storage.set(key,value)},
    saves: 0,
    saveData() { ctx.saves++; storage.set('data', JSON.stringify(ctx.DATA)); },
  });
  for (const name of ['utils','despesas','lancamentos','overview']) {
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
