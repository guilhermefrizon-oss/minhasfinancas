/* ══════════════════════════════════════════════
   FIREBASE — Auth + Firestore
   ══════════════════════════════════════════════ */

// helpers para acessar Firebase injetado pelo module
function fbAuth(){ return window._fbAuth; }
function fbDb()  { return window._fbDb;   }
function fbFns() { return window._fbFns;  }

/* ── Tradução de erros Firebase ── */
function fbErrorMsg(code){
  const map={
    'auth/email-already-in-use':'Este email já está cadastrado.',
    'auth/invalid-email':'Email inválido.',
    'auth/user-not-found':'Email não encontrado.',
    'auth/wrong-password':'Senha incorreta.',
    'auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos.',
    'auth/network-request-failed':'Sem conexão com a internet.',
    'auth/invalid-credential':'Email ou senha incorretos.',
  };
  return map[code] || 'Erro inesperado. Tente novamente.';
}

/* ── Tela de login ── */
function switchLoginTab(tab){
  // Mostra a sub-tela correta
  const screens = {login:'auth-login', signup:'auth-signup', reset:'auth-reset'};
  Object.entries(screens).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if(el) el.style.display = key===tab ? 'flex' : 'none';
  });
  // Sincroniza estado dos tabs
  ['tab-login','tab-login-2'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('active', tab==='login');
  });
  ['tab-signup','tab-signup-2'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('active', tab==='signup');
  });
  // Limpa erros
  ['login-error','signup-error','reset-error','reset-success'].forEach(id=>{
    const el=document.getElementById(id); if(el){el.classList.remove('visible');el.textContent='';}
  });
}
function doGoogleLogin(){ showLoginError('login-error','Login com Google em breve!'); }
function doAppleLogin(){ showLoginError('signup-error','Login com Apple em breve!'); }
function setLoginLoading(btnId, loading){
  const btn=document.getElementById(btnId);
  if(!btn) return;
  btn.disabled=loading;
  btn.innerHTML=loading?'<span class="login-spinner"></span>Aguarde...':btn.dataset.label||btn.textContent;
  if(!loading && !btn.dataset.label) btn.dataset.label=btn.textContent;
}
function showLoginError(id, msg){ const el=document.getElementById(id); el.textContent=msg; el.classList.add('visible'); }
function hideLoginError(id){ const el=document.getElementById(id); el.classList.remove('visible'); }

async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  const remember=document.getElementById('login-remember').checked;
  hideLoginError('login-error');
  if(!email||!pass){ showLoginError('login-error','Preencha email e senha.'); return; }
  setLoginLoading('btn-login',true);
  try{
    // Persistência: LOCAL = mantém logado; SESSION = só enquanto o app está aberto
    const persistence = remember
      ? fbFns().browserLocalPersistence
      : fbFns().browserSessionPersistence;
    await fbFns().setPersistence(fbAuth(), persistence);
    await fbFns().signInWithEmailAndPassword(fbAuth(), email, pass);
    // Salva email para preencher da próxima vez se "lembrar" marcado
    if(remember){
      localStorage.setItem('gastos_saved_email', email);
    } else {
      localStorage.removeItem('gastos_saved_email');
    }
    // onAuthStateChanged cuida do resto
  } catch(e){
    showLoginError('login-error', fbErrorMsg(e.code));
    setLoginLoading('btn-login',false);
  }
}

async function doSignup(){
  const firstName=(document.getElementById('signup-name')?.value||'').trim();
  const lastName=(document.getElementById('signup-lastname')?.value||'').trim();
  const name = lastName ? `${firstName} ${lastName}` : firstName;
  const email=document.getElementById('signup-email').value.trim();
  const pass=document.getElementById('signup-pass').value;
  hideLoginError('signup-error');
  if(!firstName){ showLoginError('signup-error','Digite seu nome.'); return; }
  if(!email){ showLoginError('signup-error','Digite seu email.'); return; }
  if(!pass || pass.length < 6){ showLoginError('signup-error','A senha precisa ter pelo menos 6 caracteres.'); return; }
  setLoginLoading('btn-signup',true);
  try{
    const cred=await fbFns().createUserWithEmailAndPassword(fbAuth(), email, pass);
    await fbFns().setDoc(fbFns().doc(fbDb(),'users',cred.user.uid),{
      nome: name, email, criadoEm: Date.now()
    });
  } catch(e){
    showLoginError('signup-error', fbErrorMsg(e.code));
    setLoginLoading('btn-signup',false);
  }
}

