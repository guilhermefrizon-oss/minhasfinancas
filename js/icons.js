/* ══════ ÍCONES ══════ */

/* Logos reais via Simple Icons CDN */
function brandImg(slug, color, size=28) {
  return `<img src="https://cdn.simpleicons.org/${slug}/${color}" width="${size}" height="${size}" alt="${slug}" style="object-fit:contain;display:block">`;
}

/* SVGs genéricos para categorias sem marca */
const SVG = {
  home:      `<svg viewBox="0 0 32 32" fill="none"><path d="M6 28V14L16 6L26 14V28" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="11" y="19" width="10" height="9" rx="2" stroke="#4f46e5" stroke-width="2.2"/></svg>`,
  building:  `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="10" width="24" height="18" rx="2" stroke="#4f46e5" stroke-width="2.2"/><path d="M10 28V20h12v8" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round"/><path d="M4 14L16 4L28 14" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  bolt:      `<svg viewBox="0 0 32 32" fill="none"><path d="M16 4v2M16 26v2M4 16H6M26 16H28M7.5 7.5l1.4 1.4M23.1 23.1l1.4 1.4M7.5 24.5l1.4-1.4M23.1 8.9l1.4-1.4" stroke="#f5c542" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="16" r="5" stroke="#f5c542" stroke-width="2.2"/></svg>`,
  flame:     `<svg viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="20" rx="8" ry="9" stroke="#fb923c" stroke-width="2.2"/><path d="M12 11V8a4 4 0 018 0v3" stroke="#fb923c" stroke-width="2.2" stroke-linecap="round"/><path d="M13 20.5c0-1.7 3-4 3-4s3 2.3 3 4a3 3 0 01-6 0z" stroke="#fb923c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  drop:      `<svg viewBox="0 0 32 32" fill="none"><path d="M16 5C16 5 8 14 8 20a8 8 0 0016 0C24 14 16 5 16 5z" stroke="#38bdf8" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 22a4 4 0 004 3" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/></svg>`,
  wifi:      `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="11" stroke="#34d27a" stroke-width="2.2"/><path d="M5 16h22M16 5c-3 3-5 6.5-5 11s2 8 5 11M16 5c3 3 5 6.5 5 11s-2 8-5 11" stroke="#34d27a" stroke-width="2" stroke-linecap="round"/></svg>`,
  phone:     `<svg viewBox="0 0 32 32" fill="none"><rect x="9" y="3" width="14" height="26" rx="3" stroke="#34d27a" stroke-width="2.2"/><circle cx="16" cy="25" r="1.2" fill="#34d27a"/><path d="M13 7h6" stroke="#34d27a" stroke-width="2" stroke-linecap="round"/></svg>`,
  fuel:      `<svg viewBox="0 0 32 32" fill="none"><path d="M7 28V10a2 2 0 012-2h10a2 2 0 012 2v18" stroke="#a78bfa" stroke-width="2.2" stroke-linecap="round"/><path d="M5 28h18" stroke="#a78bfa" stroke-width="2.2" stroke-linecap="round"/><path d="M21 12h2a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"/><path d="M11 14h6" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"/></svg>`,
  car:       `<svg viewBox="0 0 32 32" fill="none"><path d="M6 17l2-6h16l2 6v5a1 1 0 01-1 1H7a1 1 0 01-1-1v-5z" stroke="#a78bfa" stroke-width="2.2"/><circle cx="10" cy="23" r="2.5" stroke="#a78bfa" stroke-width="2"/><circle cx="22" cy="23" r="2.5" stroke="#a78bfa" stroke-width="2"/></svg>`,
  bus:       `<svg viewBox="0 0 32 32" fill="none"><rect x="5" y="7" width="22" height="16" rx="3" stroke="#a78bfa" stroke-width="2.2"/><path d="M5 13h22" stroke="#a78bfa" stroke-width="2"/><circle cx="10" cy="26" r="2" stroke="#a78bfa" stroke-width="2"/><circle cx="22" cy="26" r="2" stroke="#a78bfa" stroke-width="2"/><path d="M10 23v3M22 23v3" stroke="#a78bfa" stroke-width="2"/></svg>`,
  wrench:    `<svg viewBox="0 0 32 32" fill="none"><path d="M20 6l-2 2 6 6 2-2a4 4 0 00-6-6z" stroke="#a78bfa" stroke-width="2" stroke-linejoin="round"/><path d="M24 14l-12 12a2 2 0 01-3-3L21 11" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"/></svg>`,
  cart:      `<svg viewBox="0 0 32 32" fill="none"><path d="M4 6h3l3 14h14l2-9H10" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13" cy="25" r="2" stroke="#38bdf8" stroke-width="2"/><circle cx="22" cy="25" r="2" stroke="#38bdf8" stroke-width="2"/></svg>`,
  food:      `<svg viewBox="0 0 32 32" fill="none"><path d="M10 4v8a4 4 0 008 0V4M14 12v16" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/><path d="M22 4v24" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  delivery:  `<svg viewBox="0 0 32 32" fill="none"><rect x="3" y="11" width="18" height="13" rx="2" stroke="#38bdf8" stroke-width="2.2"/><path d="M21 15l5 4v5h-5" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="26" r="2" stroke="#38bdf8" stroke-width="2"/><circle cx="22" cy="26" r="2" stroke="#38bdf8" stroke-width="2"/></svg>`,
  gym:       `<svg viewBox="0 0 32 32" fill="none"><rect x="2" y="13" width="5" height="6" rx="1.5" stroke="#f06090" stroke-width="2"/><rect x="25" y="13" width="5" height="6" rx="1.5" stroke="#f06090" stroke-width="2"/><path d="M7 16h5M20 16h5" stroke="#f06090" stroke-width="2.2" stroke-linecap="round"/><rect x="12" y="11" width="8" height="10" rx="2" stroke="#f06090" stroke-width="2.2"/></svg>`,
  therapy:   `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="10" r="5" stroke="#f06090" stroke-width="2.2"/><path d="M8 27c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#f06090" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  pill:      `<svg viewBox="0 0 32 32" fill="none"><rect x="6" y="8" width="20" height="18" rx="3" stroke="#f06090" stroke-width="2.2"/><path d="M16 13v8M12 17h8" stroke="#f06090" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  savings:   `<svg viewBox="0 0 32 32" fill="none"><path d="M6 16c0-6.6 4.5-10 10-10 4 0 7.5 2 9 5h2a2 2 0 010 4h-2c0 1-.3 2-.7 2.8L26 22v3h-3l-1-1.5A10 10 0 0116 26c-5.5 0-10-4.5-10-10z" stroke="#fb923c" stroke-width="2" stroke-linejoin="round"/></svg>`,
  chart:     `<svg viewBox="0 0 32 32" fill="none"><polyline points="4,24 10,16 16,20 22,10 28,8" stroke="#34d27a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 8h4v4" stroke="#34d27a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  debt:      `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" stroke="#f06060" stroke-width="2.2"/><path d="M11 16h10M16 11v10" stroke="#f06060" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  plane:     `<svg viewBox="0 0 32 32" fill="none"><path d="M6 25h20M16 5l3 8h-6l3-8z" stroke="#e879f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13l-3 9h4l2-4h8l2 4h4l-3-9" stroke="#e879f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  theater:   `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="8" width="24" height="18" rx="2" stroke="#e879f9" stroke-width="2.2"/><path d="M4 14h24M4 20h24M10 8v4M22 8v4M10 20v6M22 20v6" stroke="#e879f9" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  gift:      `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="13" width="24" height="15" rx="2" stroke="#06b6d4" stroke-width="2.2"/><path d="M4 17h24M16 13v15" stroke="#06b6d4" stroke-width="2.2"/><path d="M16 13c0-3 3-5 5-3s1 5-5 3zM16 13c0-3-3-5-5-3s-1 5 5 3z" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/></svg>`,
  pet:       `<svg viewBox="0 0 32 32" fill="none"><circle cx="11" cy="11" r="3" stroke="#06b6d4" stroke-width="2"/><circle cx="21" cy="11" r="3" stroke="#06b6d4" stroke-width="2"/><circle cx="7" cy="17" r="2.5" stroke="#06b6d4" stroke-width="2"/><circle cx="25" cy="17" r="2.5" stroke="#06b6d4" stroke-width="2"/><path d="M10 20c0 0 2 6 6 6s6-6 6-6l-2-4h-8l-2 4z" stroke="#06b6d4" stroke-width="2" stroke-linejoin="round"/></svg>`,
  shirt:     `<svg viewBox="0 0 32 32" fill="none"><path d="M12 4L8 8l-5 3 3 4 4-2v15h12V13l4 2 3-4-5-3-4-4" stroke="#06b6d4" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 4c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/></svg>`,
  monitor:   `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="7" width="24" height="16" rx="2" stroke="#06b6d4" stroke-width="2.2"/><path d="M11 27h10M16 23v4" stroke="#06b6d4" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  house2:    `<svg viewBox="0 0 32 32" fill="none"><path d="M4 14L16 4L28 14v14H4V14z" stroke="#06b6d4" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 28v-8h8v8" stroke="#06b6d4" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  salary:    `<svg viewBox="0 0 32 32" fill="none"><rect x="3" y="8" width="26" height="18" rx="3" stroke="#34d27a" stroke-width="2.2"/><circle cx="16" cy="17" r="4" stroke="#34d27a" stroke-width="2.2"/><path d="M8 12v10" stroke="#34d27a" stroke-width="2" stroke-linecap="round"/></svg>`,
  freelance: `<svg viewBox="0 0 32 32" fill="none"><rect x="5" y="5" width="16" height="20" rx="2" stroke="#34d27a" stroke-width="2.2"/><path d="M9 10h8M9 14h8M9 18h5" stroke="#34d27a" stroke-width="2" stroke-linecap="round"/><path d="M19 20l8-8-3-3-8 8v3h3z" stroke="#34d27a" stroke-width="2" stroke-linejoin="round"/></svg>`,
  card:      `<svg viewBox="0 0 32 32" fill="none"><rect x="3" y="8" width="26" height="16" rx="3" stroke="#7b8cff" stroke-width="2.2"/><path d="M3 13h26" stroke="#7b8cff" stroke-width="2.2"/><rect x="7" y="18" width="5" height="2.5" rx="1" fill="#7b8cff"/></svg>`,
  book:      `<svg viewBox="0 0 32 32" fill="none"><rect x="6" y="4" width="20" height="24" rx="2" stroke="#fb923c" stroke-width="2.2"/><path d="M10 10h12M10 15h12M10 20h8" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/></svg>`,
};

