import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         sendPasswordResetEmail, signOut, onAuthStateChanged,
         browserLocalPersistence, browserSessionPersistence, setPersistence }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, enableMultiTabIndexedDbPersistence,
         doc, setDoc, getDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5WvpRa8eOfMbn-wdGK1wWhONsyu9tcMI",
  authDomain: "meus-gastos-81e64.firebaseapp.com",
  projectId: "meus-gastos-81e64",
  storageBucket: "meus-gastos-81e64.firebasestorage.app",
  messagingSenderId: "948831628912",
  appId: "1:948831628912:web:e7e1c0671479b86b07ceb5",
  measurementId: "G-K8VJ1HKS98"
};

const fbApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(fbApp);
window._fbAnalytics = analytics;
window._fbLogEvent = logEvent;
logEvent(analytics, 'page_view', { page_title: 'Meus Gastos', page_location: window.location.href });
const auth  = getAuth(fbApp);

// Firestore com persistência offline — API estável
const db = getFirestore(fbApp);
enableMultiTabIndexedDbPersistence(db).catch(err => {
  // 'failed-precondition' = múltiplas abas sem suporte a multi-tab (fallback ok)
  // 'unimplemented' = navegador não suporta IndexedDB (fallback ok)
  console.warn('[Firestore] Persistência offline limitada:', err.code);
});

// Define persistência local (mantém login após fechar app)
setPersistence(auth, browserLocalPersistence).catch(()=>{});

window._fbAuth = auth;
window._fbDb   = db;
window._fbFns  = {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence, browserSessionPersistence,
  doc, setDoc, getDoc, onSnapshot
};

// Observer de auth
onAuthStateChanged(auth, async user => {
  window._fbUser = user || null;
  const splash = document.getElementById('splash-screen');
  if(splash) splash.style.display = 'none';
  if(user){
    logEvent(analytics, 'login', { method: 'email' });
    // Aguarda o token JWT estar pronto antes de qualquer chamada ao Firestore
    // Sem isso, getDoc trava silenciosamente pois o SDK ainda não propagou a sessão
    try { await user.getIdToken(true); } catch(e) { console.warn('[Auth] getIdToken falhou:', e); }
    window._onFbLogin && window._onFbLogin(user);
  } else {
    window._onFbLogout && window._onFbLogout();
  }
});
