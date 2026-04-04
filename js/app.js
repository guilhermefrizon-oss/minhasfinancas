/* FIX 5: Popup + Lançamento */
function openAddPopup(){const p=document.getElementById('add-popup');p.style.display='flex';p.classList.add('open');}
function closeAddPopup(){const p=document.getElementById('add-popup');p.classList.remove('open');p.style.display='none';}
function openAddForm(tipo){
  closeAddPopup();
  const now=new Date(),cm=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  if(tipo==='despesa'){
    document.getElementById('in-mes').value=cm;
    document.getElementById('in-mes-ini').value=cm;
    document.getElementById('in-mes-fim').value=cm;
    renderManageList();
    document.getElementById('add-desp-modal').classList.add('open');
  } else {
    document.getElementById('in-rec-mes').value=cm;
    document.getElementById('in-rec-mes-ini').value=cm;
    document.getElementById('in-rec-mes-fim').value=cm;
    document.getElementById('add-rec-modal').classList.add('open');
  }
}
function closeAddDesp(){document.getElementById('add-desp-modal').classList.remove('open');}
function closeAddRec(){document.getElementById('add-rec-modal').classList.remove('open');}
document.getElementById('add-popup').addEventListener('click',function(e){if(e.target===this)closeAddPopup();});
document.getElementById('add-desp-modal').addEventListener('click',function(e){if(e.target===this)closeAddDesp();});
document.getElementById('add-rec-modal').addEventListener('click',function(e){if(e.target===this)closeAddRec();});

/* ══════ SHOWPAGE — sem "mensal" (FIX 4) ══════ */
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>{p.classList.remove('active');});
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const activePage=document.getElementById('page-'+id);
  activePage.classList.add('active');
  void activePage.offsetWidth; // reflow para reiniciar animação
  const idx=['overview','despesas','receitas','notif'].indexOf(id);
  document.querySelectorAll('.nav-btn')[idx].classList.add('active');
  // Sincroniza bottom nav
  ['overview','despesas','receitas'].forEach(pg=>{
    const el=document.getElementById('bn-'+pg);
    if(el) el.classList.toggle('active', pg===id);
  });
  // Destaca botão de notif no header quando na página de alertas
  const hNotif = document.getElementById('header-notif-btn');
  if(hNotif) hNotif.style.color = id==='notif' ? 'var(--purple)' : '';
  // Sincroniza sidebar desktop
  ['overview','despesas','receitas','notif'].forEach(pg=>{
    const el=document.getElementById('sb-'+pg);
    if(el) el.classList.toggle('active', pg===id);
  });
  // Scroll ao topo na troca de aba (mobile UX)
  const mc = document.getElementById('main-content');
  if(mc && window.innerWidth >= 768) mc.scrollTo({top:0, behavior:'smooth'});
  else window.scrollTo({top:0, behavior:'smooth'});
  if(id==='overview')renderOverview();
  if(id==='despesas')renderDespesas();
  if(id==='receitas')renderReceitas();
  if(id==='notif')renderNotif();
}