const ICONS = {
  'Apartamento': SVG.home,       'Aluguel': SVG.home,
  'Condomínio':  SVG.building,   'Casa': SVG.house2,
  'Luz': SVG.bolt,               'Gás': SVG.flame,
  'Água': SVG.drop,              'Internet': SVG.wifi,
  'Celular': SVG.phone,          'Gasolina': SVG.fuel,
  'Combustível': SVG.fuel,       'Seguro Carro': SVG.car,
  'Carro': SVG.car,              'Manutenção': SVG.wrench,
  'Ônibus': SVG.bus,             'Mercado': SVG.cart,
  'Restaurante': SVG.food,       'Delivery': SVG.delivery,
  'Academia': SVG.gym,           'Academia/Terapia': SVG.gym,
  'Terapia': SVG.therapy,        'Farmácia': SVG.pill,
  'Médico': SVG.therapy,         'Plano de Saúde': SVG.pill,
  'Cursos': SVG.book,            'Livros': SVG.book,
  'Investimento': SVG.chart,     'Poupança': SVG.savings,
  'Empréstimo': SVG.debt,        'Cartão': SVG.card,
  'Cartão Crédito': SVG.card,    'Roupas': SVG.shirt,
  'Eletrônicos': SVG.monitor,    'Viagem': SVG.plane,
  'Cinema': SVG.theater,         'Teatro': SVG.theater,
  'Presente': SVG.gift,          'Pet': SVG.pet,
  'Salário': SVG.salary,         'Freela': SVG.freelance,
  // Marcas reais
  'Spotify':         brandImg('spotify',       '1ED760'),
  'YouTube':         brandImg('youtube',       'FF0000'),
  'YouTube Premium': brandImg('youtube',       'FF0000'),
  'Netflix':         brandImg('netflix',       'E50914'),
  'Amazon Prime':    brandImg('amazonprime',   '00A8E1'),
  'Amazon':          brandImg('amazon',        'FF9900'),
  'Apple TV':        brandImg('apple',         'A2AAAD'),
  'Apple Music':     brandImg('applemusic',    'FC3C44'),
  'Globoplay':       brandImg('globo',         'F5423C'),
  'Disney+':         brandImg('disneyplus',    '113CCF'),
  'HBO Max':         brandImg('hbomax',        '5822B4'),
  'Paramount+':      brandImg('paramount',     '0064FF'),
  'Deezer':          brandImg('deezer',        'FEAA2D'),
  'Crunchyroll':     brandImg('crunchyroll',   'F47521'),
  'Twitch':          brandImg('twitch',        '9146FF'),
  'Xbox':            brandImg('xbox',          '107C10'),
  'PlayStation':     brandImg('playstation',   '003087'),
  'Steam':           brandImg('steam',         '000000'),
  'Uber':            brandImg('uber',          'FFFFFF'),
  '99':              brandImg('99',            'F4C72F'),
  'iFood':           brandImg('ifood',         'EA1D2C'),
  'Rappi':           brandImg('rappi',         'FF441F'),
  'Nubank':          brandImg('nubank',        '8A05BE'),
  'Nubank Ultravioleta': brandImg('nubank',    '8A05BE'),
  'Inter':           brandImg('inter',         'FF6B00'),
  'Itaú':            brandImg('itau',          'EC7000'),
  'Bradesco':        brandImg('bradesco',      'CC092F'),
  'Santander':       brandImg('santander',     'EC0000'),
  'Caixa':           brandImg('caixa',         '006BB8'),
  'Banco do Brasil': brandImg('bancodobrasil', 'FABC01'),
  'C6 Bank':         brandImg('c6bank',        '000000'),
  'PicPay':          brandImg('picpay',        '21C25E'),
  'Mercado Pago':    brandImg('mercadopago',   '00B1EA'),
  'PayPal':          brandImg('paypal',        '00457C'),
  'Mercado Livre':   brandImg('mercadolivre',  'FFE600'),
  'Shopee':          brandImg('shopee',        'EE4D2D'),
  'Shein':           brandImg('shein',         '000000'),
  'AliExpress':      brandImg('aliexpress',    'FF4747'),
  'Udemy':           brandImg('udemy',         'A435F0'),
  'Coursera':        brandImg('coursera',      '0056D2'),
  'Duolingo':        brandImg('duolingo',      '58CC02'),
};

