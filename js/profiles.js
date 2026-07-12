/* ══════ SISTEMA DE PERFIS — UI ══════ */
let pinTarget=null,pinBuffer='',editingProfileId=null;
const PROFILE_COLORS=['#7b8cff','#a78bfa','#34d27a','#f06060','#f5c542','#38bdf8','#fb923c','#e879f9'];
function profileColor(nome){return PROFILE_COLORS[(nome||'?').charCodeAt(0)%PROFILE_COLORS.length];}
function profileInitial(nome){return (nome||'?').charAt(0).toUpperCase();}

function applyGreeting(primeiro){
  const hour = new Date().getHours();
  let greeting;
  if (hour >= 5  && hour < 12) { greeting = 'Bom dia'; }
  else if (hour >= 12 && hour < 18) { greeting = 'Boa tarde'; }
  else                          { greeting = 'Boa noite'; }

  // Label de saudação com horário
  const labelEl = document.getElementById('overview-greeting-label');
  if(labelEl) labelEl.textContent = greeting;

  // Nome
  const nameEl = document.getElementById('overview-greeting-name');
  if(nameEl) nameEl.textContent = primeiro || '';

  // Avatar com inicial
  const avatarEl = document.getElementById('overview-greeting-avatar');
  if(avatarEl){
    const initial = (primeiro||'?').charAt(0).toUpperCase();
    avatarEl.textContent = initial;
    avatarEl.style.background = 'var(--text)';
    avatarEl.style.color = 'var(--bg)';
  }

  // Header greeting legado (caso exista)
  const el = document.getElementById('header-greeting');
  if (el) el.textContent = greeting + ',';
}

function applyHeaderName(nomeCompleto){
  const primeiro = nomeCompleto.split(' ')[0];
  const initial = primeiro.charAt(0).toUpperCase();

  // Header avatar (desktop)
  const avatarEl = document.getElementById('header-profile-avatar');
  const nameEl = document.getElementById('header-profile-name');
  if(avatarEl){ avatarEl.textContent = initial; avatarEl.style.background = 'var(--text)'; avatarEl.style.color = 'var(--bg)'; }
  if(nameEl) nameEl.textContent = primeiro;

  // Bottom nav avatar (mobile)
  const bnAvatar = document.getElementById('bn-avatar');
  if(bnAvatar){
    bnAvatar.textContent = initial;
    bnAvatar.style.background = 'var(--surface3)';
    bnAvatar.style.color = 'var(--text2)';
  }

  applyGreeting(primeiro);
}

function updateHeaderProfile(user){
  user = user || window._fbUser;
  if(!user) return;
  // Se já tem em cache, aplica imediatamente sem esperar rede
  if(_userProfileData && _userProfileData.nome){
    applyHeaderName(_userProfileData.nome);
    return;
  }
  // Busca do Firestore
  fbFns().getDoc(fbFns().doc(fbDb(),'users',user.uid)).then(snap=>{
    if(snap.exists() && snap.data().nome){
      _userProfileData = snap.data();
      applyHeaderName(snap.data().nome);
    } else {
      // Fallback: usa parte antes do @ e do ponto
      const emailName = user.email.split('@')[0].replace(/[._]/g,' ').replace(/\w/g,c=>c.toUpperCase());
      applyHeaderName(emailName);
    }
  }).catch(()=>{
    const emailName = user.email.split('@')[0].replace(/[._]/g,' ').replace(/\w/g,c=>c.toUpperCase());
    applyHeaderName(emailName);
  });
}

/* ══════ PERFIL DO USUÁRIO ══════ */
let _userProfileData = {}; // cache local dos dados do perfil
let _editingField = null;

function toggleUserMenu(){ openUserProfile(); }

function openUserProfile(){
  const screen = document.getElementById('user-profile-screen');
  screen.classList.add('visible');
  loadUserProfileData();
}
function closeUserProfile(){
  document.getElementById('user-profile-screen').classList.remove('visible');
}

