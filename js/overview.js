/* ══════ OVERVIEW ══════ */
function updateOverviewCards(){}

let currentPeriod=12,customRangeFrom=null,customRangeTo=null;
function setPeriod(n){
  currentPeriod=n;customRangeFrom=null;customRangeTo=null;
  document.querySelectorAll('#period-filter .pfchip').forEach(el=>{
    el.classList.toggle('active',(n===3&&el.textContent==='3m')||(n===6&&el.textContent==='6m')||(n===12&&el.textContent==='12m')||(n===0&&el.textContent==='Tudo'));
  });
  document.getElementById('pfchip-custom').classList.remove('active');
  document.getElementById('custom-range-wrap').style.display='none';
  overviewSelectedMonth=null;renderOverview();
}
function toggleCustomRange(){
  const wrap=document.getElementById('custom-range-wrap');
  if(wrap.style.display==='block'){setPeriod(12);return;}
  wrap.style.display='block';
  document.querySelectorAll('#period-filter .pfchip').forEach(el=>el.classList.remove('active'));
  document.getElementById('pfchip-custom').classList.add('active');
  const all=allMonths();
  document.getElementById('range-from').value=all[0]||'';
  document.getElementById('range-to').value=all[all.length-1]||'';
  customRangeFrom=document.getElementById('range-from').value;
  customRangeTo=document.getElementById('range-to').value;
  renderOverview();
}
function applyCustomRange(){
  customRangeFrom=document.getElementById('range-from').value;
  customRangeTo=document.getElementById('range-to').value;
  if(customRangeFrom&&customRangeTo&&customRangeFrom<=customRangeTo){overviewSelectedMonth=null;renderOverview();}
}
function filteredMonths(){
  const all=allMonths();
  if(customRangeFrom&&customRangeTo)return all.filter(m=>m>=customRangeFrom&&m<=customRangeTo);
  if(currentPeriod===0)return all;
  return all.slice(-currentPeriod);
}

let donutC = null;
function renderDonutChart(cm, desp){
  const donutBox = document.getElementById('donut-box');
  if(!desp || !desp.length){
    if(donutBox) donutBox.style.display='none';
    return;
  }
  if(donutBox) donutBox.style.display='';

  // Label do mês
  const [y,mo] = cm.split('-');
  const mLabel = new Date(+y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long'});
  const el = document.getElementById('donut-month-label');
  if(el) el.textContent = mLabel.charAt(0).toUpperCase()+mLabel.slice(1);

  // Agrupa por categoria principal
  const bycat = {};
  desp.forEach(d => {
    const cat = (d.cat||'Outros').split(' · ')[0];
    bycat[cat] = (bycat[cat]||0) + (d.val||0);
  });
  const sorted = Object.entries(bycat).sort((a,b)=>b[1]-a[1]);
  const total  = sorted.reduce((s,[,v])=>s+v, 0);

  // Centro
  const centerEl = document.getElementById('donut-center-val');
  if(centerEl){ centerEl.dataset.rawVal='0'; animateValue(centerEl, total, 'var(--red)'); }

  const labels = sorted.map(([k])=>k);
  const values = sorted.map(([,v])=>Math.round(v*100)/100);
  const colors = labels.map(l=>catColor(l));

  // Destrói e recria o chart
  if(donutC){ donutC.destroy(); donutC=null; }
  const ctx = document.getElementById('chartDonut');
  if(!ctx) return;
  donutC = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets:[{ data:values, backgroundColor:colors, borderWidth:2, borderColor:'var(--surface)', hoverBorderColor:'var(--surface)', hoverOffset:6 }] },
    options: {
      responsive:true, maintainAspectRatio:false,
      cutout:'72%',
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'#1a1830', borderColor:'#2e2c50', borderWidth:1,
          callbacks:{
            label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)} (${Math.round(ctx.raw/total*100)}%)`
          }
        }
      },
      animation:{ animateRotate:true, duration:600 }
    }
  });

  // Lista — barras no desktop, linhas simples no mobile
  const listEl = document.getElementById('donut-legend-list');
  if(listEl){
    const isMobile = window.innerWidth < 768;
    listEl.innerHTML = sorted.map(([cat,val])=>{
      const pct = Math.round(val/total*100);
      const col = catColor(cat);
      if(isMobile){
        // Mobile: linha simples — dot | nome | valor | %
        return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
          <div style="width:9px;height:9px;border-radius:3px;flex-shrink:0;background:${col}"></div>
          <span style="flex:1;font-size:13px;font-weight:600;color:var(--text)">${cat}</span>
          <span style="font-size:13px;font-weight:700;color:var(--text);flex-shrink:0">${fmt(val)}</span>
          <span style="font-size:11px;color:var(--text3);min-width:32px;text-align:right;flex-shrink:0">${pct}%</span>
        </div>`;
      }
      // Desktop: com barra de progresso
      return `<div style="display:flex;flex-direction:column;gap:3px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="display:flex;align-items:center;gap:6px;min-width:0">
            <div style="width:8px;height:8px;border-radius:2px;flex-shrink:0;background:${col}"></div>
            <span style="font-size:11px;font-weight:600;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cat}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <span style="font-size:11px;font-weight:700;color:var(--text)">${fmt(val)}</span>
            <span style="font-size:10px;color:var(--text3);min-width:28px;text-align:right">${pct}%</span>
          </div>
        </div>
        <div style="height:3px;border-radius:10px;background:var(--surface2);overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${col};border-radius:10px;transition:width .5s ease"></div>
        </div>
      </div>`;
    }).join('');
  }
}