const DEFAULT_ICON = `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="11" stroke="#9896c0" stroke-width="2.2"/><path d="M13 13c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.5-1 2.5-2.5 3v1.5" stroke="#9896c0" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="22" r="1.2" fill="#9896c0"/></svg>`;

const ALL_ICONS_LIST = Object.keys(ICONS).map(k => ({ key: k, label: k }));

/* ── Auto-seleção por nome digitado ─── */
const ICON_KEYWORDS = {
  'spotify':'Spotify','youtube':'YouTube','netflix':'Netflix',
  'amazon prime':'Amazon Prime','amazon':'Amazon',
  'globoplay':'Globoplay','globo':'Globoplay',
  'disney':'Disney+','hbo':'HBO Max','max':'HBO Max',
  'paramount':'Paramount+','deezer':'Deezer','crunchyroll':'Crunchyroll',
  'twitch':'Twitch','xbox':'Xbox','playstation':'PlayStation','steam':'Steam',
  'apple tv':'Apple TV','apple music':'Apple Music','apple':'Apple TV',
  'uber':'Uber','99':'99','ifood':'iFood','rappi':'Rappi',
  'nubank':'Nubank','ultravioleta':'Nubank Ultravioleta',
  'inter':'Inter','itaú':'Itaú','itau':'Itaú',
  'bradesco':'Bradesco','santander':'Santander','caixa':'Caixa',
  'banco do brasil':'Banco do Brasil','bb':'Banco do Brasil',
  'c6':'C6 Bank','picpay':'PicPay',
  'mercado pago':'Mercado Pago','paypal':'PayPal',
  'mercado livre':'Mercado Livre','shopee':'Shopee','shein':'Shein',
  'aliexpress':'AliExpress','udemy':'Udemy','coursera':'Coursera','duolingo':'Duolingo',
  'apartamento':'Apartamento','aluguel':'Aluguel',
  'condomínio':'Condomínio','condominio':'Condomínio','casa':'Casa',
  'luz':'Luz','energia':'Luz','gás':'Gás','gas':'Gás',
  'água':'Água','agua':'Água','internet':'Internet',
  'celular':'Celular','telefone':'Celular',
  'gasolina':'Gasolina','combustível':'Combustível','combustivel':'Combustível',
  'seguro':'Seguro Carro','carro':'Carro',
  'manutenção':'Manutenção','manutencao':'Manutenção',
  'ônibus':'Ônibus','onibus':'Ônibus','metro':'Ônibus',
  'mercado':'Mercado','supermercado':'Mercado',
  'restaurante':'Restaurante','lanchonete':'Restaurante',
  'delivery':'Delivery','academia':'Academia','terapia':'Terapia',
  'psicólogo':'Terapia','psicologo':'Terapia',
  'farmácia':'Farmácia','farmacia':'Farmácia','remédio':'Farmácia','remedio':'Farmácia',
  'médico':'Médico','medico':'Médico','saúde':'Plano de Saúde','saude':'Plano de Saúde','plano':'Plano de Saúde',
  'curso':'Cursos','escola':'Cursos','faculdade':'Cursos','livro':'Livros',
  'investimento':'Investimento','poupança':'Poupança','poupanca':'Poupança',
  'empréstimo':'Empréstimo','emprestimo':'Empréstimo',
  'cartão':'Cartão','cartao':'Cartão',
  'roupa':'Roupas','eletrônico':'Eletrônicos','eletronico':'Eletrônicos',
  'viagem':'Viagem','passagem':'Viagem','hotel':'Viagem',
  'cinema':'Cinema','teatro':'Teatro','presente':'Presente',
  'pet':'Pet','cachorro':'Pet','gato':'Pet',
  'salário':'Salário','salario':'Salário','freela':'Freela','freelance':'Freela',
};

