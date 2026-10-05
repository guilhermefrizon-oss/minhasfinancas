const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function charts(){
 const fields={},configs=[],storage=new Map();
 function field(id){return fields[id]||(fields[id]={id,textContent:'',innerHTML:'',style:{},dataset:{},offsetWidth:0,addEventListener(){},setAttribute(k,v){this[k]=v;},classList:{contains:()=>false,add(){},remove(){},toggle(){}}});}
 const controls=[field('period6'),field('period12')];controls[0].dataset.chartPeriod='6';controls[1].dataset.chartPeriod='12';
 const ranges=[field('range')];const active=field('page-overview');
 const ctx=vm.createContext({DATA:{despesas:[],receitas:[],recorrentes:[]},Date:class extends Date{constructor(...args){super(...(args.length?args:['2026-10-05T12:00:00Z']));}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{},navigator:{},document:{body:field('body'),getElementById:field,querySelector:()=>active,querySelectorAll:sel=>sel==='[data-chart-period]'?controls:sel==='[data-chart-range]'?ranges:[],addEventListener(){}},setTimeout(){},Chart:function(el,config){configs.push({id:el.id,config});this.destroy=()=>{};this.data=config.data;this.options=config.options;this.update=()=>{};},uiIcon:()=>'',catColor:()=> '#123456'});
 for(const file of ['utils','overview','receitas'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'),ctx);
 ctx.animateValue=(el,val)=>el.textContent=ctx.fmt(val);
 ctx.renderCurMonth=()=>{};ctx.renderUpcomingTransactions=()=>{};ctx.initDailyEvo=()=>{};
 return {ctx,field,configs,active,controls};
}
test('janela mensal usa seis meses consecutivos e doze atravessando o ano, sem futuros',()=>{
 const a=charts();a.ctx.DATA.despesas=[{mes:'2025-01',val:50},{mes:'2026-12',val:900}];
 assert.deepEqual(Array.from(a.ctx.filteredMonths()),['2026-05','2026-06','2026-07','2026-08','2026-09','2026-10']);
 a.ctx.setChartPeriod(12);
 assert.equal(a.ctx.filteredMonths().length,12);assert.equal(a.ctx.filteredMonths()[0],'2025-11');assert.equal(a.ctx.filteredMonths()[11],'2026-10');
 a.ctx.setChartPeriod(9);assert.equal(a.ctx.filteredMonths().length,12);
 assert.equal(a.controls[1]['aria-pressed'],'true');assert.equal(a.controls[0]['aria-pressed'],'false');
});
test('categorias agrupam subcategorias e exibem valor e participação em ordem decrescente',()=>{
 const a=charts();const expenses=[{cat:'Moradia · Aluguel',val:60},{cat:'Moradia · Luz',val:15},{cat:'Transporte',val:25}];
 const before=JSON.stringify(expenses);a.ctx.renderDonutChart('2026-10',expenses);
 const html=a.field('donut-legend-list').innerHTML;
 assert.ok(html.indexOf('Moradia')<html.indexOf('Transporte'));
 assert.match(html,/75%/);assert.match(html,/25%/);assert.match(html,/75,00/);assert.match(html,/width:75%/);
 assert.equal(JSON.stringify(expenses),before);
 a.ctx.renderDonutChart('2026-10',[{cat:'Sem valor',val:0},{cat:'<script>',val:0}]);
 assert.doesNotMatch(a.field('donut-legend-list').innerHTML,/NaN|Infinity|<script>/);
 assert.match(a.field('donut-legend-list').innerHTML,/0%/);
});
test('gráficos de Geral e Receitas compartilham período e valores, sem alterar registros',()=>{
 const a=charts();a.ctx.DATA.receitas=[{mes:'2026-05',val:100,status:'Recebido'},{mes:'2026-10',val:200,status:'Aguardando'},{mes:'2026-11',val:900,status:'Recebido'}];
 a.ctx.DATA.despesas=[{mes:'2026-05',cat:'Moradia',val:30},{mes:'2026-10',cat:'Transporte',val:50}];
 const before=JSON.stringify(a.ctx.DATA);a.ctx.renderOverview();
 const balance=a.configs.find(x=>x.id==='chartSaldo').config;
 assert.equal(balance.data.labels.length,6);assert.equal(balance.data.datasets[0].data[0],70);assert.equal(balance.data.datasets[0].data[5],150);
 assert.equal(balance.options.scales.x.ticks.maxRotation,0);
 a.active.id='page-receitas';a.ctx.setChartPeriod(12);
 const income=a.configs.find(x=>x.id==='chartRec').config;
 assert.equal(income.data.labels.length,12);assert.equal(income.data.datasets[0].data[6],100);assert.equal(income.data.datasets[1].data[11],200);
 assert.equal(JSON.stringify(a.ctx.DATA),before);
});
