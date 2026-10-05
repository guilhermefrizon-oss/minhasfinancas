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
 for(const file of ['utils','overview','chart-details','receitas'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'),ctx);
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
test('meses ausentes usam lacunas e detalhes diferenciam ausência, zero e valor não informado',()=>{
 const a=charts();a.ctx.DATA.receitas=[{mes:'2026-05',val:0,status:'Recebido'},{mes:'2026-07',val:null,status:'Aguardando'}];
 a.ctx.renderRecCharts();const data=a.configs.find(x=>x.id==='chartRec').config.data.datasets[0].data;
 assert.equal(data[0],0);assert.equal(data[1],null);
 a.ctx.monthlyChartDetails('chartRec','2026-06');assert.match(a.field('chartRec-details').innerHTML,/Sem lançamentos/);assert.doesNotMatch(a.field('chartRec-details').innerHTML,/Total de receitas/);
 a.ctx.monthlyChartDetails('chartRec','2026-05');assert.match(a.field('chartRec-details').innerHTML,/valores estão zerados/);assert.match(a.field('chartRec-details').innerHTML,/1 lançamento/);
 a.ctx.monthlyChartDetails('chartRec','2026-07');assert.match(a.field('chartRec-details').innerHTML,/sem valor informado/);
});
test('clique no mês sem barra abre painel persistente e não modifica registros',()=>{
 const a=charts();a.ctx.DATA.despesas=[{mes:'2026-10',val:50,cat:'Moradia'}];const before=JSON.stringify(a.ctx.DATA);
 a.ctx.renderOverview();const config=a.configs.find(x=>x.id==='chartBar').config;
 assert.deepEqual(Array.from(config.options.events),['click']);
 config.options.onClick({x:10,y:20},[],{chartArea:{left:0,right:100,top:0,bottom:100},scales:{x:{getValueForPixel:()=>1}}});
 assert.equal(a.field('chartBar-details').hidden,false);assert.match(a.field('chartBar-details').innerHTML,/Sem lançamentos/);
 a.ctx.closeChartDetails('chartBar');assert.equal(a.field('chartBar-details').hidden,true);
 assert.equal(JSON.stringify(a.ctx.DATA),before);
});
test('categoria detalha valores, percentual, quantidade e status, incluindo nome escapado',()=>{
 const a=charts();a.ctx.DATA.despesas=[{mes:'2026-10',cat:'<Moradia> · Luz',val:75,status:'Pago'},{mes:'2026-10',cat:'<Moradia> · Água',val:25,status:'Falta Pagar'}];
 a.ctx.renderDonutChart('2026-10',a.ctx.DATA.despesas);a.ctx.categoryChartDetails(0);
 const html=a.field('donut-details').innerHTML;
 assert.match(html,/2 lançamentos · 100%/);assert.match(html,/Pago · 1/);assert.match(html,/Pendente · 1/);assert.match(html,/75,00/);assert.match(html,/25,00/);assert.doesNotMatch(html,/<Moradia>/);
});
test('período inteiro vazio mostra mensagem e esconde somente o desenho do gráfico',()=>{
 const a=charts();a.field('chartRec').parentElement={hidden:false};a.ctx.renderRecCharts();
 assert.equal(a.field('chartRec').parentElement.hidden,true);assert.match(a.field('chartRec-empty').textContent,/Sem lançamentos neste período/);
 assert.match(a.field('chartRec-month').innerHTML,/sem lançamentos/);
 a.ctx.DATA.receitas=[{mes:'2026-10',val:0}];a.ctx.renderRecCharts();assert.equal(a.field('chartRec').parentElement.hidden,false);assert.match(a.field('chartRec-empty').textContent,/zerados/);
 a.ctx.renderDonutChart('2026-10',[]);assert.equal(a.field('donut-box').style.display,'');assert.match(a.field('donut-empty').textContent,/Sem lançamentos/);
});
test('evolução diária consulta dia e acumulado com quantidade correta e bloqueia dias futuros',()=>{
 const a=charts();a.ctx.DATA.despesas=[{mes:'2026-10',val:10,status:'Pago',pagoEm:'2026-10-02'},{mes:'2026-10',val:20,status:'Pago',pagoEm:'2026-10-04'}];
 vm.runInContext("dailyEvoMonth='2026-10'",a.ctx);const before=JSON.stringify(a.ctx.DATA);a.ctx.renderDailyEvo();
 a.ctx.selectDailyChartDay(2);let html=a.field('chartDailyEvo-details').innerHTML;assert.match(html,/1 lançamento incluído/);assert.match(html,/10,00/);assert.doesNotMatch(html,/30,00/);
 a.ctx.selectDailyChartDay(4);html=a.field('chartDailyEvo-details').innerHTML;assert.match(html,/2 lançamentos incluídos/);assert.match(html,/30,00/);
 a.ctx.selectDailyChartDay(6);assert.equal(a.field('chartDailyEvo-details').innerHTML,html);assert.equal(JSON.stringify(a.ctx.DATA),before);
});
