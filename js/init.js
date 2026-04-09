/* ══════ INICIALIZAÇÃO ══════ */
// updateHeaderProfile só é chamado após login via _onFbLogin

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initMoneyFields();
  initSettings();

  // Sugestão automática de tipo ao mudar categoria
  const inCat = document.getElementById('in-cat');
  const inTipo = document.getElementById('in-tipo');
  if(inCat && inTipo){
    inCat.addEventListener('change', () => {
      inTipo.value = guessTipo(inCat.value);
    });
  }
});
