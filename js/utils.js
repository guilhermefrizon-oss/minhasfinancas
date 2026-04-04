/* ══════ FUNÇÕES UTILITÁRIAS ══════ */
function fmt(v){if(v==null||v===''||isNaN(v))return'—';return'R$\u00a0'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}

/* Count-up animado para valores monetários */
function animateValue(el, targetVal, color) {
  if(!el) return;
  const prev = parseFloat(el.dataset.rawVal || '0');
  if(prev === targetVal){ el.textContent = fmt(targetVal); return; }
  el.dataset.rawVal = targetVal;
  const duration = 500;
  const start = performance.now();
  const diff = targetVal - prev;
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOut
    const current = prev + diff * ease;
    el.textContent = fmt(current);
    if(t < 1) requestAnimationFrame(step);
    else el.textContent = fmt(targetVal);
  }
  requestAnimationFrame(step);
  if(color) el.style.color = color;
}
function mesLabel(m){const[y,mo]=m.split('-');return new Date(+y,+mo-1,1).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'});}
function allMonths(){const s=new Set([...DATA.despesas.map(d=>d.mes),...DATA.receitas.map(r=>r.mes)]);return[...s].sort();}

let overviewSelectedMonth=null,despSelectedMonth=null,recSelectedMonth=null;
let barC,saldoC,recC,saldoRecC;