function guessIconKey(nome) {
  if (!nome) return null;
  const lower = nome.toLowerCase().trim();
  const multi = Object.keys(ICON_KEYWORDS).filter(k => k.includes(' ')).sort((a,b) => b.length - a.length);
  for (const k of multi) { if (lower.includes(k)) return ICON_KEYWORDS[k]; }
  const words = lower.split(/\s+/);
  for (const w of words) { if (ICON_KEYWORDS[w]) return ICON_KEYWORDS[w]; }
  const single = Object.keys(ICON_KEYWORDS).filter(k => !k.includes(' ')).sort((a,b) => b.length - a.length);
  for (const k of single) { if (lower.includes(k)) return ICON_KEYWORDS[k]; }
  return null;
}

function itemIcon(nome, icon) {
  const key = icon || nome;
  const content = ICONS[key] || DEFAULT_ICON;
  return `<div style="width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center">${content}</div>`;
}

/* ══════ ICON PICKER ══════ */
let selectedIcon = null, selectedIconEdit = null, iconPickerTarget = null;

function openIconPicker() { iconPickerTarget='new'; renderIconGrid(selectedIcon); document.getElementById('icon-modal').classList.add('open'); document.getElementById('icon-search').value=''; filterIcons(); }
function openIconPickerEdit() { iconPickerTarget='edit'; renderIconGrid(selectedIconEdit); document.getElementById('icon-modal').classList.add('open'); document.getElementById('icon-search').value=''; filterIcons(); }
function closeIconModal() { document.getElementById('icon-modal').classList.remove('open'); }
function filterIcons() {
  const q = document.getElementById('icon-search').value.toLowerCase();
  const filtered = ALL_ICONS_LIST.filter(i => i.label.toLowerCase().includes(q));
  renderIconGrid(iconPickerTarget === 'edit' ? selectedIconEdit : selectedIcon, filtered);
}
function renderIconGrid(active, list = ALL_ICONS_LIST) {
  document.getElementById('icon-grid').innerHTML = list.map(i => `
    <div onclick="selectIcon('${i.key.replace(/'/g,"\\'")}') " title="${i.label}"
      style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:var(--radius-sm);cursor:pointer;border:2px solid ${active===i.key?'var(--purple)':'transparent'};background:${active===i.key?'var(--surface2)':'transparent'};transition:all .15s"
      onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='${active===i.key?'var(--surface2)':'transparent'}'">
      <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center">${ICONS[i.key]||DEFAULT_ICON}</div>
      <div style="font-size:9px;color:var(--text3);text-align:center;line-height:1.2;max-width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.label}</div>
    </div>`).join('');
}
function selectIcon(key) {
  if (iconPickerTarget==='edit') { selectedIconEdit=key; document.getElementById('edit-icon-preview').innerHTML=ICONS[key]||DEFAULT_ICON; }
  else { selectedIcon=key; document.getElementById('icon-picker-preview').innerHTML=ICONS[key]||DEFAULT_ICON; }
  closeIconModal();
}

/* Auto-seleção ao digitar */
function _autoIconListener(inputId, previewId, isEdit) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    // só preenche se usuário ainda não escolheu manualmente
    const current = isEdit ? selectedIconEdit : selectedIcon;
    if (current) return;
    const key = guessIconKey(input.value);
    if (!key) return;
    if (isEdit) { selectedIconEdit = key; }
    else { selectedIcon = key; }
    const el = document.getElementById(previewId);
    if (el) el.innerHTML = ICONS[key] || DEFAULT_ICON;
  });
}

document.getElementById('icon-modal').addEventListener('click', function(e){ if(e.target===this)closeIconModal(); });
document.getElementById('icon-picker-preview').innerHTML = DEFAULT_ICON;
document.getElementById('edit-icon-preview').innerHTML = DEFAULT_ICON;

_autoIconListener('in-desc',    'icon-picker-preview', false);
_autoIconListener('edit-nome',  'edit-icon-preview',   true);
