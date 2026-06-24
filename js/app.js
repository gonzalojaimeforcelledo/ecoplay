/* ============================================
   ECOPLAY — App Logic
   ============================================ */

// ===== STATE =====
const state = {
  coins: 0,
  xp: 0,
  level: 1,
  history: [],
  actionCounts: {},
  achievements: {
    firstSeed: false,
    ecoInit: false,
    collector: false,
    diverse: false,
    weekStreak: false,
    firstRedeem: false,
  }
};

const LEVELS = [
  { name: 'Semilla Verde',   xpRequired: 0   },
  { name: 'Brote Activo',    xpRequired: 100  },
  { name: 'Guardián Eco',    xpRequired: 250  },
  { name: 'Héroe del Bosque',xpRequired: 500  },
  { name: 'EcoMaestro',      xpRequired: 900  },
  { name: 'Leyenda Verde',   xpRequired: 1500 },
];

const ACTION_NAMES = {
  plastico:    { name: 'Reciclé plástico',           emoji: '🧴' },
  vidrio:      { name: 'Reciclé vidrio',              emoji: '🫙' },
  papel:       { name: 'Reciclé papel/cartón',        emoji: '📦' },
  metal:       { name: 'Reciclé metal/latas',         emoji: '🥫' },
  organico:    { name: 'Composté residuos orgánicos', emoji: '🍃' },
  electronico: { name: 'Entregué electrónicos',       emoji: '📱' },
  bicicleta:   { name: 'Usé bicicleta',               emoji: '🚲' },
  bolsa:       { name: 'Usé bolsa reutilizable',      emoji: '🛍️' },
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupNav();
  setupActionCards();
  setupRedeemButtons();
  animateStats();
  renderHistory();
  updateAllUI();
  drawParticles();
});

// ===== LOCAL STORAGE =====
function saveState() {
  localStorage.setItem('ecoplay_state', JSON.stringify(state));
}
function loadState() {
  const saved = localStorage.getItem('ecoplay_state');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  }
}

// ===== NAVIGATION =====
function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabId) {
  // Hide all
  document.querySelectorAll('.hero, .page-section').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  // Show target
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.remove('hidden');

  // Activate nav button
  const navBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Update coins display in rewards
  document.getElementById('coins-display').textContent = state.coins.toLocaleString();
  updateRedeemButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ACTION CARDS =====
function setupActionCards() {
  document.querySelectorAll('.action-card').forEach(card => {
    const btn = card.querySelector('.btn-register');
    btn.addEventListener('click', () => registerAction(card));
  });
}

function registerAction(card) {
  const actionId  = card.dataset.action;
  const coins     = parseInt(card.dataset.coins);
  const xp        = parseInt(card.dataset.xp);
  const info      = ACTION_NAMES[actionId];

  // Update state
  state.coins += coins;
  state.xp    += xp;
  state.actionCounts[actionId] = (state.actionCounts[actionId] || 0) + 1;

  // Log history
  state.history.unshift({
    action: info.name,
    emoji:  info.emoji,
    coins,
    time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  });
  if (state.history.length > 20) state.history.pop();

  // Visual feedback
  triggerCoinRain(card);
  showToast(`+${coins} EcoCoins · +${xp} XP`);
  pulseCard(card);
  checkLevelUp();
  checkAchievements();
  renderHistory();
  updateAllUI();
  saveState();
}

// ===== LEVEL SYSTEM =====
function checkLevelUp() {
  let newLevel = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (state.xp >= LEVELS[i].xpRequired) { newLevel = i + 1; break; }
  }
  if (newLevel > state.level) {
    state.level = newLevel;
    showToast(`🎉 ¡Subiste al nivel ${newLevel}: ${LEVELS[newLevel-1].name}!`);
  }
}

function updateLevelUI() {
  const lvl       = Math.min(state.level, LEVELS.length);
  const levelData = LEVELS[lvl - 1];
  const nextData  = LEVELS[Math.min(lvl, LEVELS.length - 1)];
  const xpStart   = levelData.xpRequired;
  const xpEnd     = nextData.xpRequired > xpStart ? nextData.xpRequired : xpStart + 200;
  const progress  = lvl >= LEVELS.length ? 100 : Math.min(100, ((state.xp - xpStart) / (xpEnd - xpStart)) * 100);

  document.getElementById('user-level').textContent  = lvl;
  document.getElementById('level-title').textContent = levelData.name;
  document.getElementById('xp-bar').style.width      = progress + '%';
  document.getElementById('xp-current').textContent  = state.xp;
  document.getElementById('xp-next').textContent     = lvl >= LEVELS.length ? '∞' : xpEnd;
}

// ===== ACHIEVEMENTS =====
function checkAchievements() {
  const totalActions = Object.values(state.actionCounts).reduce((a,b) => a+b, 0);
  const uniqueTypes  = Object.keys(state.actionCounts).length;

  if (totalActions >= 1 && !state.achievements.firstSeed) {
    state.achievements.firstSeed = true;
    unlockAchievement(0, '🌱 ¡Logro desbloqueado: Primera semilla!');
  }
  if (totalActions >= 10 && !state.achievements.ecoInit) {
    state.achievements.ecoInit = true;
    unlockAchievement(1, '🌿 ¡Logro desbloqueado: Eco Iniciado!');
  }
  if (state.coins >= 500 && !state.achievements.collector) {
    state.achievements.collector = true;
    unlockAchievement(2, '🪙 ¡Logro: Coleccionista desbloqueado!');
  }
  if (uniqueTypes >= 5 && !state.achievements.diverse) {
    state.achievements.diverse = true;
    unlockAchievement(3, '🌍 ¡Logro: Diversificado desbloqueado!');
  }
}

