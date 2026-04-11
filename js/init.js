/* ══════ INICIALIZAÇÃO ══════ */
// updateHeaderProfile só é chamado após login via _onFbLogin

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initMoneyFields();
  initSettings();

  // Sugestão automática de tipo ao mudar categoria — sincroniza hidden input e toggle
  const inCat = document.getElementById('in-cat');
  const inTipo = document.getElementById('in-tipo');
  if(inCat && inTipo){
    inCat.addEventListener('change', () => {
      const val = guessTipo(inCat.value);
      inTipo.value = val;
      // Sincroniza visual do toggle
      document.querySelectorAll('#tipo-toggle .toggle-opt').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === val);
      });
    });
  }
});
