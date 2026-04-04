/* ══════════════════════════════════════════════
   ONBOARDING — Meus Gastos
   Módulo completo: slides, tooltip, empty state
   ══════════════════════════════════════════════ */

const ONBOARDING_KEY = 'mg_onboarding_done';
const TOOLTIP_KEY    = 'mg_tooltip_done';

/* ── Slides de boas-vindas ── */
const SLIDES = [
  {
    emoji: '👋',
    title: 'Bem-vindo ao Meus Gastos!',
    text:  'Seu app para controlar receitas e despesas de um jeito simples e visual.',
  },
  {
    emoji: '➕',
    title: 'Adicione seus lançamentos',
    text:  'Toque no botão "+" para registrar uma despesa ou receita em segundos.',
  },
  {
    emoji: '📊',
    title: 'Acompanhe seu saldo',
    text:  'Na tela Geral você vê o resumo do mês, gráficos e quanto ainda falta pagar.',
  },
  {
    emoji: '🔔',
    title: 'Alertas de vencimento',
    text:  'Defina datas de vencimento e receba alertas antes das contas chegarem.',
  },
];

let _slideIdx = 0;

function showOnboarding() {
  if (localStorage.getItem(ONBOARDING_KEY)) return;
  _slideIdx = 0;
  _renderSlide();
  document.getElementById('onboarding-overlay').classList.add('visible');
}

function _renderSlide() {
  const s = SLIDES[_slideIdx];
  document.getElementById('ob-emoji').textContent = s.emoji;
  document.getElementById('ob-title').textContent = s.title;
  document.getElementById('ob-text').textContent  = s.text;

  // Dots
  document.getElementById('ob-dots').innerHTML = SLIDES.map((_, i) =>
    `<div class="ob-dot${i === _slideIdx ? ' active' : ''}" onclick="_goSlide(${i})"></div>`
  ).join('');

  // Botão
  const btn = document.getElementById('ob-btn');
  btn.textContent = _slideIdx === SLIDES.length - 1 ? 'Começar!' : 'Próximo →';
}

function _goSlide(idx) {
  _slideIdx = idx;
  _renderSlide();
}

function obNext() {
  if (_slideIdx < SLIDES.length - 1) {
    _slideIdx++;
    _renderSlide();
  } else {
    _finishOnboarding();
  }
}

function obSkip() {
  _finishOnboarding();
}

function _finishOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, '1');
  const el = document.getElementById('onboarding-overlay');
  el.style.opacity = '0';
  setTimeout(() => { el.classList.remove('visible'); el.style.opacity = ''; }, 350);
  // Mostra tooltip do botão + após fechar
  setTimeout(showAddTooltip, 600);
}

/* ── Tooltip "Comece aqui" no botão + ── */
function showAddTooltip() {
  if (localStorage.getItem(TOOLTIP_KEY)) return;
  // Só mostra se não houver lançamentos ainda
  if (DATA.despesas.length > 0 || DATA.receitas.length > 0) return;

  const tip = document.getElementById('add-tooltip');
  if (tip) {
    tip.classList.add('visible');
    // Some ao clicar no botão +
    const btn = document.querySelector('.bn-add');
    if (btn) {
      const hide = () => { dismissTooltip(); btn.removeEventListener('click', hide); };
      btn.addEventListener('click', hide);
    }
    // Some automaticamente após 6s
    setTimeout(dismissTooltip, 6000);
  }
}

function dismissTooltip() {
  localStorage.setItem(TOOLTIP_KEY, '1');
  const tip = document.getElementById('add-tooltip');
  if (tip) tip.classList.remove('visible');
}

/* ── Empty state na visão geral ── */
function renderEmptyState() {
  const container = document.getElementById('overview-empty-state');
  if (!container) return;
  const isEmpty = DATA.despesas.length === 0 && DATA.receitas.length === 0;
  container.style.display = isEmpty ? 'flex' : 'none';
  // Esconde/mostra os gráficos e filtros
  const toHide = ['donut-box', 'overview-charts-area', 'overview-period-area'];
  toHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isEmpty ? 'none' : '';
  });
}

/* ── Inicialização ── */
function initOnboarding() {
  // Mostra onboarding só para usuários novos (sem cache)
  const hasData = localStorage.getItem('gastos_cache_desp') || localStorage.getItem('gastos_cache_rec');
  if (!hasData && !localStorage.getItem(ONBOARDING_KEY)) {
    // Pequeno delay para o app terminar de aparecer
    setTimeout(showOnboarding, 800);
  }
  // Tooltip independente do onboarding
  showAddTooltip();
}