async function doReset(){
  const email=document.getElementById('reset-email').value.trim();
  hideLoginError('reset-error');
  if(!email){ showLoginError('reset-error','Digite seu email.'); return; }
  setLoginLoading('btn-reset',true);
  try{
    await fbFns().sendPasswordResetEmail(fbAuth(), email);
    const s=document.getElementById('reset-success');
    s.textContent='Email enviado! Verifique sua caixa de entrada.';
    s.classList.add('visible');
    setLoginLoading('btn-reset',false);
  } catch(e){
    showLoginError('reset-error', fbErrorMsg(e.code));
    setLoginLoading('btn-reset',false);
  }
}

async function doLogout(){
  if(!confirm('Sair da conta?')) return;
  await fbFns().signOut(fbAuth());
}

/* ── Carregar / salvar dados no Firestore ── */
const DATA_VERSION='v3-2025';

async function loadDataFromCloud(uid){
  console.log('[App] Carregando dados...');
  const fns = fbFns();
  const docRef = fns.doc(fbDb(), 'gastos', uid);

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if(!resolved){ resolved = true; unsub(); console.warn('[App] Timeout — usando cache local'); resolve(null); }
    }, 10000);

    const unsub = fns.onSnapshot(docRef,
      { includeMetadataChanges: true },
      (snap) => {
        // Ignora snapshots vindos só do cache local — aguarda dado do servidor
        if(snap.metadata.fromCache && !snap.exists()) return;
        if(!resolved){
          resolved = true;
          clearTimeout(timer);
          unsub();
          if(snap.exists()){
            const d = snap.data();
            console.log('[App] Dados carregados do servidor ✓');
            resolve({ despesas: d.despesas||[], receitas: d.receitas||[] });
          } else {
            // Documento não existe — cria vazio e retorna limpo
            fns.setDoc(docRef, { despesas:[], receitas:[], _criado: Date.now() }, { merge: true })
              .catch(e => console.warn('[App] Erro ao criar documento:', e));
            console.log('[App] Conta nova criada ✓');
            resolve({ despesas: [], receitas: [] });
          }
        }
      },
      (err) => {
        if(!resolved){ resolved = true; clearTimeout(timer); unsub(); console.warn('[App] Erro onSnapshot:', err.message); resolve(null); }
      }
    );
  });
}

let _saveTimer=null;
let _pendingSync=false;

let _syncHideTimer = null;
function showSyncStatus(status){
  let el = document.getElementById('sync-indicator');
  if(!el){
    el = document.createElement('div');
    el.id = 'sync-indicator';
    document.body.appendChild(el);
  }
  const cfg = {
    saving: { color:'#7b8cff', bg:'rgba(123,140,255,.13)', border:'rgba(123,140,255,.25)', text:'⟳ Salvando...' },
    saved:  { color:'#34d27a', bg:'rgba(52,210,122,.1)',   border:'rgba(52,210,122,.2)',   text:'✓ Salvo'       },
    error:  { color:'#f06060', bg:'rgba(240,96,96,.13)',   border:'rgba(240,96,96,.25)',   text:'✗ Erro ao salvar' },
    offline:{ color:'#f5c542', bg:'rgba(245,197,66,.1)',   border:'rgba(245,197,66,.2)',   text:'⚡ Offline — salvo localmente' },
  };
  const s = cfg[status] || cfg.saved;
  el.style.color       = s.color;
  el.style.background  = s.bg;
  el.style.borderColor = s.border;
  el.textContent       = s.text;
  clearTimeout(_syncHideTimer);
  el.classList.add('si-visible');
  if(status === 'saved' || status === 'offline'){
    _syncHideTimer = setTimeout(() => el.classList.remove('si-visible'), 3000);
  }
}

