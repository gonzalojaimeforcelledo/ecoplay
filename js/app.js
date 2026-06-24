/* ============================================
   KAWSAY APP — Lógica completa
   ============================================ */

// ================================================================
// STATE & CONSTANTS
// ================================================================
let currentUser  = null;  // { email, name, lastname, district, initials }
let pendingCard  = null;  // card element waiting for photo validation

const LEVELS = [
  { name: 'Semilla Verde',    xpRequired: 0    },
  { name: 'Brote Activo',     xpRequired: 100  },
  { name: 'Guardián Eco',     xpRequired: 250  },
  { name: 'Héroe del Bosque', xpRequired: 500  },
  { name: 'EcoMaestro',       xpRequired: 900  },
  { name: 'Leyenda Verde',    xpRequired: 1500 },
];

const ACTION_MAP = {
  plastico:    { name: 'Reciclé plástico',               emoji: '🧴' },
  vidrio:      { name: 'Reciclé vidrio',                  emoji: '🫙' },
  papel:       { name: 'Reciclé papel / cartón',          emoji: '📦' },
  metal:       { name: 'Reciclé metal / latas',           emoji: '🥫' },
  organico:    { name: 'Composté residuos orgánicos',     emoji: '🍃' },
  electronico: { name: 'Entregué electrónicos',           emoji: '📱' },
  bicicleta:   { name: 'Usé bicicleta / transporte eco',  emoji: '🚲' },
  bolsa:       { name: 'Usé bolsa reutilizable',          emoji: '🛍️' },
};

const ACH_META = {
  firstSeed:  { icon: '🌱', label: 'Primera semilla' },
  ecoInit:    { icon: '🌿', label: 'Eco Iniciado'    },
  collector:  { icon: '🪙', label: 'Coleccionista'   },
  diverse:    { icon: '🌍', label: 'Diversificado'   },
  photoPro:   { icon: '📸', label: 'Fotógrafo Eco'   },
  firstRedeem:{ icon: '🎁', label: 'Primer Canje'    },
};

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  drawParticles();
  setupAuthEnterKey();
  checkSession();
});

// ================================================================
// SESSION
// ================================================================
function checkSession() {
  const saved = localStorage.getItem('kawsay_session');
  if (saved) {
    currentUser = JSON.parse(saved);
    showApp();
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  initApp();
}

// ================================================================
// AUTH
// ================================================================
function showAuthTab(tab) {
  document.getElementById('auth-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('auth-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login-btn').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register-btn').classList.toggle('active', tab === 'register');
  clearAuthErrors();
}

function clearAuthErrors() {
  ['login-error','reg-error'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.textContent = '';
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;

  if (!email || !pass) return showError('login-error', 'Por favor completa todos los campos.');

  const users = getUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user)         return showError('login-error', 'No existe una cuenta con ese correo.');
  if (user.pass !== btoa(pass)) return showError('login-error', 'Contraseña incorrecta.');

  currentUser = { email: user.email, name: user.name, lastname: user.lastname, district: user.district, initials: user.initials };
  localStorage.setItem('kawsay_session', JSON.stringify(currentUser));
  showApp();
}

function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const lastname = document.getElementById('reg-lastname').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pass     = document.getElementById('reg-pass').value;
  const pass2    = document.getElementById('reg-pass2').value;
  const district = document.getElementById('reg-district').value;

  if (!name || !lastname || !email || !pass || !pass2 || !district)
    return showError('reg-error', 'Por favor completa todos los campos.');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError('reg-error', 'Ingresa un correo electrónico válido.');

  if (pass.length < 6)
    return showError('reg-error', 'La contraseña debe tener al menos 6 caracteres.');

  if (pass !== pass2)
    return showError('reg-error', 'Las contraseñas no coinciden.');

  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return showError('reg-error', 'Ya existe una cuenta con ese correo.');

  const initials = (name[0] + lastname[0]).toUpperCase();
  const newUser  = { email, name, lastname, district, pass: btoa(pass), initials };
  users.push(newUser);
  saveUsers(users);

  // Init user data
  const userState = defaultState();
  localStorage.setItem(`kawsay_data_${email}`, JSON.stringify(userState));

  currentUser = { email, name, lastname, district, initials };
  localStorage.setItem('kawsay_session', JSON.stringify(currentUser));
  showApp();
}

