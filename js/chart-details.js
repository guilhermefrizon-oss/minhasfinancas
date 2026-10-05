/* Read-only chart details: no transaction or recurrence is changed here. */
function chartSum(entries){return entries.reduce((sum,item)=>sum+(Number(item.val)||0),0);}
function chartMonthEntries(month,incomeOnly=false){
  const income=DATA.receitas.filter(r=>r.mes===month);
  const expenses=incomeOnly?[]:DATA.despesas.filter(d=>d.mes===month);
  return {income,expenses,entries:[...income,...expenses]};
}
function chartValueNote(entries){
  if(!entries.length)return 'Sem lançamentos neste mês.';
  const missing=entries.filter(e=>e.val===null||e.val===undefined||e.val==='').length;
  if(missing)return `${missing} lançamento${missing===1?'':'s'} sem valor informado.`;
  if(entries.every(e=>Number(e.val)===0))return 'Há lançamentos, mas os valores estão zerados.';
  return '';
}
function chartDetailPanel(id,title,body){
  const panel=document.getElementById(id+'-details');if(!panel)return;
  panel.innerHTML=`<div class="chart-detail-heading"><strong>${chartText(title)}</strong><button type="button" onclick="closeChartDetails('${id}',true)" aria-label="Fechar detalhes do gráfico">×</button></div>${body}`;
  panel.hidden=false;
}
function closeChartDetails(id,restoreFocus=false){
  const panel=document.getElementById(id+'-details');if(panel)panel.hidden=true;
  const select=document.getElementById(id+'-month')||document.getElementById(id+'-day');if(select)select.value='';
  if(restoreFocus){if(select)select.focus();else document.querySelector('#donut-legend-list button')?.focus();}
}
function monthlyChartDetails(id,month){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!filteredMonths().includes(month))return;
  const {income,expenses,entries}=chartMonthEntries(month,id==='chartRec');
  const countText=`${entries.length} lançamento${entries.length===1?'':'s'} neste mês`;
  const note=chartValueNote(entries);
  let body=`<p>${countText}</p>${note?`<p class="chart-data-note">${note}</p>`:''}`;
  if(entries.length){
    if(id==='chartRec'){
      const received=income.filter(r=>(r.status||'Recebido')==='Recebido');
      body+=`<dl><div><dt>Recebido · ${received.length}</dt><dd>${fmt(chartSum(received))}</dd></div><div><dt>Aguardando · ${income.length-received.length}</dt><dd>${fmt(chartSum(income.filter(r=>r.status==='Aguardando')))}</dd></div><div><dt>Total de receitas</dt><dd>${fmt(chartSum(income))}</dd></div></dl>`;
    }else{
      body+=`<dl><div><dt>Receitas · ${income.length}</dt><dd>${fmt(chartSum(income))}</dd></div><div><dt>Despesas · ${expenses.length}</dt><dd>${fmt(chartSum(expenses))}</dd></div><div><dt>Saldo</dt><dd>${fmt(chartSum(income)-chartSum(expenses))}</dd></div></dl>`;
    }
  }
  chartDetailPanel(id,mesLabel(month),body);
  const select=document.getElementById(id+'-month');if(select)select.value=month;
}
function prepareMonthlyChart(id,months,incomeOnly=false){
  const select=document.getElementById(id+'-month');
  if(select){select.innerHTML='<option value="">Escolher mês para detalhes</option>'+months.map(month=>{
    const count=chartMonthEntries(month,incomeOnly).entries.length;
    return `<option value="${month}">${mesLabel(month)}${count?'':' · sem lançamentos'}</option>`;
  }).join('');select.value='';}
  closeChartDetails(id);
  const entries=months.flatMap(month=>chartMonthEntries(month,incomeOnly).entries);
  const notice=document.getElementById(id+'-empty');
  if(notice){
    notice.textContent=entries.length?chartValueNote(entries):'Sem lançamentos neste período. Escolha um mês abaixo para consultar.';
    notice.hidden=!notice.textContent;
  }
  const canvas=document.getElementById(id);
  if(canvas?.parentElement)canvas.parentElement.hidden=!entries.length;
}
function chartClickIndex(chart,event,elements,length){
  const area=chart.chartArea;
  if(area&&Number.isFinite(event.x)&&Number.isFinite(event.y)&&(event.x<area.left||event.x>area.right||event.y<area.top||event.y>area.bottom))return null;
  const position=chart.scales?.x?.getValueForPixel(event.x);
  const index=Number.isFinite(position)?Math.round(position):elements?.[0]?.index;
  return Number.isInteger(index)&&index>=0&&index<length?index:null;
}
function monthlyChartClick(id,chart,months,event,elements){
  const index=chartClickIndex(chart,event,elements,months.length);
  if(index!==null)monthlyChartDetails(id,months[index]);
}
let chartCategories={month:null,categories:[]};
function categoryChartDetails(index){
  const cat=chartCategories.categories[index];if(cat===undefined)return;
  const month=chartCategories.month;
  const entries=DATA.despesas.filter(d=>d.mes===month&&(d.cat||'Outros').split(' · ')[0]===cat);
  const paid=entries.filter(d=>d.status==='Pago');
  const total=chartSum(DATA.despesas.filter(d=>d.mes===month));
  const value=chartSum(entries);
  const note=chartValueNote(entries);
  const percent=total>0?(value/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1}):'0';
  chartDetailPanel('donut',cat+' · '+mesLabel(month),`<p>${entries.length} lançamento${entries.length===1?'':'s'} · ${percent}% do total do mês</p>${note?`<p class="chart-data-note">${note}</p>`:''}<dl><div><dt>Total da categoria</dt><dd>${fmt(value)}</dd></div><div><dt>Pago · ${paid.length}</dt><dd>${fmt(chartSum(paid))}</dd></div><div><dt>Pendente · ${entries.length-paid.length}</dt><dd>${fmt(chartSum(entries.filter(d=>d.status!=='Pago')))}</dd></div></dl>`);
}
function dailyChartDetails(month,index,accumulated,average,dailySpend,entries){
  if(accumulated[index]===null||accumulated[index]===undefined)return;
  const day=index+1;
  const select=document.getElementById('chartDailyEvo-day');if(select)select.value=day;
  const count=entries.filter(entry=>{
    const ref=entry.pagoEm||entry.venc;
    const date=ref?new Date(ref+'T00:00:00'):null;
    const entryDay=date&&`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`===month?date.getDate():1;
    return entryDay<=day;
  }).length;
  chartDetailPanel('chartDailyEvo',String(day).padStart(2,'0')+'/'+month.slice(5)+'/'+month.slice(0,4),`<p>${count} lançamento${count===1?'':'s'} incluído${count===1?'':'s'} no acumulado · pagos ou débito automático</p><dl><div><dt>Gasto no dia</dt><dd>${fmt(dailySpend[day]||0)}</dd></div><div><dt>Acumulado até o dia</dt><dd>${fmt(accumulated[index])}</dd></div>${average[index]!==null?`<div><dt>Média anterior até o dia</dt><dd>${fmt(average[index])}</dd></div>`:''}</dl>${count?'':'<p class="chart-data-note">Nenhum lançamento incluído até este dia.</p>'}`);
}

let dailyChartDetailState=null;
function selectDailyChartDay(day){
  if(!dailyChartDetailState||!Number.isInteger(day)||day<1||day>dailyChartDetailState.lastDay)return;
  const s=dailyChartDetailState;
  dailyChartDetails(s.month,day-1,s.accumulated,s.average,s.dailySpend,s.entries);
}