function saveData(){
  // Salva localmente de imediato
  localStorage.setItem('gastos_cache_desp', JSON.stringify(DATA.despesas));
  localStorage.setItem('gastos_cache_rec',  JSON.stringify(DATA.receitas));
  _pendingSync=true;
  showSyncStatus('saving');
  // Sobe para o Firestore com debounce de 800ms
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>syncToFirestore(), 800);
}

async function syncToFirestore(){
  const user=window._fbUser;
  if(!user){
    showSyncStatus('offline');
    return;
  }
  try{
    await fbFns().setDoc(fbFns().doc(fbDb(),'gastos',user.uid),{
      despesas: DATA.despesas,
      receitas: DATA.receitas,
      atualizadoEm: Date.now()
    });
    _pendingSync=false;
    showSyncStatus('saved');
  } catch(e){
    console.warn('Firestore write error:',e);
    showSyncStatus('error');
    // Retry automático em 5s se falhou
    setTimeout(()=>{ if(_pendingSync) syncToFirestore(); },5000);
  }
}

// Sincroniza quando voltar a ter conexão
window.addEventListener('online', ()=>{ if(_pendingSync) syncToFirestore(); });

function loadData(){
  // Enquanto não tiver dados do Firebase, usa cache local
  const d=localStorage.getItem('gastos_cache_desp');
  const r=localStorage.getItem('gastos_cache_rec');
  return{
    despesas: d?JSON.parse(d):[],
    receitas: r?JSON.parse(r):[]
  };
}

let _unsubscribeSync = null; // guarda o unsubscribe do onSnapshot
let _syncRetryCount = 0;

function startRealtimeSync(uid) {
  // Cancela listener anterior se existir
  if (_unsubscribeSync) {
    _unsubscribeSync();
    _unsubscribeSync = null;
  }
  _syncRetryCount = 0;

  const fns = fbFns();
  const docRef = fns.doc(fbDb(), 'gastos', uid);
  _unsubscribeSync = fns.onSnapshot(docRef, (snap) => {
    // Ignora snapshots disparados pela própria escrita local (evita loop)
    if (snap.metadata.hasPendingWrites) return;

    if (snap.exists()) {
      const d = snap.data();
      const newDesp = d.despesas || [];
      const newRec  = d.receitas  || [];

      // Só atualiza se houver diferença real (evita re-render desnecessário)
      const changed =
        JSON.stringify(newDesp) !== JSON.stringify(DATA.despesas) ||
        JSON.stringify(newRec)  !== JSON.stringify(DATA.receitas);

      if (changed) {
        DATA.despesas = newDesp;
        DATA.receitas = newRec;
        localStorage.setItem('gastos_cache_desp', JSON.stringify(DATA.despesas));
        localStorage.setItem('gastos_cache_rec',  JSON.stringify(DATA.receitas));
        // Re-renderiza tudo silenciosamente
        renderOverview();
        if(typeof renderDespTable === 'function' && document.getElementById('page-despesas')?.classList.contains('active')) renderDespTable();
        if(typeof renderRecTable  === 'function' && document.getElementById('page-receitas')?.classList.contains('active'))  renderRecTable();
        renderNotif     && renderNotif();
        updateNotifBadge();
        showSyncStatus('saved');
        console.log('[Sync] Dados atualizados do Firestore ✓');
      }
    }
  }, (err) => {
    console.warn('[Sync] Erro no listener onSnapshot:', err);
    showSyncStatus('offline');
    if(err.code === 'unavailable' || err.code === 'unauthenticated'){
      if(_syncRetryCount < 3){
        const delay = Math.min(Math.pow(2, _syncRetryCount) * 2000, 30000);
        _syncRetryCount++;
        console.log(`[Sync] Reconectando em ${delay/1000}s... (tentativa ${_syncRetryCount}/3)`);
        setTimeout(() => {
          if(window._fbUser) startRealtimeSync(window._fbUser.uid);
        }, delay);
      } else {
        console.warn('[Sync] Máximo de tentativas atingido.');
      }
    }
  });
}