function doLogout() {
  localStorage.removeItem('kawsay_session');
  currentUser = null;
  pendingCard = null;
  document.getElementById('user-dropdown').classList.add('hidden');
  showAuthScreen();
  // reset form fields
  ['login-email','login-pass','reg-name','reg-lastname','reg-email','reg-pass','reg-pass2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('reg-district').value = '';
  showAuthTab('login');
}

function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('hidden');
}
document.addEventListener('click', e => {
  const menu = document.getElementById('user-dropdown');
  if (menu && !menu.classList.contains('hidden')) {
    if (!e.target.closest('.avatar-menu')) menu.classList.add('hidden');
  }
});

function setupAuthEnterKey() {
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('reg-pass2').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
}

// ================================================================
// USER DATA STORAGE
// ================================================================
function defaultState() {
  return { coins: 0, xp: 0, level: 1, history: [], actionCounts: {}, achievements: {}, redeemed: [] };
}

function getUsers() {
  return JSON.parse(localStorage.getItem('kawsay_users') || '[]');
}
function saveUsers(users) {
  localStorage.setItem('kawsay_users', JSON.stringify(users));
}

function getUserState() {
  const raw = localStorage.getItem(`kawsay_data_${currentUser.email}`);
  return raw ? JSON.parse(raw) : defaultState();
}
function saveUserState(state) {
  localStorage.setItem(`kawsay_data_${currentUser.email}`, JSON.stringify(state));
}

// ================================================================
// APP INIT
// ================================================================
function initApp() {
  // Header user info
  document.getElementById('user-avatar').textContent    = currentUser.initials;
  document.getElementById('dropdown-name').textContent  = `${currentUser.name} ${currentUser.lastname}`;
  document.getElementById('dropdown-email').textContent = currentUser.email;
  document.getElementById('welcome-name').textContent   = currentUser.name;
  document.getElementById('rank-your-name').textContent = `(${currentUser.name})`;
  document.getElementById('rank-avatar-you').textContent = currentUser.initials;

  setupNav();
  setupActionCards();
  setupRedeemButtons();
  setupStoreFilters();
  setupPhotoInput();
  animateStats();
  updateAllUI();
  switchTab('inicio');
}

// ================================================================
// NAVIGATION
// ================================================================
function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.hero, .page-section').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.remove('hidden');

  const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  if (tabId === 'recompensas') updateRedeemButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// ACTION CARDS — PHOTO VALIDATION FLOW
// ================================================================
function setupActionCards() {
  document.querySelectorAll('.action-card').forEach(card => {
    card.querySelector('.btn-register').addEventListener('click', () => openPhotoModal(card));
  });
}