async function loadUserProfileData(){
  const user = window._fbUser;
  if(!user) return;
  // Preenche email imediatamente
  document.getElementById('profile-email-val').textContent = user.email;
  document.getElementById('profile-email-display').textContent = user.email;

  // Aplica cache local imediatamente enquanto busca da rede
  const cached = localStorage.getItem('gastos_user_profile_' + user.uid);
  if(cached){ try{ _userProfileData = JSON.parse(cached); renderUserProfile(); } catch(_){} }

  try{
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
    const snap = await Promise.race([
      fbFns().getDoc(fbFns().doc(fbDb(),'users',user.uid)),
      timeout
    ]);
    if(snap.exists()){
      _userProfileData = snap.data();
      localStorage.setItem('gastos_user_profile_' + user.uid, JSON.stringify(_userProfileData));
    } else {
      _userProfileData = { nome: '', email: user.email, telefone: '' };
    }
  } catch(e){
    // Usa cache local já aplicado acima, ou fallback mínimo
    if(!cached) _userProfileData = { nome: '', email: user.email, telefone: '' };
  }
  renderUserProfile();
}

function renderUserProfile(){
  const nome = _userProfileData.nome || '';
  const telefone = _userProfileData.telefone || '—';
  const email = _userProfileData.email || window._fbUser?.email || '';
  const primeiroNome = nome.split(' ')[0] || email.split('@')[0];

  document.getElementById('profile-nome-val').textContent = nome || '—';
  document.getElementById('profile-telefone-val').textContent = telefone;
  document.getElementById('profile-email-val').textContent = email;
  document.getElementById('profile-fullname-display').textContent = nome || primeiroNome;
  document.getElementById('profile-email-display').textContent = email;

  // Avatar grande
  const avatarEl = document.getElementById('profile-avatar-big');
  avatarEl.textContent = primeiroNome.charAt(0).toUpperCase();
  const colors=['#7b8cff','#a78bfa','#34d27a','#f06060','#f5c542','#38bdf8','#fb923c','#e879f9'];
  avatarEl.style.background = colors[primeiroNome.charCodeAt(0)%colors.length];
}

function openEditField(field, title, currentValue, inputType='text'){
  _editingField = field;
  document.getElementById('edit-field-title').textContent = title;
  document.getElementById('edit-field-label').textContent = title;
  document.getElementById('edit-field-input').type = inputType;
  document.getElementById('edit-field-input').value = currentValue === '—' ? '' : currentValue;
  document.getElementById('edit-field-error').style.display = 'none';
  document.getElementById('edit-field-modal').classList.add('visible');
  setTimeout(()=>document.getElementById('edit-field-input').focus(), 100);
}
function closeEditField(){
  document.getElementById('edit-field-modal').classList.remove('visible');
  _editingField = null;
}
function saveEditField(){
  const val = document.getElementById('edit-field-input').value.trim();
  const errEl = document.getElementById('edit-field-error');
  if(_editingField === 'nome' && !val){
    errEl.textContent = 'Nome não pode estar vazio.';
    errEl.style.display = 'block';
    return;
  }
  if(_editingField === 'email'){
    if(!val || !val.includes('@')){
      errEl.textContent = 'Email inválido.';
      errEl.style.display = 'block';
      return;
    }
  }
  _userProfileData[_editingField] = val;
  closeEditField();
  renderUserProfile();
}

async function saveUserProfile(){
  const user = window._fbUser;
  if(!user) return;
  const btn = document.getElementById('btn-save-profile');
  btn.textContent = 'Salvando...';
  btn.disabled = true;

  // 1. Salva localmente SEMPRE — garante que não perde mesmo sem rede
  try{ localStorage.setItem('gastos_user_profile_' + user.uid, JSON.stringify(_userProfileData)); } catch(_){}

  // 2. Atualiza header imediatamente
  if(_userProfileData.nome) applyHeaderName(_userProfileData.nome);

  // 3. Fecha a tela e mostra feedback — não bloqueia esperando a rede
  showToast('Perfil atualizado!');
  btn.textContent = 'Salvar';
  btn.disabled = false;
  closeUserProfile();

  // 4. Sincroniza com Firestore em background (sem travar a UI)
  saveUserProfileToCloud(user);
}