function unlockAchievement(idx, msg) {
  const achs = document.querySelectorAll('.achievement');
  if (achs[idx]) {
    achs[idx].classList.remove('locked');
    achs[idx].classList.add('unlocked');
    const lockIcon = achs[idx].querySelector('.ach-icon');
    if (lockIcon && lockIcon.textContent === '🔒') {
      lockIcon.textContent = ['🌱','🌿','🪙','🌍','🔥','🎁'][idx] || '⭐';
    }
  }
  setTimeout(() => showToast(msg), 800);
}

// ===== REDEEM =====
function setupRedeemButtons() {
  document.querySelectorAll('.btn-redeem').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.reward-card');
      const cost = parseInt(card.dataset.cost);
      const name = card.dataset.name;
      if (state.coins >= cost) {
        state.coins -= cost;
        if (!state.achievements.firstRedeem) {
          state.achievements.firstRedeem = true;
          unlockAchievement(5, '🎁 ¡Logro: Primer Canje desbloqueado!');
        }
        showToast(`✅ ¡Canjeaste: ${name}!`);
        triggerCoinRainReverse();
        updateAllUI();
        saveState();
      } else {
        showToast(`⚠ EcoCoins insuficientes. Te faltan ${cost - state.coins}.`);
      }
    });
  });
}

function updateRedeemButtons() {
  document.querySelectorAll('.reward-card').forEach(card => {
    const cost = parseInt(card.dataset.cost);
    const btn  = card.querySelector('.btn-redeem');
    if (state.coins >= cost) {
      btn.classList.remove('disabled');
      btn.textContent = 'Canjear';
    } else {
      btn.classList.add('disabled');
      btn.textContent = `Faltan ${cost - state.coins} 🪙`;
    }
  });
}

// ===== HISTORY =====
function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (state.history.length === 0) {
    list.innerHTML = '<li class="history-empty">Aún no has registrado acciones. ¡Empieza ahora!</li>';
    return;
  }
  list.innerHTML = state.history.slice(0, 8).map(item => `
    <li class="history-item">
      <span class="history-emoji">${item.emoji}</span>
      <div class="history-text">
        <div class="history-action">${item.action}</div>
        <div class="history-time">Hoy ${item.time}</div>
      </div>
      <span class="history-coins">+${item.coins} 🪙</span>
    </li>
  `).join('');
}

// ===== UPDATE ALL UI =====
function updateAllUI() {
  // Header coins
  document.getElementById('header-coins').textContent = state.coins.toLocaleString();
  // Coins display in recompensas tab
  document.getElementById('coins-display').textContent = state.coins.toLocaleString();
  // Ranking your coins
  document.getElementById('rank-your-coins').textContent = `🪙 ${state.coins.toLocaleString()}`;
  // Level
  updateLevelUI();
  // Redeem buttons
  updateRedeemButtons();
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  msgEl.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== COIN RAIN =====
function triggerCoinRain(sourceCard) {
  const container = document.getElementById('coin-rain');
  const rect      = sourceCard.getBoundingClientRect();
  const cx        = rect.left + rect.width / 2;

  for (let i = 0; i < 8; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin-particle';
    coin.textContent = '🪙';
    coin.style.left = (cx + (Math.random() - 0.5) * 120) + 'px';
    coin.style.top  = (rect.top + window.scrollY - 40) + 'px';
    coin.style.animationDelay = (Math.random() * 0.4) + 's';
    container.appendChild(coin);
    setTimeout(() => coin.remove(), 1800);
  }
}

function triggerCoinRainReverse() {
  const container = document.getElementById('coin-rain');
  for (let i = 0; i < 5; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin-particle';
    coin.textContent = '✨';
    coin.style.left = (Math.random() * window.innerWidth) + 'px';
    coin.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(coin);
    setTimeout(() => coin.remove(), 1800);
  }
}

// ===== PULSE CARD =====
function pulseCard(card) {
  card.style.transform = 'scale(1.05)';
  card.style.borderColor = 'var(--green-light)';
  setTimeout(() => {
    card.style.transform = '';
    card.style.borderColor = '';
  }, 400);
}

// ===== ANIMATE STATS =====
function animateStats() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current  = 0;
    const step   = Math.ceil(target / 80);
    const timer  = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current.toLocaleString();
    }, 18);
  });
}

// ===== PARTICLE CANVAS =====
function drawParticles() {
  const canvas  = document.getElementById('particles-canvas');
  const ctx     = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const PARTICLES = Array.from({ length: 28 }, () => ({
    x:    Math.random() * W,
    y:    Math.random() * H,
    r:    2 + Math.random() * 4,
    vx:   (Math.random() - 0.5) * 0.4,
    vy:   -0.2 - Math.random() * 0.3,
    alpha: 0.15 + Math.random() * 0.25,
    color: ['#75975e','#658354','#8D6E63','#D7CCC8'][Math.floor(Math.random()*4)]
  }));

  function loop() {
    ctx.clearRect(0, 0, W, H);
    PARTICLES.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  loop();
}
