/* ══════════════════════════════════════════════
   SETTINGS — Meus Gastos
   Drawer + telas: Perfil, Metas, Dados
   ══════════════════════════════════════════════ */

/* ── Drawer ── */
function openSettings() {
  document.getElementById('settings-overlay').classList.add('open');
  document.getElementById('settings-drawer').classList.add('open');
}
function closeSettings() {
  document.getElementById('settings-overlay').classList.remove('open');
  document.getElementById('settings-drawer').classList.remove('open');
}

/* ── Telas internas ── */
function openSettingsScreen(id) {
  closeSettings();
  setTimeout(() => {
    document.getElementById(id).classList.add('open');
  }, 150);
}
function closeSettingsScreen(id) {
  document.getElementById(id).classList.remove('open');
}

/* ══════ PERFIL ══════ */
function openProfileSettings() {
  const user = window._fbUser;
  if (!user) return;
  document.getElementById('ps-name').value  = _userProfileData?.nome  || '';
  document.getElementById('ps-email').value = user.email || '';
  openSettingsScreen('screen-profile');
}

async function saveProfileSettings() {
  const user = window._fbUser;
  if (!user) return;
  const nome  = document.getElementById('ps-name').value.trim();
  const email = document.getElementById('ps-email').value.trim();
  if (!nome) { showToast('Digite seu nome.'); return; }

  const btn = document.getElementById('ps-save-btn');
  btn.textContent = 'Salvando...'; btn.disabled = true;

  try {
    // Atualiza nome no Firestore
    await fbFns().setDoc(fbFns().doc(fbDb(), 'users', user.uid), {
      nome, email: user.email, atualizadoEm: Date.now()
    }, { merge: true });

    _userProfileData = { ..._userProfileData, nome };
    localStorage.setItem('gastos_user_profile_' + user.uid, JSON.stringify(_userProfileData));
    applyHeaderName(nome);
    showToast('✅ Perfil atualizado!');
    closeSettingsScreen('screen-profile');
  } catch(e) {
    showToast('Erro ao salvar. Tente novamente.');
  } finally {
    btn.textContent = 'Salvar alterações'; btn.disabled = false;
  }
}

function openChangePassword() {
  document.getElementById('ps-pass-wrap').style.display =
    document.getElementById('ps-pass-wrap').style.display === 'none' ? 'block' : 'none';
}

async function saveNewPassword() {
  const user = window._fbUser;
  if (!user) return;
  const pass  = document.getElementById('ps-new-pass').value;
  const pass2 = document.getElementById('ps-new-pass2').value;
  if (!pass || pass.length < 6) { showToast('Senha deve ter ao menos 6 caracteres.'); return; }
  if (pass !== pass2) { showToast('As senhas não coincidem.'); return; }
  try {
    const { updatePassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    await updatePassword(user, pass);
    showToast('✅ Senha alterada!');
    document.getElementById('ps-new-pass').value  = '';
    document.getElementById('ps-new-pass2').value = '';
    document.getElementById('ps-pass-wrap').style.display = 'none';
  } catch(e) {
    if (e.code === 'auth/requires-recent-login') {
      showToast('Faça login novamente para alterar a senha.');
    } else {
      showToast('Erro ao alterar senha.');
    }
  }
}

async function deleteAccount() {
  const user = window._fbUser;
  if (!user) return;
  showConfirm('Excluir sua conta permanentemente? Todos os dados serão apagados e esta ação não pode ser desfeita.', async () => {
    try {
      // Apaga dados do Firestore
      const { deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await deleteDoc(fbFns().doc(fbDb(), 'gastos', user.uid));
      await deleteDoc(fbFns().doc(fbDb(), 'users',  user.uid));
      // Apaga conta do Auth
      const { deleteUser } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
      await deleteUser(user);
      localStorage.clear();
      showToast('Conta excluída.');
    } catch(e) {
      if (e.code === 'auth/requires-recent-login') {
        showToast('Faça login novamente para excluir a conta.');
      } else {
        showToast('Erro ao excluir conta.');
      }
    }
  });
}

/* ══════ DADOS ══════ */
function openDataSettings() {
  openSettingsScreen('screen-data');
}

function exportCSV() {
  const rows = [];

  // Cabeçalho
  rows.push(['Tipo','Nome','Categoria','Valor','Mês','Status','Vencimento','Pagamento']);

  // Despesas
  DATA.despesas.forEach(d => {
    rows.push([
      'Despesa',
      d.nome || '',
      d.cat  || '',
      d.val  != null ? (d.val).toFixed(2).replace('.', ',') : '',
      d.mes  || '',
      d.status || '',
      d.venc || '',
      d.pag  || '',
    ]);
  });

  // Receitas
  DATA.receitas.forEach(r => {
    rows.push([
      'Receita',
      r.nome || '',
      r.cat  || '',
      r.val  != null ? (r.val).toFixed(2).replace('.', ',') : '',
      r.mes  || '',
      r.status || '',
      '', '',
    ]);
  });

  const csv = rows.map(r =>
    r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(';')
  ).join('\r\n');

  const bom = '\uFEFF'; // BOM para Excel abrir com acentos corretos
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meus-gastos-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ CSV exportado!');
}

function backupJSON() {
  const data = {
    exportadoEm: new Date().toISOString(),
    despesas: DATA.despesas,
    receitas: DATA.receitas,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-meus-gastos-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Backup baixado!');
}

function clearAllData() {
  showConfirm('Apagar TODOS os lançamentos? Esta ação não pode ser desfeita.', async () => {
    DATA.despesas = [];
    DATA.receitas = [];
    saveData();
    renderOverview();
    closeSettingsScreen('screen-data');
    showToast('🗑 Dados apagados.');
  });
}

/* ══════ INIT ══════ */
function initSettings() {
  // Fecha drawer ao clicar no overlay
  const overlay = document.getElementById('settings-overlay');
  if (overlay) overlay.addEventListener('click', closeSettings);
}
