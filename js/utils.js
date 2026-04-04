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

/* ══════ MÁSCARA DE VALOR MONETÁRIO ══════ */
// Formata enquanto o usuário digita: "1940" → "R$ 19,40", "194089" → "R$ 1.940,89"
function applyMoneyMask(input) {
  input.addEventListener('input', function() {
    // Guarda posição do cursor para não pular
    let raw = this.value.replace(/\D/g, ''); // só dígitos
    if (raw === '') { this.value = ''; return; }
    // Limita a 10 dígitos (R$ 99.999.999,99)
    if (raw.length > 10) raw = raw.slice(0, 10);
    const cents = parseInt(raw, 10);
    const formatted = (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    this.value = 'R$ ' + formatted;
  });

  // Ao focar, posiciona cursor no final
  input.addEventListener('focus', function() {
    setTimeout(() => {
      this.selectionStart = this.selectionEnd = this.value.length;
    }, 0);
  });

  // Ao limpar o campo programaticamente, aceita string vazia
  Object.defineProperty(input, '_rawValue', {
    get() { return this.value.replace(/\D/g, ''); },
  });
}

// Lê o valor numérico de um campo com máscara (retorna float ou null)
function readMoneyField(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const raw = el.value.replace(/\D/g, '');
  if (!raw) return null;
  return parseInt(raw, 10) / 100;
}

// Preenche um campo com máscara a partir de um valor numérico
function setMoneyField(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!val || val <= 0) { el.value = ''; return; }
  const cents = Math.round(val * 100);
  const formatted = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  el.value = 'R$ ' + formatted;
}

function initMoneyFields() {
  ['in-valor', 'in-rec-valor', 'edit-valor', 'edit-rec-valor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) applyMoneyMask(el);
  });
}