function openPhotoModal(card) {
  pendingCard = card;
  const info  = ACTION_MAP[card.dataset.action];
  document.getElementById('modal-action-icon').textContent = info.emoji;
  document.getElementById('modal-action-name').textContent = info.name;
  document.getElementById('modal-coins-val').textContent   = card.dataset.coins;
  document.getElementById('modal-xp-val').textContent      = card.dataset.xp;

  // Reset photo state
  document.getElementById('photo-input').value = '';
  document.getElementById('photo-preview-wrap').classList.add('hidden');
  document.getElementById('photo-upload-area').classList.remove('hidden');
  const btnValidate = document.getElementById('btn-validate');
  btnValidate.disabled = true;
  btnValidate.classList.remove('ready');
  btnValidate.querySelector('span').textContent = '🔒 Sube tu foto para validar';

  document.getElementById('photo-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePhotoModal() {
  document.getElementById('photo-modal').classList.add('hidden');
  document.body.style.overflow = '';
  pendingCard = null;
}

function setupPhotoInput() {
  document.getElementById('photo-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠ El archivo es demasiado grande. Máx. 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('photo-preview').src = ev.target.result;
      document.getElementById('photo-preview-wrap').classList.remove('hidden');
      document.getElementById('photo-upload-area').classList.add('hidden');

      const btn = document.getElementById('btn-validate');
      btn.disabled = false;
      btn.classList.add('ready');
      btn.querySelector('span').textContent = '✅ Validar y ganar EcoCoins';

      // Store data URL for history thumbnail
      btn.dataset.photoData = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function validateAndRegister() {
  if (!pendingCard) return;
  const btn = document.getElementById('btn-validate');
  if (btn.disabled) return;

  const card      = pendingCard;
  const actionId  = card.dataset.action;
  const coins     = parseInt(card.dataset.coins);
  const xp        = parseInt(card.dataset.xp);
  const info      = ACTION_MAP[actionId];
  const photoData = btn.dataset.photoData || null;

  const state = getUserState();
  state.coins += coins;
  state.xp    += xp;
  state.actionCounts[actionId] = (state.actionCounts[actionId] || 0) + 1;

  state.history.unshift({
    action:    info.name,
    emoji:     info.emoji,
    coins,
    photoThumb: photoData,
    time:      new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    date:      new Date().toLocaleDateString('es-PE'),
    validated: true,
  });
  if (state.history.length > 30) state.history.pop();

  checkLevelUp(state);
  checkAchievements(state);
  saveUserState(state);

  closePhotoModal();
  triggerCoinRain();
  showToast(`🌿 +${coins} EcoCoins · +${xp} XP ¡Validado!`);
  pulseCard(card);
  renderHistory(state);
  updateAllUI();
}

// ================================================================
// LEVEL SYSTEM
// ================================================================
function checkLevelUp(state) {
  let newLevel = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (state.xp >= LEVELS[i].xpRequired) { newLevel = i + 1; break; }
  }
  if (newLevel > state.level) {
    state.level = newLevel;
    setTimeout(() => showToast(`🎉 ¡Nivel ${newLevel}: ${LEVELS[newLevel-1].name}!`), 600);
  }
}

function updateLevelUI(state) {
  const lvl      = Math.min(state.level, LEVELS.length);
  const data     = LEVELS[lvl - 1];
  const nextData = LEVELS[Math.min(lvl, LEVELS.length - 1)];
  const xpStart  = data.xpRequired;
  const xpEnd    = nextData.xpRequired > xpStart ? nextData.xpRequired : xpStart + 200;
  const progress = lvl >= LEVELS.length ? 100 : Math.min(100, ((state.xp - xpStart) / (xpEnd - xpStart)) * 100);

  document.getElementById('user-level').textContent  = lvl;
  document.getElementById('level-title').textContent = data.name;
  document.getElementById('xp-bar').style.width      = progress + '%';
  document.getElementById('xp-current').textContent  = state.xp;
  document.getElementById('xp-next').textContent     = lvl >= LEVELS.length ? '∞' : xpEnd;
}

// ================================================================
// ACHIEVEMENTS
// ================================================================
function checkAchievements(state) {
  const total   = Object.values(state.actionCounts).reduce((a,b) => a+b, 0);
  const unique  = Object.keys(state.actionCounts).length;
  const photos  = state.history.filter(h => h.validated && h.photoThumb).length;

  const unlock = (key) => {
    if (!state.achievements[key]) {
      state.achievements[key] = true;
      const m = ACH_META[key];
      setTimeout(() => showToast(`${m.icon} ¡Logro desbloqueado: ${m.label}!`), 1000);
    }
  };

  if (total  >= 1)  unlock('firstSeed');
  if (total  >= 10) unlock('ecoInit');
  if (state.coins >= 500) unlock('collector');
  if (unique >= 5)  unlock('diverse');
  if (photos >= 5)  unlock('photoPro');
}

function renderAchievements(state) {
  document.querySelectorAll('.achievement[data-ach]').forEach(el => {
    const key = el.dataset.ach;
    if (state.achievements[key]) {
      el.classList.remove('locked');
      el.classList.add('unlocked');
      el.querySelector('.ach-icon').textContent = ACH_META[key].icon;
      el.querySelector('.ach-name').textContent = ACH_META[key].label;
    }
  });
}

// ================================================================
// HISTORY
// ================================================================
function renderHistory(state) {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (!state.history.length) {
    list.innerHTML = '<li class="history-empty">Aún no has registrado acciones validadas. ¡Empieza ahora!</li>';
    return;
  }
  list.innerHTML = state.history.slice(0, 10).map(item => `
    <li class="history-item">
      ${item.photoThumb
        ? `<img class="history-photo-thumb" src="${item.photoThumb}" alt="Evidencia">`
        : `<span class="history-emoji">${item.emoji}</span>`
      }
      <div class="history-text">
        <div class="history-action">${item.emoji} ${item.action}</div>
        <div class="history-time">${item.date} · ${item.time}</div>
        ${item.validated ? '<div class="history-validated">✅ Evidencia validada</div>' : ''}
      </div>
      <span class="history-coins">+${item.coins} 🪙</span>
    </li>
  `).join('');
}

// ================================================================
// REDEEM
// ================================================================
function setupRedeemButtons() {
  document.querySelectorAll('.btn-redeem').forEach(btn => {
    btn.addEventListener('click', () => {
      const card  = btn.closest('.reward-card');
      const cost  = parseInt(card.dataset.cost);
      const name  = card.dataset.name;
      const store = card.dataset.store;
      const state = getUserState();

      if (state.coins < cost) {
        showToast(`⚠ Te faltan ${cost - state.coins} EcoCoins para este canje.`);
        return;
      }

      state.coins -= cost;
      if (!state.achievements['firstRedeem']) {
        state.achievements['firstRedeem'] = true;
        setTimeout(() => showToast('🎁 ¡Logro desbloqueado: Primer Canje!'), 800);
      }

      const code = 'KAW-' + Math.random().toString(36).substring(2,6).toUpperCase();
      state.redeemed = state.redeemed || [];
      state.redeemed.push({ name, store, code, date: new Date().toLocaleDateString('es-PE') });

      checkAchievements(state);
      saveUserState(state);
      updateAllUI();
      showRedeemModal(name, store, code);
    });
  });
}

function updateRedeemButtons() {
  const state = getUserState();
  document.querySelectorAll('.reward-card').forEach(card => {
    const cost = parseInt(card.dataset.cost);
    const btn  = card.querySelector('.btn-redeem');
    if (state.coins >= cost) {
      btn.classList.remove('cant-afford');
      btn.textContent = 'Canjear';
    } else {
      btn.classList.add('cant-afford');
      btn.textContent = `Faltan ${cost - state.coins} 🪙`;
    }
  });
}

function showRedeemModal(name, store, code) {
  document.getElementById('redeem-desc').textContent     = `Has canjeado: "${name}" en ${store}.`;
  document.getElementById('redeem-code').textContent     = code;
  document.getElementById('redeem-store-info').textContent = `Válido en: ${store}`;
  document.getElementById('redeem-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeRedeemModal() {
  document.getElementById('redeem-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ================================================================
// STORE FILTERS
// ================================================================
function setupStoreFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.store-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });
}

// ================================================================
// UPDATE ALL UI
// ================================================================
function updateAllUI() {
  const state = getUserState();
  document.getElementById('header-coins').textContent  = state.coins.toLocaleString();
  document.getElementById('coins-display').textContent = state.coins.toLocaleString();
  document.getElementById('rank-your-coins').textContent = `🪙 ${state.coins.toLocaleString()}`;
  updateLevelUI(state);
  updateRedeemButtons();
  renderHistory(state);
  renderAchievements(state);
}

// ================================================================
// VISUAL FX
// ================================================================
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

function triggerCoinRain() {
  const container = document.getElementById('coin-rain');
  for (let i = 0; i < 12; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin-particle';
    coin.textContent = ['🪙','🌿','♻'][Math.floor(Math.random()*3)];
    coin.style.left  = (Math.random() * window.innerWidth) + 'px';
    coin.style.animationDelay = (Math.random() * 0.6) + 's';
    container.appendChild(coin);
    setTimeout(() => coin.remove(), 2000);
  }
}

function pulseCard(card) {
  card.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
  card.style.transform  = 'scale(1.06)';
  card.style.boxShadow  = '0 8px 32px rgba(75,96,67,0.25)';
  setTimeout(() => { card.style.transform = ''; card.style.boxShadow = ''; }, 350);
}

function animateStats() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current  = 0;
    const step   = Math.ceil(target / 70);
    const t      = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(t); }
      el.textContent = current.toLocaleString();
    }, 20);
  });
}

// ================================================================
// PARTICLE CANVAS
// ================================================================
function drawParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

  const pts = Array.from({ length: 30 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: 1.5 + Math.random() * 3.5,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.15 - Math.random() * 0.28,
    a: 0.12 + Math.random() * 0.22,
    c: ['#75975e','#658354','#8D6E63','#D7CCC8'][Math.floor(Math.random()*4)],
  }));

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.c; ctx.globalAlpha = p.a; ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
      if (p.x < -8) p.x = W + 8;
      if (p.x > W + 8) p.x = -8;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  })();
}