function renderOverview(){
  // Empty state — esconde gráficos se não há dados
  if (typeof renderEmptyState === 'function') renderEmptyState();
  // Alertas de meta por categoria
  // Anima saudação e quick bar ao carregar overview
  ['overview-greeting','cur-month-block'].forEach((id,i)=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.classList.remove('anim-fade-up','anim-d1','anim-d2','anim-d3');
    void el.offsetWidth; // reflow para reiniciar animação
    el.classList.add('anim-fade-up',`anim-d${i+1}`);
  });
  renderCurMonth();
  const months=filteredMonths();
  const rec=months.map(m=>DATA.receitas.filter(r=>r.mes===m).reduce((s,r)=>s+(r.val||0),0));
  const desp=months.map(m=>DATA.despesas.filter(d=>d.mes===m).reduce((s,d)=>s+(d.val||0),0));
  const saldo=months.map((_,i)=>Math.round((rec[i]-desp[i])*100)/100);
  const cats=[...new Set(DATA.despesas.map(d=>(d.cat||'Outros').split(' · ')[0]))];
  document.getElementById('header-period').textContent=months.length?`${mesLabel(months[0])} – ${mesLabel(months[months.length-1])}`:'';
  updateOverviewCards(months,rec,desp);
  document.getElementById('legend-bar').innerHTML=[
    `<div class="legend-item"><div class="ldot" style="background:var(--green);border-radius:50%"></div>Receita</div>`,
    ...cats.map(c=>`<div class="legend-item"><div class="ldot" style="background:${catColor(c)}"></div>${c}</div>`)
  ].join('');
  const alpha=i=>!overviewSelectedMonth||overviewSelectedMonth===months[i];
  const catDatasets=cats.map(cat=>({
    label:cat,
    data:months.map(m=>Math.round(DATA.despesas.filter(d=>d.mes===m&&(d.cat||'Outros').split(' · ')[0]===cat).reduce((s,d)=>s+(d.val||0),0)*100)/100),
    backgroundColor:months.map((_,i)=>alpha(i)?catColor(cat):catColor(cat)+'55'),
    borderRadius:0,stack:'despesas',
  }));
  const recDataset={label:'Receita',data:rec.map(v=>Math.round(v*100)/100),backgroundColor:months.map((_,i)=>alpha(i)?'rgba(52,210,122,0.55)':'rgba(52,210,122,0.15)'),borderRadius:4,stack:'receita'};
  const tt=document.getElementById('chartTooltip');
  const ttBase={backgroundColor:'#1a1830',borderColor:'#2e2c50',borderWidth:1};
  if(barC)barC.destroy();
  barC=new Chart(document.getElementById('chartBar'),{
    type:'bar',data:{labels:months.map(mesLabel),datasets:[recDataset,...catDatasets]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{enabled:false}},
      onHover(evt,elements){
        if(!elements.length){tt.style.display='none';return;}
        const idx=elements[0].index,m=months[idx];
        const totalDesp=Math.round(desp[idx]*100)/100,totalRec=Math.round(rec[idx]*100)/100,saldoM=totalRec-totalDesp;
        const despRows=cats.map(cat=>{const v=DATA.despesas.filter(d=>d.mes===m&&(d.cat||'Outros').split(' · ')[0]===cat).reduce((s,d)=>s+(d.val||0),0);return v>0?{cat,v}:null;}).filter(Boolean).sort((a,b)=>b.v-a.v).map(({cat,v})=>`<div class="tt-row"><div class="tt-label"><div class="tt-dot" style="background:${catColor(cat)}"></div>${cat}</div><div class="tt-val">${fmt(v)}</div></div>`).join('');
        const recRows=DATA.receitas.filter(r=>r.mes===m).sort((a,b)=>b.val-a.val).map(r=>`<div class="tt-row"><div class="tt-label"><div class="tt-dot" style="background:#34d27a"></div>${r.nome}</div><div class="tt-val" style="color:#34d27a">${fmt(r.val)}</div></div>`).join('');
        document.getElementById('tt-month').textContent=mesLabel(m).toUpperCase();
        document.getElementById('tt-rows').innerHTML=`<div class="tt-section">RECEITAS</div>`+(recRows||`<div class="tt-row" style="color:#5c5a80;font-size:11px">Sem receitas</div>`)+`<div class="tt-rec-total"><span>Total receita</span><span style="color:#34d27a">${fmt(totalRec)}</span></div><div class="tt-divider"></div><div class="tt-section">DESPESAS</div>`+(despRows||`<div class="tt-row" style="color:#5c5a80;font-size:11px">Sem despesas</div>`)+`<div class="tt-saldo" style="color:${saldoM>=0?'#34d27a':'#f06060'}"><span>Saldo</span><span>${fmt(saldoM)}</span></div>`;
        document.getElementById('tt-total-val').textContent=fmt(totalDesp);
        tt.style.display='block';
        const ttW=tt.offsetWidth||270,ttH=tt.offsetHeight||420;
        const margin=8;
        let x=evt.native.clientX+18,y=evt.native.clientY-20;
        // Se não cabe à direita, coloca à esquerda
        if(x+ttW+margin>window.innerWidth) x=evt.native.clientX-ttW-12;
        // Garante que não sai pela esquerda
        if(x<margin) x=margin;
        // Ajuste vertical
        if(y+ttH+margin>window.innerHeight) y=window.innerHeight-ttH-margin;
        if(y<margin) y=margin;
        tt.style.left=x+'px';tt.style.top=y+'px';
      },
      onClick(evt){
        const pts=barC.getElementsAtEventForMode(evt,'index',{intersect:false},true);
        if(!pts.length)return;
        const clickedM=months[pts[0].index];
        overviewSelectedMonth=overviewSelectedMonth===clickedM?null:clickedM;
        updateOverviewCards(months,rec,desp);
        barC.data.datasets[0].backgroundColor=months.map((m,i)=>!overviewSelectedMonth||overviewSelectedMonth===m?'rgba(52,210,122,0.55)':'rgba(52,210,122,0.15)');
        catDatasets.forEach((ds,di)=>{const col=catColor(cats[di]);barC.data.datasets[di+1].backgroundColor=months.map((m,i)=>!overviewSelectedMonth||overviewSelectedMonth===m?col:col+'22');});
        barC.update();
      },
      scales:{x:{ticks:{color:'#5c5a80',autoSkip:false,maxRotation:45,font:{size:11}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#5c5a80',callback:v=>'R$'+v.toLocaleString('pt-BR'),font:{size:11}},grid:{color:'rgba(255,255,255,0.06)'}}}
    }
  });
  document.getElementById('chartBar').addEventListener('mouseleave',()=>{tt.style.display='none';});
  // Suporte a toque no mobile — simula hover ao tocar na barra
  const barCanvas=document.getElementById('chartBar');
  barCanvas.addEventListener('touchstart',e=>{
    e.preventDefault();
    const touch=e.touches[0];
    const pts=barC.getElementsAtEventForMode(touch,'index',{intersect:false},true);
    if(!pts.length){tt.style.display='none';return;}
    const fakeEvt={native:touch};
    barC.options.onHover(fakeEvt,pts);
  },{passive:false});
  barCanvas.addEventListener('touchend',()=>{setTimeout(()=>{tt.style.display='none';},2000);});
  // Anima chart boxes
  document.querySelectorAll('#page-overview .chart-box').forEach((el,i)=>{
    el.classList.remove('anim-fade-up','anim-d1','anim-d2','anim-d3','anim-d4');
    void el.offsetWidth;
    el.classList.add('anim-fade-up',`anim-d${i+2}`);
  });
  if(saldoC)saldoC.destroy();
  saldoC=new Chart(document.getElementById('chartSaldo'),{type:'bar',data:{labels:months.map(mesLabel),datasets:[{label:'Saldo',data:saldo,backgroundColor:saldo.map(v=>v>=0?'rgba(52,210,122,0.7)':'rgba(240,96,96,0.7)'),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{...ttBase,callbacks:{label:ctx=>` Saldo: ${fmt(ctx.raw)}`}}},scales:{x:{ticks:{color:'#5c5a80',autoSkip:false,maxRotation:45,font:{size:11}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#5c5a80',callback:v=>'R$'+v.toLocaleString('pt-BR'),font:{size:11}},grid:{color:'rgba(255,255,255,0.06)'}}}}});
  // Gráfico de evolução diária
  initDailyEvo();
}

/* ══════════════ DESTAQUE MÊS ATUAL ══════════════ */
/* mês selecionado no bloco de destaque (null = mês atual real) */
let curMonthSelected = null;

function getCurMonth(){
  if(curMonthSelected) return curMonthSelected;
  const now=new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function renderCurMonth(){
  const cm = getCurMonth();
  const now = new Date();
  const realCm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const isRealNow = cm === realCm;

  const [y,mo] = cm.split('-');
  const monthName = new Date(+y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});

  const desp = DATA.despesas.filter(d=>d.mes===cm);
  const rec  = DATA.receitas.filter(r=>r.mes===cm);

  const totalDesp  = desp.reduce((s,d)=>s+(d.val||0),0);
  const totalRec   = rec.reduce((s,r)=>s+(r.val||0),0);
  const totalPago  = desp.filter(d=>d.status==='Pago').reduce((s,d)=>s+(d.val||0),0);
  const totalFaltaSo   = desp.filter(d=>d.status==='Falta Pagar').reduce((s,d)=>s+(d.val||0),0);
  const totalDebito    = desp.filter(d=>d.status==='Débito auto').reduce((s,d)=>s+(d.val||0),0);
  const totalFalta     = totalFaltaSo + totalDebito; // Falta Pagar + Débito auto = a sair
  const countFalta     = desp.filter(d=>d.status==='Falta Pagar'||d.status==='Débito auto').length;
  const saldo      = totalRec - totalDesp;

  // Comparação com mês anterior
  const prevDate = new Date(+y, +mo-2, 1);
  const pm = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`;
  const prevDesp = DATA.despesas.filter(d=>d.mes===pm).reduce((s,d)=>s+(d.val||0),0);
  const prevRec  = DATA.receitas.filter(r=>r.mes===pm).reduce((s,r)=>s+(r.val||0),0);
  const prevSaldo = prevRec - prevDesp;

  function trendBadge(curr, prev, invertColor=false){
    if(!prev || prev===0) return '';
    const pct = Math.round(((curr-prev)/Math.abs(prev))*100);
    if(pct===0) return `<span style="font-size:10px;color:var(--text3);font-weight:600">= mesmo mês anterior</span>`;
    const up = pct > 0;
    // invertColor=true: subir é ruim (gastos), invertColor=false: subir é bom (receita/saldo)
    const color = (up !== invertColor) ? 'var(--green)' : 'var(--red)';
    const arrow = up ? '↑' : '↓';
    return `<span style="font-size:10px;color:${color};font-weight:700">${arrow} ${Math.abs(pct)}% vs mês anterior</span>`;
  }

  const diffPct  = prevDesp>0 ? Math.round(((totalDesp-prevDesp)/prevDesp)*100) : null;
  const diffLabel = diffPct===null?'': diffPct===0?'igual ao mês anterior':
    diffPct>0?`▲ ${diffPct}% vs anterior`:`▼ ${Math.abs(diffPct)}% vs anterior`;
  const diffColor = diffPct===null||diffPct===0?'var(--text3)':diffPct>0?'var(--red)':'var(--green)';

  // Progress bar
  const pct = totalRec>0?Math.min(100,Math.round((totalDesp/totalRec)*100)):(totalDesp>0?100:0);
  const barColor = pct>=90?'var(--red)':pct>=70?'var(--amber)':'var(--green)';

  // Pulse: só pisca no mês real atual
  document.getElementById('cur-month-pulse').style.display = isRealNow ? 'block' : 'none';

  // Nome do mês no botão
  document.getElementById('cur-month-name').textContent =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Cards: Receita | Gasto | Pago | Falta Pagar | Saldo
  document.getElementById('cur-month-cards').innerHTML = `
    <div class="cur-month-stat anim-fade-up anim-d1" data-glow="green">
      <div class="cur-month-stat-label">Receita</div>
      <div class="cur-month-stat-val" id="cmv-rec"></div>
      <div id="cmv-rec-trend" style="margin-top:3px"></div>
    </div>
    <div class="cur-month-stat anim-fade-up anim-d2" data-glow="red">
      <div class="cur-month-stat-label">Gasto</div>
      <div class="cur-month-stat-val" id="cmv-desp"></div>
      <div id="cmv-desp-trend" style="margin-top:3px"></div>
    </div>
    <div class="cur-month-stat anim-fade-up anim-d3" data-glow="blue">
      <div class="cur-month-stat-label">Pago</div>
      <div class="cur-month-stat-val" id="cmv-pago"></div>
    </div>
    <div class="cur-month-stat" data-glow="red" style="cursor:${totalFalta>0?'pointer':'default'}" onclick="${totalFalta>0?'goToDespesas()':''}">
      <div class="cur-month-stat-label" style="color:${totalFalta>0?'var(--red)':'var(--text3)'}">A sair</div>
      <div class="cur-month-stat-val" id="cmv-falta"></div>
      ${totalFalta>0?`<div class="cur-month-stat-sub" style="color:var(--red);opacity:.7">${countFalta} conta(s)</div>`:''}
    </div>
    <div class="cur-month-stat anim-fade-up anim-d5" data-glow="${saldo>=0?'green':'red'}">
      <div class="cur-month-stat-label">Saldo</div>
      <div class="cur-month-stat-val" id="cmv-saldo"></div>
      <div id="cmv-saldo-trend" style="margin-top:3px"></div>
    </div>`;
  // Classe de saldo no bloco para gradiente dinâmico
  const cmBlock = document.getElementById('cur-month-block');
  if(cmBlock){
    cmBlock.classList.remove('saldo-pos','saldo-neg');
    cmBlock.classList.add(saldo >= 0 ? 'saldo-pos' : 'saldo-neg');
  }
  // Count-up animado nos valores
  animateValue(document.getElementById('cmv-rec'),   totalRec,   totalRec>0?'var(--green)':'var(--text3)');
  animateValue(document.getElementById('cmv-desp'),  totalDesp,  totalDesp>0?'var(--red)':'var(--text3)');
  animateValue(document.getElementById('cmv-pago'),  totalPago,  totalPago>0?'var(--green)':'var(--text3)');
  animateValue(document.getElementById('cmv-falta'), totalFalta, totalFalta>0?'var(--red)':'var(--text3)');
  animateValue(document.getElementById('cmv-saldo'), saldo,      saldo>=0?'var(--green)':'var(--red)');

  // Mini-tendências
  const recTrendEl  = document.getElementById('cmv-rec-trend');
  const despTrendEl = document.getElementById('cmv-desp-trend');
  const saldoTrendEl= document.getElementById('cmv-saldo-trend');
  if(recTrendEl)  recTrendEl.innerHTML  = trendBadge(totalRec,  prevRec,  false);
  if(despTrendEl) despTrendEl.innerHTML = trendBadge(totalDesp, prevDesp, true);
  if(saldoTrendEl)saldoTrendEl.innerHTML= trendBadge(saldo,     prevSaldo,false);

  // Donut do mês
  renderDonutChart(cm, desp);

  // Barra de progresso — sempre visível
  const progWrap = document.getElementById('cur-month-progress-wrap');
  progWrap.style.display='block';
  const pctLabel = totalRec>0?`${pct}% da receita`:totalDesp>0?'sem receita registrada':'Nenhum lançamento';
  document.getElementById('cur-month-pct-label').textContent = pctLabel;
  document.getElementById('cur-month-pct-label').style.color = totalRec>0||totalDesp>0?barColor:'var(--text3)';
  const fill = document.getElementById('cur-month-bar-fill');
  fill.style.background = barColor;
  requestAnimationFrame(()=>{ fill.style.width = pct+'%'; });

}

/* ── Picker de mês no bloco de destaque ── */
let curPickerYear = null;
const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function toggleCurMonthPicker(){
  const picker = document.getElementById('cur-month-picker');
  const open = picker.style.display==='block';
  if(open){ closeCurMonthPicker(); return; }
  const cm = getCurMonth();
  curPickerYear = parseInt(cm.split('-')[0]);
  renderCurPickerYear();
  picker.style.display='block';
  document.getElementById('cur-month-chevron').style.transform='rotate(180deg)';
  setTimeout(()=>document.addEventListener('click', curPickerOutside), 0);
}
function closeCurMonthPicker(){
  document.getElementById('cur-month-picker').style.display='none';
  document.getElementById('cur-month-chevron').style.transform='rotate(0deg)';
  document.removeEventListener('click', curPickerOutside);
}
function curPickerOutside(e){
  const picker=document.getElementById('cur-month-picker');
  const btn=document.getElementById('cur-month-btn');
  if(!picker.contains(e.target)&&!btn.contains(e.target)) closeCurMonthPicker();
}
function shiftCurYear(delta){
  const years=[...new Set(allMonths().map(m=>parseInt(m.split('-')[0])))];
  const idx=years.indexOf(curPickerYear)+delta;
  if(idx<0||idx>=years.length) return;
  curPickerYear=years[idx];
  renderCurPickerYear();
}
function renderCurPickerYear(){
  const now=new Date();
  const realCm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const months=allMonths().filter(m=>parseInt(m.split('-')[0])===curPickerYear);
  document.getElementById('cur-picker-year').textContent=curPickerYear;
  document.getElementById('cur-picker-months').innerHTML = months.length
    ? months.map(m=>{
        const mo=parseInt(m.split('-')[1]);
        const active = m===getCurMonth();
        const isNow  = m===realCm;
        return `<div onclick="selectCurMonth('${m}')" style="padding:9px 16px;cursor:pointer;font-size:13px;font-weight:${active?700:500};color:${active?'var(--purple)':isNow?'var(--text)':'var(--text2)'};background:${active?'var(--surface2)':'transparent'};display:flex;align-items:center;justify-content:space-between;transition:background .1s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='${active?'var(--surface2)':'transparent'}'">
          ${MONTH_NAMES_PT[mo-1]}
          ${isNow?'<span style="font-size:9px;background:var(--purple);color:#fff;padding:1px 6px;border-radius:10px;font-weight:700">hoje</span>':''}
        </div>`;
      }).join('')
    : `<div style="padding:10px 16px;font-size:12px;color:var(--text3)">Sem dados em ${curPickerYear}</div>`;
}
function selectCurMonth(m){
  curMonthSelected = m;
  closeCurMonthPicker();
  renderCurMonth();
}

function goToDespesas(){
  despSelectedMonth = getCurMonth();
  showPage('despesas');
}
function goToDespesasEntry(id){
  goToDespesas();
  setTimeout(()=>{ openModal(id); },120);
}

/* ══════════════ CAMPO RÁPIDO ══════════════ */

// Mapa de palavras-chave → categoria + pagamento sugerido
const QUICK_MAP = [
  // Moradia
  { words:['aluguel','apartamento','casa'],          cat:'Moradia',           pag:'Caixa'   },
  { words:['condomínio','condominio'],                cat:'Moradia',           pag:'Boleto'  },
  { words:['luz','energia','enel','cpfl'],            cat:'Moradia',           pag:'Nubank'  },
  { words:['gás','gas','comgas'],                     cat:'Moradia',           pag:'PIX'     },
  { words:['água','agua','sabesp'],                   cat:'Moradia',           pag:'Boleto'  },
  // Utilidades
  { words:['internet','wi-fi','wifi','vivo','claro','tim','oi'], cat:'Utilidades', pag:'Nubank' },
  { words:['celular','telefone','plano'],             cat:'Utilidades',        pag:'Cartão'  },
  // Transporte
  { words:['gasolina','combustível','combustivel','etanol','posto'], cat:'Transporte', pag:'Cartão' },
  { words:['uber','99','táxi','taxi','ônibus','onibus','metro','metrô'], cat:'Transporte', pag:'Cartão' },
  { words:['seguro','carro','ipva','dpvat'],          cat:'Transporte',        pag:'Cartão'  },
  // Alimentação
  { words:['mercado','supermercado','feira','hortifruti','padaria','açougue'], cat:'Alimentação', pag:'Swile' },
  { words:['restaurante','almoço','almoco','jantar','lanche','ifood','rappi','delivery','pizza','hamburguer'], cat:'Alimentação', pag:'Cartão' },
  { words:['café','cafe','cafeteria'],                cat:'Alimentação',       pag:'Cartão'  },
  // Streaming
  { words:['netflix'],                               cat:'Streaming',          pag:'Cartão'  },
  { words:['spotify'],                               cat:'Streaming',          pag:'Cartão'  },
  { words:['youtube','yt premium'],                  cat:'Streaming',          pag:'Cartão'  },
  { words:['amazon','prime'],                        cat:'Streaming',          pag:'Cartão'  },
  { words:['apple','icloud'],                        cat:'Streaming',          pag:'Cartão'  },
  { words:['globoplay'],                             cat:'Streaming',          pag:'Cartão'  },
  { words:['disney','disney+'],                      cat:'Streaming',          pag:'Cartão'  },
  { words:['hbo','max'],                             cat:'Streaming',          pag:'Cartão'  },
  // Saúde
  { words:['academia','gym','smartfit'],              cat:'Saúde',             pag:'Cartão'  },
  { words:['terapia','psicólogo','psicologo','psiquiatra'], cat:'Saúde',       pag:'Cartão'  },
  { words:['farmácia','farmacia','remédio','remedio','medicamento'], cat:'Saúde', pag:'Cartão' },
  { words:['plano de saúde','plano saúde','unimed','amil','bradesco saude'], cat:'Saúde', pag:'Cartão' },
  { words:['médico','medico','consulta','dentista','exame'], cat:'Saúde',      pag:'Cartão'  },
  // Financeiro
  { words:['nubank','fatura','cartão','cartao','crédito','credito'], cat:'Financeiro', pag:'PIX' },
  { words:['poupança','poupanca','reserva','investimento'], cat:'Financeiro',  pag:'-'       },
  { words:['empréstimo','emprestimo','financiamento'], cat:'Financeiro',       pag:'Boleto'  },
  // Educação
  { words:['curso','faculdade','escola','mensalidade','livro','udemy','alura'], cat:'Educação', pag:'Cartão' },
  // Lazer
  { words:['cinema','teatro','show','ingresso','concert'], cat:'Lazer',        pag:'Cartão'  },
  { words:['viagem','hotel','airbnb','passagem','avião'], cat:'Lazer',         pag:'Cartão'  },
  // Compras
  { words:['roupa','roupas','tênis','tenis','sapato','vestuário'], cat:'Compras', pag:'Cartão' },
  { words:['eletrônico','eletronico','celular novo','notebook','computador'], cat:'Compras', pag:'Cartão' },
  // Receitas
  { words:['salário','salario'],       cat:'Salário',          isReceita:true },
  { words:['freela','freelance','freila'], cat:'Freela',       isReceita:true },
  { words:['vr','vale refeição','vale refeicao'], cat:'Vale Refeição', isReceita:true },
  { words:['va','vale alimentação','vale alimentacao'], cat:'Vale Alimentação', isReceita:true },
  { words:['vt','vale transporte'],    cat:'Vale Transporte',  isReceita:true },
  { words:['bônus','bonus','comissão','comissao'], cat:'Bônus', isReceita:true },
  { words:['dividendos','rendimento','juros'], cat:'Rendimento', isReceita:true },
];

const STATUS_WORDS = {
  'pago':         'Pago',
  'paguei':       'Pago',
  'falta pagar':  'Falta Pagar',
  'falta':        'Falta Pagar',
  'pendente':     'Falta Pagar',
  'débito auto':  'Débito auto',
  'debito auto':  'Débito auto',
  'débito':       'Débito auto',
  'debito':       'Débito auto',
  'auto':         'Débito auto',
};

const PAG_WORDS = {
  'cartão':'Cartão','cartao':'Cartão',
  'pix':'PIX',
  'boleto':'Boleto',
  'nubank':'Nubank',
  'caixa':'Caixa',
  'swile':'Swile',
  'dinheiro':'Dinheiro',
  'débito':'Débito auto','debito':'Débito auto',
};



/* ── Modal de confirmação ── */
let _confirmCallback = null;
function showConfirm(msg, cb){
  document.getElementById('confirm-msg').textContent = msg;
  _confirmCallback = cb;
  document.getElementById('confirm-modal').classList.add('open');
}
function confirmOk(){
  document.getElementById('confirm-modal').classList.remove('open');
  if(_confirmCallback){ _confirmCallback(); _confirmCallback=null; }
}
function confirmCancel(){
  document.getElementById('confirm-modal').classList.remove('open');
  _confirmCallback = null;
}

/* ── Tema claro/escuro ── */
function applyTheme(theme){
  if(theme==='light'){
    document.body.classList.add('light');
    document.getElementById('theme-btn').textContent = '☀️';
    const m=document.getElementById('theme-color-meta');
    if(m) m.setAttribute('content','#f4f3fb');
  } else {
    document.body.classList.remove('light');
    document.getElementById('theme-btn').textContent = '🌙';
    const m=document.getElementById('theme-color-meta');
    if(m) m.setAttribute('content','#0f0e1a');
  }
  localStorage.setItem('gastos_theme', theme);
}
function toggleTheme(){
  const cur = document.body.classList.contains('light') ? 'light' : 'dark';
  applyTheme(cur==='light' ? 'dark' : 'light');
}
// Carregar tema salvo
applyTheme(localStorage.getItem('gastos_theme') || 'dark');

// App inicia via _onFbLogin após Firebase auth

/* ── PWA: registra service worker ── */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js')
    .then(()=>console.log('SW registrado'))
    .catch(e=>console.log('SW erro:', e));
}

/* ══════════════════════════════════════════════
   GRÁFICO — EVOLUÇÃO DIÁRIA DE GASTOS
   ══════════════════════════════════════════════ */
let dailyEvoC = null;
let dailyEvoMonth = null; // formato 'YYYY-MM'

function initDailyEvo() {
  // Inicializa com o mês corrente (ou o último com dados)
  const months = allMonths();
  if (!months.length) return;
  const now = new Date();
  const cm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  dailyEvoMonth = months.includes(cm) ? cm : months[months.length - 1];
  renderDailyEvo();
}

function shiftDailyEvoMonth(delta) {
  const months = allMonths();
  if (!months.length) return;
  const idx = months.indexOf(dailyEvoMonth) + delta;
  if (idx < 0 || idx >= months.length) return;
  dailyEvoMonth = months[idx];
  renderDailyEvo();
}

function renderDailyEvo() {
  const m = dailyEvoMonth;
  if (!m) return;

  // Atualiza label do mês
  const [y, mo] = m.split('-').map(Number);
  const label = new Date(y, mo-1, 1).toLocaleDateString('pt-BR', {month:'long', year:'numeric'});
  const labelEl = document.getElementById('daily-evo-label');
  if (labelEl) labelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  // Dias do mês
  const daysInMonth = new Date(y, mo, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth()+1 === mo;
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  // Gastos do mês agrupados por dia
  const despMonth = DATA.despesas.filter(d => d.mes === m);
  const dailySpend = Array(daysInMonth + 1).fill(0); // índice 1..daysInMonth
  despMonth.forEach(d => {
    let day = null;
    if (d.venc) {
      const dv = new Date(d.venc + 'T00:00:00');
      if (dv.getFullYear() === y && dv.getMonth()+1 === mo) day = dv.getDate();
    }
    if (!day) {
      // Sem vencimento: usa o dia 1 como fallback
      day = 1;
    }
    dailySpend[day] = (dailySpend[day] || 0) + (d.val || 0);
  });

  // Acumulado dia a dia
  const labels = [];
  const accumulated = [];
  let running = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    labels.push(d === 1 || d % 3 === 0 || d === daysInMonth ? `${String(d).padStart(2,'0')}/${String(mo).padStart(2,'0')}` : '');
    if (d <= lastDay) {
      running += dailySpend[d] || 0;
      accumulated.push(Math.round(running * 100) / 100);
    } else {
      accumulated.push(null); // dias futuros ficam em branco
    }
  }

  const totalMonth = running;

  // Média dos 3 meses anteriores — acumulado para o mesmo dia
  const allM = allMonths();
  const mIdx = allM.indexOf(m);
  const prev3 = allM.slice(Math.max(0, mIdx - 3), mIdx);

  let avgAccum = Array(daysInMonth).fill(null);
  if (prev3.length > 0) {
    avgAccum = Array.from({length: daysInMonth}, (_, di) => {
      const dayNum = di + 1;
      let sum = 0;
      let count = 0;
      prev3.forEach(pm => {
        const [py, pmo] = pm.split('-').map(Number);
        const pmDays = new Date(py, pmo, 0).getDate();
        if (dayNum > pmDays) return;
        let runPrev = 0;
        const despPrev = DATA.despesas.filter(x => x.mes === pm);
        for (let pd = 1; pd <= dayNum; pd++) {
          despPrev.forEach(x => {
            let xday = null;
            if (x.venc) {
              const xd = new Date(x.venc + 'T00:00:00');
              if (xd.getFullYear() === py && xd.getMonth()+1 === pmo) xday = xd.getDate();
            }
            if (!xday) xday = 1;
            if (xday === pd) runPrev += (x.val || 0);
          });
        }
        sum += runPrev;
        count++;
      });
      return count > 0 ? Math.round(sum / count * 100) / 100 : null;
    });
  }

  // Delta vs média (último dia com dados)
  const avgFinal = avgAccum[lastDay - 1];
  const deltaEl = document.getElementById('daily-evo-delta');
  const totalEl = document.getElementById('daily-evo-total');
  if (totalEl) totalEl.textContent = fmt(totalMonth);
  if (deltaEl) {
    if (avgFinal && avgFinal > 0) {
      const pct = ((totalMonth - avgFinal) / avgFinal * 100).toFixed(1);
      const up = totalMonth >= avgFinal;
      deltaEl.textContent = (up ? '+' : '') + pct + '%';
      deltaEl.style.color = up ? 'var(--red)' : 'var(--green)';
    } else {
      deltaEl.textContent = '';
    }
  }

  // Gráfico
  const ctx = document.getElementById('chartDailyEvo');
  if (!ctx) return;
  if (dailyEvoC) { dailyEvoC.destroy(); dailyEvoC = null; }

  const isDark = !document.body.classList.contains('light');
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? '#5c5a80' : '#9896c8';

  dailyEvoC = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Acumulado',
          data: accumulated,
          borderColor: '#7b8cff',
          backgroundColor: 'rgba(123,140,255,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#7b8cff',
          borderWidth: 2.5,
          spanGaps: false,
        },
        {
          label: 'Média 3 meses',
          data: avgAccum,
          borderColor: 'rgba(160,160,180,0.55)',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#a0a0b4',
          borderWidth: 1.5,
          borderDash: [5, 4],
          spanGaps: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e1c3a',
          borderColor: '#2e2c50',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: (items) => {
              const d = items[0].dataIndex + 1;
              return `${String(d).padStart(2,'0')}/${String(mo).padStart(2,'0')}/${y}`;
            },
            label: (item) => {
              const name = item.datasetIndex === 0 ? 'Acumulado' : 'Média 3m';
              return ` ${name}: ${fmt(item.raw || 0)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: tickColor,
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: false,
          },
          grid: { color: gridColor }
        },
        y: {
          ticks: {
            color: tickColor,
            font: { size: 10 },
            callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : 'R$'+v.toLocaleString('pt-BR')
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}