/* ── Callbacks de auth ── */
window._onFbLogin = async function(user){
  const sk = document.getElementById('overview-skeleton');
  if(sk) sk.style.display = 'block';
  try{
    document.getElementById('login-screen').classList.remove('visible');

    // 1. Mostra dados do cache local (localStorage) imediatamente — sem esperar rede
    const localD = localStorage.getItem('gastos_cache_desp');
    const localR = localStorage.getItem('gastos_cache_rec');
    if(localD || localR){
      DATA.despesas = localD ? JSON.parse(localD) : [];
      DATA.receitas = localR ? JSON.parse(localR) : [];
      if(sk) sk.style.display = 'none';
      document.body.classList.add('app-ready');
      updateHeaderProfile(user);
      renderOverview();
      updateNotifBadge();
      showSyncStatus('saving');
    }

    // 2. Busca da nuvem (ou cache Firestore se offline) em paralelo
    let cloud = null;
    try{ cloud = await loadDataFromCloud(user.uid); } catch(e){ console.warn(e); }

    if(cloud){
      const changed =
        JSON.stringify(cloud.despesas) !== JSON.stringify(DATA.despesas) ||
        JSON.stringify(cloud.receitas)  !== JSON.stringify(DATA.receitas);
      if(changed){
        DATA.despesas = cloud.despesas;
        DATA.receitas = cloud.receitas;
        localStorage.setItem('gastos_cache_desp', JSON.stringify(DATA.despesas));
        localStorage.setItem('gastos_cache_rec',  JSON.stringify(DATA.receitas));
        renderOverview();
        updateNotifBadge();
      }
      showSyncStatus('saved'); // conectou com sucesso
    } else {
      // cloud === null significa offline real (timeout + sem cache)
      showSyncStatus('offline');
    }

    // 3. Inicia listener em tempo real (funciona offline também com nova API)
    startRealtimeSync(user.uid);
  } catch(e){
    console.warn('Erro no login:', e);
    const localD = localStorage.getItem('gastos_cache_desp');
    const localR = localStorage.getItem('gastos_cache_rec');
    DATA.despesas = localD ? JSON.parse(localD) : [];
    DATA.receitas = localR ? JSON.parse(localR) : [];
    document.body.classList.add('app-ready');
  } finally {
    if(sk) sk.style.display = 'none';
    document.body.classList.add('app-ready');
    updateHeaderProfile(user);
    renderOverview();
    updateNotifBadge();
    // Onboarding — mostra só para usuários novos
    if (typeof initOnboarding === 'function') initOnboarding();
  }
};

window._onFbLogout = function(){
  if (_unsubscribeSync) {
    _unsubscribeSync();
    _unsubscribeSync = null;
  }
  localStorage.removeItem('gastos_cache_desp');
  localStorage.removeItem('gastos_cache_rec');
  DATA={despesas:[],receitas:[]};
  // Pré-preenche email salvo
  const savedEmail = localStorage.getItem('gastos_saved_email');
  if(savedEmail){
    const emailEl=document.getElementById('login-email');
    if(emailEl){ emailEl.value=savedEmail; }
    const remEl=document.getElementById('login-remember');
    if(remEl){ remEl.checked=true; }
  }
  document.getElementById('login-screen').classList.add('visible');
  document.body.classList.remove('app-ready');
};

/* ── Funções legadas de perfil — mantidas para compatibilidade ── */
function hashPin(pin){return btoa('gst:'+pin);}

let DATA=loadData();