async function saveUserProfileToCloud(user, attempt=1){
  try{
    await fbFns().setDoc(fbFns().doc(fbDb(),'users',user.uid), {
      ..._userProfileData,
      atualizadoEm: Date.now()
    });
    console.log('[Perfil] Sincronizado com a nuvem');
  } catch(e){
    console.warn(`[Perfil] Falha no sync (tentativa ${attempt}):`, e.message);
    // Tenta novamente com backoff: 5s, 15s, 30s
    if(attempt < 4){
      const delay = [5000, 15000, 30000][attempt - 1];
      setTimeout(() => saveUserProfileToCloud(user, attempt + 1), delay);
    }
  }
}

function openChangePassword(){
  const email = window._fbUser?.email;
  if(!email) return;
  if(!confirm('Enviar email de redefinição de senha para ' + email + '?')) return;
  fbFns().sendPasswordResetEmail(window._fbAuth, email)
    .then(()=>showToast('Email enviado! Verifique sua caixa de entrada.'))
    .catch(()=>showToast('Erro ao enviar email.'));
}
function openProfileScreen(){PROFILES=loadProfiles();renderProfileList();document.getElementById('profile-screen').style.display='flex';document.getElementById('profile-close-btn').style.display=getActiveProfileId()?'block':'none';}
function closeProfileScreen(){document.getElementById('profile-screen').style.display='none';}
function renderProfileList(){
  const pid=getActiveProfileId();
  document.getElementById('profile-list').innerHTML=PROFILES.map(p=>{
    const col=profileColor(p.nome);const isActive=p.id===pid;
    return`<div class="profile-card ${isActive?'active-profile':''}" onclick="selectProfile('${p.id}')">
      <div class="profile-avatar" style="background:${col}22;color:${col};font-weight:800">${profileInitial(p.nome)}</div>
      <div style="flex:1"><div style="font-weight:700;font-size:15px">${p.nome}</div><div style="font-size:11px;color:var(--text3);margin-top:2px;display:flex;align-items:center;gap:4px">${isActive?uiIcon('check',12)+' Ativo agora':'Clique para entrar'}</div></div>
      <div style="display:flex;gap:8px">
        <button onclick="event.stopPropagation();openEditProfile('${p.id}')" class="edit-btn" style="font-size:13px;display:inline-flex;align-items:center" title="Editar">${uiIcon('edit',14)}</button>
        ${PROFILES.length>1?`<button onclick="event.stopPropagation();deleteProfile('${p.id}')" class="edit-btn" style="border-color:var(--red);color:var(--red);font-size:13px;display:inline-flex;align-items:center" title="Excluir">${uiIcon('trash',14)}</button>`:''}
      </div>
    </div>`;
  }).join('');
}
function selectProfile(id){
  const p=PROFILES.find(x=>x.id===id);if(!p)return;
  if(id===getActiveProfileId()){closeProfileScreen();return;}
  pinTarget=id;pinBuffer='';updatePinDots();
  const pinAv=document.getElementById('pin-avatar');pinAv.textContent=profileInitial(p.nome);pinAv.style.background=profileColor(p.nome)+'22';pinAv.style.color=profileColor(p.nome);pinAv.style.fontWeight='800';
  document.getElementById('pin-title').textContent=p.nome;
  document.getElementById('pin-error').textContent='';
  document.getElementById('pin-modal').classList.add('open');
}
function pinPress(digit){if(pinBuffer.length>=4)return;pinBuffer+=digit;updatePinDots();if(pinBuffer.length===4)setTimeout(checkPin,80);}
function pinBackspace(){pinBuffer=pinBuffer.slice(0,-1);updatePinDots();document.getElementById('pin-error').textContent='';}
function pinCancel(){pinBuffer='';pinTarget=null;document.getElementById('pin-modal').classList.remove('open');}
function updatePinDots(){document.querySelectorAll('.pin-dot').forEach((d,i)=>d.classList.toggle('filled',i<pinBuffer.length));}
function checkPin(){
  const p=PROFILES.find(x=>x.id===pinTarget);if(!p)return;
  if(hashPin(pinBuffer)===p.pin){
    document.getElementById('pin-modal').classList.remove('open');
    setActiveProfileId(pinTarget);
    /* FIX 1: recarregar dados completamente isolados do novo perfil */
    DATA=loadData();
    updateHeaderProfile();closeProfileScreen();
    overviewSelectedMonth=null;despSelectedMonth=null;recSelectedMonth=null;
    if(barC)barC.destroy();if(saldoC)saldoC.destroy();if(recC)recC.destroy();if(saldoRecC)saldoRecC.destroy();
    renderOverview();updateNotifBadge();
    showToast('Bem-vindo(a), '+p.nome+'!');
  } else {
    document.getElementById('pin-error').textContent='PIN incorreto.';pinBuffer='';updatePinDots();
  }
}
function openCreateProfile(){editingProfileId=null;document.getElementById('create-profile-title').textContent='Novo perfil';document.getElementById('cp-nome').value='';document.getElementById('cp-pin').value='';document.getElementById('cp-pin2').value='';document.getElementById('cp-error').textContent='';document.getElementById('create-profile-modal').classList.add('open');}
function openEditProfile(id){const p=PROFILES.find(x=>x.id===id);if(!p)return;editingProfileId=id;document.getElementById('create-profile-title').textContent='Editar perfil';document.getElementById('cp-nome').value=p.nome;document.getElementById('cp-pin').value='';document.getElementById('cp-pin2').value='';document.getElementById('cp-error').textContent='';document.getElementById('create-profile-modal').classList.add('open');}
function closeCreateProfile(){document.getElementById('create-profile-modal').classList.remove('open');editingProfileId=null;}
function saveProfile(){
  const nome=document.getElementById('cp-nome').value.trim();
  const pin=document.getElementById('cp-pin').value.trim();
  const pin2=document.getElementById('cp-pin2').value.trim();
  if(!nome){document.getElementById('cp-error').textContent='Digite um nome.';return;}
  if(editingProfileId){
    if(pin){if(!/^[0-9]{4}$/.test(pin)){document.getElementById('cp-error').textContent='PIN deve ter 4 dígitos.';return;}if(pin!==pin2){document.getElementById('cp-error').textContent='PINs não coincidem.';return;}}
    const p=PROFILES.find(x=>x.id===editingProfileId);p.nome=nome;if(pin)p.pin=hashPin(pin);
    saveProfiles(PROFILES);updateHeaderProfile();renderProfileList();closeCreateProfile();showToast('Perfil atualizado!');
  } else {
    if(!/^[0-9]{4}$/.test(pin)){document.getElementById('cp-error').textContent='PIN deve ter 4 dígitos.';return;}
    if(pin!==pin2){document.getElementById('cp-error').textContent='PINs não coincidem.';return;}
    const id='profile_'+Date.now();
    /* FIX 1: Novo perfil começa com dados COMPLETAMENTE VAZIOS */
    localStorage.setItem(profileDataKey(id,'despesas'),'[]');
    localStorage.setItem(profileDataKey(id,'receitas'),'[]');
    localStorage.setItem('gastos_version_'+id,DATA_VERSION);
    PROFILES.push({id,nome,pin:hashPin(pin),createdAt:Date.now()});
    saveProfiles(PROFILES);renderProfileList();closeCreateProfile();showToast('Perfil criado!');
  }
}
function deleteProfile(id){
  const p=PROFILES.find(x=>x.id===id);
  if(!confirm(`Excluir o perfil "${p.nome}"?\n\nTodos os dados serão apagados permanentemente.`))return;
  localStorage.removeItem(profileDataKey(id,'despesas'));localStorage.removeItem(profileDataKey(id,'receitas'));localStorage.removeItem('gastos_version_'+id);
  PROFILES=PROFILES.filter(x=>x.id!==id);saveProfiles(PROFILES);
  if(getActiveProfileId()===id){setActiveProfileId(PROFILES[0].id);DATA=loadData();updateHeaderProfile();renderOverview();updateNotifBadge();}
  renderProfileList();showToast('Perfil excluído!');
}
