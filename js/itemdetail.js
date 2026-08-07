/* ══════════════════════════════════════════════════════════
   SOMAR VALOR (várias compras no mesmo mês) + HISTÓRICO DO ITEM
   ══════════════════════════════════════════════════════════ */

/* ── 1) Somar outro valor ao lançamento do mês ──
   Ex.: abasteci de novo → soma automaticamente no total do mês,
   guardando o detalhamento de cada abastecimento em d.parcelas. */
let _parcelaId = null;

function openParcela(id) {
  const d = DATA.despesas.find(x => x.id === id);
  if (!d) return;
  _parcelaId = id;
  const [y, mo] = d.mes.split('-');
  const mesTxt = new Date(+y, +mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  document.getElementById('parcela-title').textContent = `Somar em ${d.nome}`;
  document.getElementById('parcela-sub').innerHTML =
    `${mesTxt} · atual <strong>${d.val > 0 ? fmt(d.val) : 'R$ 0,00'}</strong>`;
  const inp = document.getElementById('parcela-valor');
  inp.value = '';
  clearFieldErrors(['parcela-valor']);
  if (!inp._miemasked) { applyMoneyMask(inp); inp._miemasked = true; }
  document.getElementById('parcela-modal').classList.add('open');
  setTimeout(() => inp.focus(), 80);
}

function closeParcela() {
  document.getElementById('parcela-modal').classList.remove('open');
  _parcelaId = null;
}

function confirmParcela() {
  if (_parcelaId == null) return;
  const d = DATA.despesas.find(x => x.id === _parcelaId);
  if (!d) { closeParcela(); return; }
  const add = readMoneyField('parcela-valor');
  if (add === null || add <= 0) { fieldError('parcela-valor', 'Digite um valor'); return; }
  // Inicializa o histórico com o valor atual como 1º lançamento, se ainda não houver.
  if (!Array.isArray(d.parcelas) || !d.parcelas.length) {
    d.parcelas = d.val > 0 ? [{ val: d.val, data: d.pagoEm || (d.mes + '-01') }] : [];
  }
  d.parcelas.push({ val: add, data: new Date().toISOString().slice(0, 10) });
  d.val = d.parcelas.reduce((s, p) => s + (p.val || 0), 0);
  saveData();
  closeParcela();
  renderDespTable();
  if (typeof renderCurMonth === 'function') renderCurMonth();
  showToast(`Somado! Novo total ${fmt(d.val)}`);
}

/* ── 2) Tela de histórico do item (meses anteriores + gráfico) ── */
let itemDetailChart = null;
let _itemDetailName = null;

function openItemDetail(nome, ev) {
  if (ev) { ev.stopPropagation(); }
  const all = DATA.despesas
    .filter(d => d.nome === nome)
    .sort((a, b) => (a.mes < b.mes ? -1 : a.mes > b.mes ? 1 : 0));
  if (!all.length) return;
  _itemDetailName = nome;

  const cat = all[all.length - 1].cat;
  const icon = (all.find(d => d.icon) || {}).icon || nome;
  const catCol = catColor(cat);

  document.getElementById('idet-icon').innerHTML = itemIcon(nome, icon);
  document.getElementById('idet-name').textContent = nome;
  document.getElementById('idet-cat').innerHTML =
    `<span style="background:${catCol}18;color:${catCol};padding:2px 10px;border-radius:8px;font-size:12px;font-weight:600">${catLabel(cat)}</span>`;

  // ── Estatísticas (apenas meses com valor lançado) ──
  const withVal = all.filter(d => d.val > 0);
  const vals = withVal.map(d => d.val);
  const total = vals.reduce((s, v) => s + v, 0);
  const media = vals.length ? total / vals.length : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  const maxM = withVal.find(d => d.val === max);
  const minM = withVal.find(d => d.val === min);

  const stat = (label, value, sub, col) => `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:12px 14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text3)">${label}</div>
      <div style="font-size:17px;font-weight:800;margin-top:4px;color:${col || 'var(--text)'}">${value}</div>
      ${sub ? `<div style="font-size:11px;color:var(--text3);margin-top:2px">${sub}</div>` : ''}
    </div>`;

  document.getElementById('idet-stats').innerHTML =
    stat('Total gasto', fmt(total), `${withVal.length} ${withVal.length === 1 ? 'mês' : 'meses'}`, 'var(--red)') +
    stat('Média / mês', fmt(media), 'por mês', 'var(--purple)') +
    stat('Maior', fmt(max), maxM ? mesLabel(maxM.mes) : '', 'var(--amber)') +
    stat('Menor', fmt(min), minM ? mesLabel(minM.mes) : '', 'var(--green)');

  // ── Lista de meses (mais recente primeiro) ──
  const bc = { 'Pago': 'pago', 'Falta Pagar': 'falta', 'Débito auto': 'auto' };
  const rowsDesc = [...all].reverse();
  document.getElementById('idet-months').innerHTML = rowsDesc.map(d => {
    // detalhamento de abastecimentos/compras do mês, se houver
    let breakdown = '';
    if (Array.isArray(d.parcelas) && d.parcelas.length > 1) {
      breakdown = `<div style="margin-top:6px;padding-left:2px;display:flex;flex-wrap:wrap;gap:4px">` +
        d.parcelas.map(p => {
          const dt = p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
          return `<span style="font-size:10px;color:var(--text3);background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:1px 7px">${dt ? dt + ' · ' : ''}${fmt(p.val)}</span>`;
        }).join('') + `</div>`;
    }
    return `
      <div style="padding:11px 2px;border-top:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div style="min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--text)">${mesLabelFull(d.mes)}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:1px">${d.pag || ''} ${d.parcelas && d.parcelas.length > 1 ? '· ' + d.parcelas.length + 'x' : ''}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:14px;font-weight:800;color:${d.val > 0 ? 'var(--text)' : 'var(--text3)'}">${d.val > 0 ? fmt(d.val) : '—'}</div>
            <span class="badge ${bc[d.status] || 'nd'}" style="font-size:9px;padding:1px 6px">${d.status}</span>
          </div>
        </div>
        ${breakdown}
      </div>`;
  }).join('');

  document.getElementById('item-detail-modal').classList.add('open');
  document.getElementById('idet-scroll').scrollTop = 0;
  renderItemDetailChart(withVal);
}

function closeItemDetail() {
  document.getElementById('item-detail-modal').classList.remove('open');
  if (itemDetailChart) { itemDetailChart.destroy(); itemDetailChart = null; }
  _itemDetailName = null;
}

function mesLabelFull(m) {
  const [y, mo] = m.split('-');
  const s = new Date(+y, +mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderItemDetailChart(rows) {
  const ctx = document.getElementById('idet-chart');
  if (!ctx) return;
  if (itemDetailChart) { itemDetailChart.destroy(); itemDetailChart = null; }
  if (!rows.length) return;

  const labels = rows.map(d => mesLabel(d.mes));
  const data = rows.map(d => d.val);
  const avg = data.reduce((s, v) => s + v, 0) / data.length;
  const ax = chartAxis();
  // Acima da média = vermelho, abaixo = verde, na média = roxo
  const colors = data.map(v =>
    v > avg * 1.05 ? 'rgba(240,96,96,0.78)' :
    v < avg * 0.95 ? 'rgba(52,210,122,0.78)' :
    'rgba(123,140,255,0.78)');

  itemDetailChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 5, maxBarThickness: 46 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181b', borderColor: '#3a3a3d', borderWidth: 1,
          callbacks: { label: c => ' ' + fmt(c.raw) },
        },
      },
      scales: {
        x: { ticks: { color: ax.tick, font: { size: ax.font }, autoSkip: true, maxRotation: 45 }, grid: { display: false } },
        y: { ticks: { color: ax.tick, callback: ax.money, font: { size: ax.font } }, grid: { color: ax.grid }, beginAtZero: true },
      },
    },
  });
}

/* ── Fechar ao clicar fora / Enter para somar ── */
(function initItemDetail() {
  const pm = document.getElementById('parcela-modal');
  if (pm) pm.addEventListener('click', function (e) { if (e.target === this) closeParcela(); });
  const pv = document.getElementById('parcela-valor');
  if (pv) pv.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); confirmParcela(); } });
  const im = document.getElementById('item-detail-modal');
  if (im) im.addEventListener('click', function (e) { if (e.target === this) closeItemDetail(); });
})();
