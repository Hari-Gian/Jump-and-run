import { levels, skins, drawPlatforms } from './objects.js';
import { createMusicPlayer } from './music.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const screens = [...document.querySelectorAll('.screen')];
const levelGrid = document.getElementById('level-grid');
const shopGrid = document.getElementById('shop-grid');
const levelComplete = document.getElementById('level-complete');
const trapToast = document.getElementById('trap-toast');
const playerImage = new Image();
const jumpSound = new Audio('./sounds/mi-bombo-duolingo.mp3');
const musicToggle = document.getElementById('music-toggle');
const paymentDialog = document.getElementById('payment-dialog');

playerImage.src = './bilderundso/jamacia.png';
jumpSound.volume = 0.3;

function updateMusicUI(state) {
  const title = musicToggle.querySelector('strong');
  title.textContent = state.muted ? 'Music off' : 'Music on';
  document.getElementById('music-track').textContent = state.trackName;
  musicToggle.setAttribute('aria-label', state.muted ? 'Turn music on' : 'Turn music off');
  musicToggle.classList.toggle('is-muted', state.muted);
}

const music = createMusicPlayer(updateMusicUI);
music.setLobby();

const player = {
  x: 35,
  y: 497,
  width: 48,
  height: 48,
  speed: 5.65,
  vx: 0,
  vy: 0
};

const visualPlayer = {
  x: player.x,
  y: player.y,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
};

const keys = { left: false, right: false };
let currentLevelIndex = 0;
let runtime = null;
let cameraX = 0;
let isOnGround = false;
let gameRunning = false;
let levelFinished = false;
let isDead = false;
let startTime = 0;
let elapsedBeforeFinish = 0;
let deaths = 0;
let runCoins = 0;
let lastFrame = 0;
let deathTimer = null;
let toastTimer = null;
let lastGroundedAt = 0;
let jumpBufferedUntil = 0;
let activeCheckpointIndex = -1;
let checkpoints = [];
let particles = [];
let standingPlatform = null;

function defaultSave() {
  return {
    version: 2,
    coins: 0,
    equippedSkin: 'classic',
    ownedSkins: ['classic'],
    progress: {},
    collected: {}
  };
}

function readSave() {
  const fallback = defaultSave();

  try {
    const saved = JSON.parse(localStorage.getItem('jamaicaDashSave'));
    if (saved && typeof saved === 'object') {
      return {
        ...fallback,
        ...saved,
        ownedSkins: Array.isArray(saved.ownedSkins) ? saved.ownedSkins : ['classic'],
        progress: saved.progress || {},
        collected: saved.collected || {}
      };
    }

    const oldProgress = JSON.parse(localStorage.getItem('jamaicaDashProgress')) || {};
    Object.entries(oldProgress).forEach(([index, bestTime]) => {
      fallback.progress[index] = { bestTime };
    });
  } catch {
    return fallback;
  }

  return fallback;
}

let gameSave = readSave();

function writeSave() {
  try {
    localStorage.setItem('jamaicaDashSave', JSON.stringify(gameSave));
  } catch {
    // Saving is optional; the game still runs when storage is unavailable.
  }
}

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateWallets() {
  document.querySelectorAll('[data-wallet]').forEach((wallet) => {
    wallet.textContent = gameSave.coins;
  });
}

function renderLevelCards() {
  const clearedCount = Object.keys(gameSave.progress).length;
  document.getElementById('completed-count').textContent = clearedCount;

  levelGrid.innerHTML = levels.map((level, index) => {
    const result = gameSave.progress[index];
    const bestTime = result?.bestTime;
    const clearedClass = result ? ' is-complete' : '';
    const number = String(index + 1).padStart(2, '0');
    const length = (level.worldWidth / 1000).toFixed(1);

    return `
      <button class="level-card${clearedClass}" data-level="${index}" type="button"
        style="--level-sky:${level.sky[0]};--level-ground:${level.platformColor};--level-accent:${level.accentColor}">
        <span class="level-number">${number}</span>
        <span class="level-card-art" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
        <span class="level-info">
          <span><small>${level.difficulty}</small><strong>${level.name}</strong></span>
          <span class="level-arrow" aria-hidden="true">&rarr;</span>
        </span>
        <span class="level-meta"><span>${length} km</span><span>${bestTime ? `Best ${formatTime(bestTime)}` : `+${level.reward} coins`}</span></span>
      </button>`;
  }).join('');
}

function renderShop() {
  shopGrid.innerHTML = skins.map((skin) => {
    const owned = gameSave.ownedSkins.includes(skin.id);
    const equipped = gameSave.equippedSkin === skin.id;
    const canAfford = gameSave.coins >= skin.cost;
    let action = `${skin.cost} coins`;
    if (skin.cost === 0 && !owned) action = 'Get free';
    if (owned) action = 'Equip';
    if (equipped) action = 'Equipped';

    return `
      <article class="shop-card${equipped ? ' is-equipped' : ''}" style="--skin-main:${skin.colors[0]};--skin-dark:${skin.colors[1]};--skin-accent:${skin.accent}">
        <div class="skin-preview skin-preview--${skin.mark}" aria-hidden="true"><span></span><i></i><b></b></div>
        <div class="skin-copy">
          <small>${skin.rarity}${owned ? ' • Owned' : ''}</small>
          <h3>${skin.name}</h3>
        </div>
        <button class="button button--skin" data-skin="${skin.id}" type="button" ${(equipped || (!owned && !canAfford)) ? 'disabled' : ''}>
          ${action}
        </button>
      </article>`;
  }).join('');
}

function showScreen(screenId) {
  screens.forEach((screen) => {
    const isActive = screen.id === screenId;
    screen.hidden = !isActive;
    screen.classList.toggle('screen--active', isActive);
  });

  if (screenId !== 'game-screen') {
    keys.left = false;
    keys.right = false;
    gameRunning = false;
  } else {
    gameRunning = !levelFinished && !isDead;
  }

  if (screenId === 'level-screen') renderLevelCards();
  if (screenId === 'shop-screen') renderShop();
  if (screenId !== 'game-screen') music.setLobby();
  updateWallets();
}

function createRuntime() {
  const level = levels[currentLevelIndex];
  const alreadyCollected = new Set(gameSave.collected[currentLevelIndex] || []);

  return {
    platforms: level.platforms.map((item, index) => {
      const landingBonus = item.height < 70 ? 28 : 0;
      const adjustedX = item.x - landingBonus / 2;
      return {
        ...item,
        id: `platform-${index}`,
        x: adjustedX,
        width: item.width + landingBonus,
        baseX: adjustedX,
        baseY: item.y,
        active: true,
        warningAt: null,
        triggeredAt: null,
        fallSpeed: 0
      };
    }),
    hazards: level.hazards.map((item) => ({
      ...item,
      baseX: item.x,
      baseY: item.y,
      triggered: false,
      reveal: item.type === 'spike' && item.hidden ? 0 : 1,
      fallSpeed: 0
    })),
    coins: level.coins.map((item) => ({ ...item, collected: alreadyCollected.has(item.id) }))
  };
}

function buildCheckpoints(level) {
  const safePlatforms = level.platforms.filter((item) => item.type === 'solid' && item.width >= 150);
  return [0.34, 0.67].map((ratio) => {
    const target = level.worldWidth * ratio;
    const platform = safePlatforms.reduce((best, item) => {
      const distance = Math.abs(item.x + item.width / 2 - target);
      const bestDistance = Math.abs(best.x + best.width / 2 - target);
      return distance < bestDistance ? item : best;
    });
    return {
      x: platform.x + Math.min(80, platform.width * 0.3),
      y: platform.y - player.height,
      flagY: platform.y
    };
  });
}

function resetPlayer(countDeath = false) {
  if (countDeath) deaths += 1;
  document.getElementById('fall-display').textContent = deaths;

  const checkpoint = countDeath && activeCheckpointIndex >= 0 ? checkpoints[activeCheckpointIndex] : null;
  player.x = checkpoint?.x ?? 35;
  player.y = checkpoint?.y ?? levels[currentLevelIndex].platforms[0].y - player.height;
  player.vx = 0;
  player.vy = 0;
  cameraX = Math.max(0, player.x - 300);
  isOnGround = true;
  lastGroundedAt = performance.now();
  jumpBufferedUntil = 0;
  isDead = false;
  runtime = createRuntime();
  visualPlayer.x = player.x;
  visualPlayer.y = player.y;
  visualPlayer.scaleX = 1;
  visualPlayer.scaleY = 1;
  visualPlayer.rotation = 0;
  particles = [];
  standingPlatform = null;
  document.querySelector('.game-stage').classList.remove('is-hit');
  gameRunning = !document.getElementById('game-screen').hidden && !levelFinished;
}

function startLevel(index) {
  if (!Number.isInteger(index) || index < 0 || index >= levels.length) return;

  if (deathTimer) clearTimeout(deathTimer);
  currentLevelIndex = index;
  levelFinished = false;
  isDead = false;
  deaths = 0;
  runCoins = 0;
  activeCheckpointIndex = -1;
  checkpoints = buildCheckpoints(levels[index]);
  startTime = performance.now();
  elapsedBeforeFinish = 0;
  levelComplete.hidden = true;
  trapToast.hidden = true;

  const level = levels[index];
  music.setLevel(index);
  document.getElementById('current-level-number').textContent = `Level ${String(index + 1).padStart(2, '0')}`;
  document.getElementById('current-level-name').textContent = level.name;
  document.getElementById('fall-display').textContent = '0';
  document.getElementById('run-coin-display').textContent = '0';
  document.getElementById('time-display').textContent = '00:00';
  document.getElementById('next-level-button').innerHTML = index === levels.length - 1 ? 'Play again &#8635;' : 'Next level &rarr;';

  resetPlayer();
  showScreen('game-screen');
  requestAnimationFrame(() => canvas.focus());
}

function restartLevel() {
  startLevel(currentLevelIndex);
}

function jump() {
  if (!gameRunning) return;
  const now = performance.now();
  jumpBufferedUntil = now + 150;
  if (!isOnGround && now - lastGroundedAt > 130) return;

  player.vy = -12.5;
  isOnGround = false;
  standingPlatform = null;
  jumpBufferedUntil = 0;
  visualPlayer.scaleX = 0.86;
  visualPlayer.scaleY = 1.14;
  jumpSound.currentTime = 0;
  jumpSound.playbackRate = 1.35;
  jumpSound.play().catch(() => {});
}

function showTrapMessage(message) {
  if (toastTimer) clearTimeout(toastTimer);
  trapToast.classList.remove('trap-toast--checkpoint');
  trapToast.textContent = message;
  trapToast.hidden = false;
}

function showCheckpointMessage() {
  if (toastTimer) clearTimeout(toastTimer);
  trapToast.classList.add('trap-toast--checkpoint');
  trapToast.textContent = 'Checkpoint saved!';
  trapToast.hidden = false;
  toastTimer = setTimeout(() => {
    trapToast.hidden = true;
    trapToast.classList.remove('trap-toast--checkpoint');
  }, 1050);
}

function killPlayer(message) {
  if (isDead || levelFinished) return;
  isDead = true;
  gameRunning = false;
  keys.left = false;
  keys.right = false;
  showTrapMessage(message);
  document.querySelector('.game-stage').classList.add('is-hit');

  deathTimer = setTimeout(() => {
    trapToast.hidden = true;
    if (!document.getElementById('game-screen').hidden && !levelFinished) resetPlayer(true);
  }, 520);
}

function collectCoin(item) {
  if (item.collected) return;
  item.collected = true;
  runCoins += 1;
  gameSave.coins += 5;
  const collected = new Set(gameSave.collected[currentLevelIndex] || []);
  collected.add(item.id);
  gameSave.collected[currentLevelIndex] = [...collected];
  writeSave();
  updateWallets();
  document.getElementById('run-coin-display').textContent = runCoins;
}

function completeLevel() {
  if (levelFinished) return;
  const level = levels[currentLevelIndex];
  const previousResult = gameSave.progress[currentLevelIndex];
  const firstClear = !previousResult;

  levelFinished = true;
  gameRunning = false;
  elapsedBeforeFinish = performance.now() - startTime;
  gameSave.progress[currentLevelIndex] = {
    bestTime: previousResult ? Math.min(previousResult.bestTime, elapsedBeforeFinish) : elapsedBeforeFinish,
    bestDeaths: previousResult ? Math.min(previousResult.bestDeaths ?? deaths, deaths) : deaths
  };

  if (firstClear) gameSave.coins += level.reward;
  writeSave();
  updateWallets();

  document.getElementById('complete-summary').textContent =
    `${level.name} cleared in ${formatTime(elapsedBeforeFinish)} with ${deaths} ${deaths === 1 ? 'death' : 'deaths'}.`;
  document.getElementById('reward-summary').textContent = firstClear
    ? `+${level.reward} first-clear coins${runCoins ? ` • ${runCoins * 5} collected` : ''}`
    : `${runCoins ? `${runCoins * 5} coins collected` : 'Best time updated'}`;
  levelComplete.hidden = false;
  document.getElementById('next-level-button').focus();
}

function overlaps(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function updatePlatforms(timestamp, frameScale) {
  runtime.platforms.forEach((item) => {
    const previousX = item.x;
    const previousY = item.y;
    if (item.type === 'moving') {
      const offset = Math.sin(timestamp * item.speed * 0.78) * item.range * 0.86;
      item.x = item.axis === 'x' ? item.baseX + offset : item.baseX;
      item.y = item.axis === 'y' ? item.baseY + offset : item.baseY;
    }

    if (standingPlatform === item) {
      player.x += item.x - previousX;
      player.y += item.y - previousY;
    }

    if (item.type === 'fake' && item.warningAt === null && player.x + player.width > item.x - 170) {
      item.warningAt = timestamp;
    }

    if ((item.type === 'collapse' || item.type === 'fake') && item.triggeredAt !== null) {
      const safetyDelay = item.type === 'fake' ? 1050 : 700;
      if (timestamp - item.triggeredAt > (item.delay || 350) + safetyDelay) {
        item.fallSpeed += 0.46 * frameScale;
        item.y += item.fallSpeed * frameScale;
        if (item.y > canvas.height + 100) item.active = false;
      }
    }
  });
}

function updateHazards(timestamp, frameDelta) {
  runtime.hazards.forEach((hazard) => {
    if (hazard.type === 'spike') {
      if (!hazard.triggered && player.x + player.width > hazard.triggerX - 70) hazard.triggered = true;
      if (hazard.triggered) hazard.reveal = Math.min(1, hazard.reveal + frameDelta / 190);
      return;
    }

    if (hazard.type === 'saw') {
      const offset = Math.sin(timestamp * hazard.speed * 0.74) * hazard.range * 0.82;
      hazard.x = hazard.axis === 'x' ? hazard.baseX + offset : hazard.baseX;
      hazard.y = hazard.axis === 'y' ? hazard.baseY + offset : hazard.baseY;
      return;
    }

    if (hazard.type === 'drop') {
      if (!hazard.triggered && player.x + player.width > hazard.triggerX - 90) hazard.triggered = true;
      if (hazard.triggered && hazard.y < hazard.targetY) {
        const frameScale = Math.max(0.5, Math.min(1.8, frameDelta / (1000 / 60)));
        hazard.fallSpeed = Math.min(12, hazard.fallSpeed + 0.5 * frameScale);
        hazard.y = Math.min(hazard.targetY, hazard.y + hazard.fallSpeed * frameScale);
      }
    }
  });
}

function checkHazards() {
  for (const hazard of runtime.hazards) {
    if (hazard.type === 'spike' && hazard.reveal > 0.76) {
      const spikeHeight = hazard.height * hazard.reveal;
      if (overlaps(player, { x: hazard.x + 5, y: hazard.y - spikeHeight + 3, width: hazard.width - 10, height: spikeHeight - 3 })) {
        killPlayer('The floor had teeth.');
        return;
      }
    }

    if (hazard.type === 'drop' && overlaps(player, { ...hazard, x: hazard.x + 7, width: hazard.width - 14 })) {
      killPlayer('Heads up! Too late.');
      return;
    }

    if (hazard.type === 'saw') {
      const closestX = Math.max(player.x, Math.min(hazard.x, player.x + player.width));
      const closestY = Math.max(player.y, Math.min(hazard.y, player.y + player.height));
      const distance = Math.hypot(hazard.x - closestX, hazard.y - closestY);
      if (distance < hazard.radius - 9) {
        killPlayer('That saw was not decoration.');
        return;
      }
    }
  }
}

function spawnLandingParticles(x, y) {
  for (let index = 0; index < 7; index += 1) {
    particles.push({
      x: x + player.width / 2,
      y,
      vx: (index - 3) * 0.55 + (Math.random() - 0.5),
      vy: -1.4 - Math.random() * 1.5,
      life: 1,
      size: 3 + Math.random() * 4
    });
  }
}

function updateParticles(frameScale) {
  particles.forEach((particle) => {
    particle.x += particle.vx * frameScale;
    particle.y += particle.vy * frameScale;
    particle.vy += 0.1 * frameScale;
    particle.life -= 0.035 * frameScale;
  });
  particles = particles.filter((particle) => particle.life > 0);
}

function update(timestamp, frameDelta) {
  if (!gameRunning || !runtime) return;

  const frameScale = Math.max(0.5, Math.min(1.8, frameDelta / (1000 / 60)));

  updatePlatforms(timestamp, frameScale);
  updateHazards(timestamp, frameDelta);

  const targetVelocity = keys.left === keys.right ? 0 : (keys.left ? -player.speed : player.speed);
  const movementBlend = 1 - Math.pow(keys.left === keys.right ? 0.68 : 0.76, frameScale);
  player.vx += (targetVelocity - player.vx) * movementBlend;

  player.x += player.vx * frameScale;
  player.x = Math.max(0, Math.min(levels[currentLevelIndex].worldWidth - player.width, player.x));

  const previousBottom = player.y + player.height;
  const fallingVelocity = player.vy;
  player.vy += 0.5 * frameScale;
  player.y += player.vy * frameScale;
  isOnGround = false;
  standingPlatform = null;

  if (player.vy >= 0) {
    const landingPlatform = runtime.platforms.find((item) => {
      if (!item.active) return false;
      const horizontal = player.x + player.width - 7 > item.x && player.x + 7 < item.x + item.width;
      const crossedTop = previousBottom <= item.y + 5 && player.y + player.height >= item.y;
      return horizontal && crossedTop;
    });

    if (landingPlatform) {
      player.y = landingPlatform.y - player.height;
      player.vy = 0;
      isOnGround = true;
      standingPlatform = landingPlatform;
      lastGroundedAt = timestamp;
      if (fallingVelocity > 5.5) {
        visualPlayer.scaleX = 1.16;
        visualPlayer.scaleY = 0.84;
        spawnLandingParticles(player.x, landingPlatform.y);
      }
      if ((landingPlatform.type === 'collapse' || landingPlatform.type === 'fake') && landingPlatform.triggeredAt === null) {
        landingPlatform.triggeredAt = timestamp;
      }
    }
  }

  if (isOnGround && jumpBufferedUntil >= timestamp) jump();

  checkpoints.forEach((checkpoint, index) => {
    if (index > activeCheckpointIndex && player.x >= checkpoint.x) {
      activeCheckpointIndex = index;
      showCheckpointMessage();
    }
  });

  runtime.coins.forEach((item) => {
    if (!item.collected && overlaps(player, { x: item.x - 15, y: item.y - 15, width: 30, height: 30 })) collectCoin(item);
  });

  checkHazards();
  if (player.y > canvas.height + 80) killPlayer('The island opened beneath you.');

  const goal = levels[currentLevelIndex].goal;
  if (!isDead && overlaps(player, goal)) completeLevel();

  const maxCamera = Math.max(0, levels[currentLevelIndex].worldWidth - canvas.width);
  const targetCamera = Math.max(0, Math.min(maxCamera, player.x - 300));
  const cameraBlend = 1 - Math.pow(0.86, frameScale);
  cameraX += (targetCamera - cameraX) * cameraBlend;

  const visualBlend = 1 - Math.pow(0.58, frameScale);
  visualPlayer.x += (player.x - visualPlayer.x) * visualBlend;
  visualPlayer.y += (player.y - visualPlayer.y) * visualBlend;
  visualPlayer.scaleX += (1 - visualPlayer.scaleX) * (1 - Math.pow(0.76, frameScale));
  visualPlayer.scaleY += (1 - visualPlayer.scaleY) * (1 - Math.pow(0.76, frameScale));
  visualPlayer.rotation += (player.vx * 0.012 - visualPlayer.rotation) * (1 - Math.pow(0.72, frameScale));
  updateParticles(frameScale);

  const elapsed = performance.now() - startTime;
  document.getElementById('time-display').textContent = formatTime(elapsed);
  document.getElementById('level-progress-bar').style.width = `${Math.min(100, (player.x / goal.x) * 100)}%`;
}

function drawBackground(level) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, level.sky[0]);
  gradient.addColorStop(1, level.sky[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 202, 40, 0.78)';
  ctx.beginPath();
  ctx.arc(900 - cameraX * 0.035, 95, 50, 0, Math.PI * 2);
  ctx.fill();

  const parallax = -(cameraX * 0.12) % 720;
  ctx.fillStyle = 'rgba(7, 70, 48, 0.18)';
  for (let offset = parallax - 720; offset < canvas.width + 720; offset += 720) {
    ctx.beginPath();
    ctx.moveTo(offset, 500);
    ctx.lineTo(offset + 170, 250);
    ctx.lineTo(offset + 340, 500);
    ctx.lineTo(offset + 520, 300);
    ctx.lineTo(offset + 720, 500);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,.66)';
  const cloudShift = -(cameraX * 0.2) % 560;
  for (let offset = cloudShift - 560; offset < canvas.width + 300; offset += 560) {
    ctx.beginPath();
    ctx.arc(offset + 110, 110, 22, 0, Math.PI * 2);
    ctx.arc(offset + 140, 96, 30, 0, Math.PI * 2);
    ctx.arc(offset + 174, 110, 23, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpike(hazard, level) {
  const x = hazard.x - cameraX;
  const height = hazard.height * hazard.reveal;
  if (x + hazard.width < 0 || x > canvas.width) return;
  const count = Math.max(1, Math.round(hazard.width / 22));
  const width = hazard.width / count;
  ctx.fillStyle = level.accentColor;
  ctx.strokeStyle = '#071d16';
  ctx.lineWidth = 2;
  for (let index = 0; index < count; index += 1) {
    ctx.beginPath();
    ctx.moveTo(x + index * width, hazard.y);
    ctx.lineTo(x + index * width + width / 2, hazard.y - height);
    ctx.lineTo(x + (index + 1) * width, hazard.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawSaw(hazard, timestamp) {
  const x = hazard.x - cameraX;
  if (x + hazard.radius < 0 || x - hazard.radius > canvas.width) return;
  ctx.save();
  ctx.translate(x, hazard.y);
  ctx.rotate(timestamp * 0.006);
  ctx.fillStyle = '#e9eee9';
  ctx.strokeStyle = '#071d16';
  ctx.lineWidth = 4;
  const teeth = 12;
  ctx.beginPath();
  for (let index = 0; index < teeth * 2; index += 1) {
    const radius = index % 2 === 0 ? hazard.radius + 8 : hazard.radius;
    const angle = (Math.PI * 2 * index) / (teeth * 2);
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e55242';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHazards(level, timestamp) {
  runtime.hazards.forEach((hazard) => {
    if (hazard.type === 'spike') drawSpike(hazard, level);
    if (hazard.type === 'saw') drawSaw(hazard, timestamp);
    if (hazard.type === 'drop') {
      const x = hazard.x - cameraX;
      ctx.fillStyle = '#30282a';
      ctx.fillRect(x, hazard.y, hazard.width, hazard.height);
      ctx.fillStyle = level.accentColor;
      ctx.fillRect(x, hazard.y + hazard.height - 9, hazard.width, 9);
      ctx.strokeStyle = '#071d16';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, hazard.y, hazard.width, hazard.height);
    }
  });
}

function drawCoins(timestamp) {
  runtime.coins.forEach((item, index) => {
    if (item.collected) return;
    const x = item.x - cameraX;
    if (x < -30 || x > canvas.width + 30) return;
    const bob = Math.sin(timestamp * 0.005 + index) * 5;
    ctx.fillStyle = '#ffca28';
    ctx.strokeStyle = '#7e5600';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, item.y + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff2a6';
    ctx.fillRect(x - 2, item.y - 8 + bob, 4, 16);
  });
}

function drawGoal(goal, level) {
  const x = goal.x - cameraX;
  if (x > canvas.width + 100) return;
  ctx.fillStyle = level.accentColor;
  ctx.fillRect(x, goal.y, goal.width, goal.height);
  ctx.fillStyle = level.platformColor;
  ctx.fillRect(x + 10, goal.y + 12, goal.width - 20, goal.height - 12);
  ctx.fillStyle = '#fff8df';
  ctx.beginPath();
  ctx.arc(x + 45, goal.y + 52, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#071d16';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, goal.y, goal.width, goal.height);
}

function drawPlayer() {
  const skin = skins.find((item) => item.id === gameSave.equippedSkin) || skins[0];
  const x = -player.width / 2;
  const y = -player.height / 2;
  ctx.save();
  ctx.translate(visualPlayer.x - cameraX + player.width / 2, visualPlayer.y + player.height / 2);
  ctx.rotate(visualPlayer.rotation);
  ctx.scale(visualPlayer.scaleX, visualPlayer.scaleY);
  ctx.shadowColor = 'rgba(7,29,22,.28)';
  ctx.shadowBlur = 11;
  ctx.shadowOffsetY = 7;
  const skinGradient = ctx.createLinearGradient(0, y, 0, y + player.height);
  skinGradient.addColorStop(0, skin.accent);
  skinGradient.addColorStop(0.28, skin.colors[0]);
  skinGradient.addColorStop(1, skin.colors[1]);
  ctx.fillStyle = skinGradient;
  ctx.fillRect(x, y, player.width, player.height);
  ctx.shadowColor = 'transparent';

  if (skin.mark === 'flag' && playerImage.complete && playerImage.naturalWidth) {
    ctx.drawImage(playerImage, x + 3, y + 3, player.width - 6, player.height - 6);
  } else {
    ctx.fillStyle = skin.colors[1];
    if (skin.mark === 'eyes') {
      ctx.fillRect(x + 10, y + 16, 8, 10);
      ctx.fillRect(x + 30, y + 16, 8, 10);
    } else if (skin.mark === 'wave') {
      ctx.fillRect(x + 7, y + 27, 34, 6);
      ctx.fillRect(x + 15, y + 19, 26, 6);
    } else if (skin.mark === 'sun') {
      ctx.beginPath();
      ctx.arc(x + 24, y + 24, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.mark === 'star') {
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + 24, y + 34);
    } else if (skin.mark === 'crown') {
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 31);
      ctx.lineTo(x + 8, y + 14);
      ctx.lineTo(x + 18, y + 23);
      ctx.lineTo(x + 25, y + 10);
      ctx.lineTo(x + 33, y + 23);
      ctx.lineTo(x + 41, y + 14);
      ctx.lineTo(x + 41, y + 31);
      ctx.closePath();
      ctx.fill();
    } else if (skin.mark === 'horns') {
      ctx.beginPath();
      ctx.moveTo(x + 7, y + 13);
      ctx.lineTo(x + 14, y - 8);
      ctx.lineTo(x + 21, y + 13);
      ctx.moveTo(x + 28, y + 13);
      ctx.lineTo(x + 35, y - 8);
      ctx.lineTo(x + 42, y + 13);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fillRect(x + 5, y + 6, 5, 20);
    if (!['eyes', 'star'].includes(skin.mark)) {
      ctx.fillStyle = '#071d16';
      ctx.fillRect(x + 35, y + 12, 6, 8);
      ctx.fillStyle = skin.accent;
      ctx.fillRect(x + 37, y + 13, 2, 3);
    }
  }

  ctx.strokeStyle = '#071d16';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, player.width, player.height);
  ctx.restore();
}

function drawCheckpoints(level) {
  checkpoints.forEach((checkpoint, index) => {
    const x = checkpoint.x - cameraX;
    if (x < -80 || x > canvas.width + 80) return;
    const reached = index <= activeCheckpointIndex;
    ctx.fillStyle = '#071d16';
    ctx.fillRect(x, checkpoint.flagY - 70, 6, 70);
    ctx.fillStyle = reached ? '#55d98b' : '#fff8df';
    ctx.beginPath();
    ctx.moveTo(x + 6, checkpoint.flagY - 68);
    ctx.lineTo(x + 48, checkpoint.flagY - 55);
    ctx.lineTo(x + 6, checkpoint.flagY - 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = level.accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

function drawParticles(level) {
  particles.forEach((particle) => {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = level.accentColor;
    ctx.beginPath();
    ctx.arc(particle.x - cameraX, particle.y, particle.size * particle.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawStartSign() {
  const x = 85 - cameraX;
  if (x < -180) return;
  ctx.fillStyle = '#071d16';
  ctx.fillRect(x, 425, 7, 120);
  ctx.fillStyle = '#fff8df';
  ctx.fillRect(x - 62, 385, 132, 55);
  ctx.strokeStyle = '#071d16';
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 62, 385, 132, 55);
  ctx.fillStyle = '#071d16';
  ctx.font = '800 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRUST NOTHING', x + 4, 417);
}

function draw(timestamp) {
  const level = levels[currentLevelIndex];
  drawBackground(level);
  if (!runtime) return;
  drawStartSign();
  drawPlatforms(ctx, level, cameraX, runtime.platforms);
  drawCheckpoints(level);
  drawCoins(timestamp);
  drawHazards(level, timestamp);
  drawGoal(level.goal, level);
  drawPlayer();
  drawParticles(level);
}

function gameLoop(timestamp) {
  const frameDelta = Math.min(32, timestamp - lastFrame || 16);
  lastFrame = timestamp;
  update(timestamp, frameDelta);
  draw(timestamp);
  requestAnimationFrame(gameLoop);
}

document.getElementById('play-button').addEventListener('click', () => showScreen('level-screen'));
document.getElementById('quick-start-button').addEventListener('click', () => startLevel(0));
document.getElementById('back-to-levels').addEventListener('click', () => showScreen('level-screen'));
document.getElementById('restart-button').addEventListener('click', restartLevel);
document.getElementById('levels-button').addEventListener('click', () => showScreen('level-screen'));
document.getElementById('next-level-button').addEventListener('click', () => startLevel((currentLevelIndex + 1) % levels.length));

document.addEventListener('pointerdown', () => music.enable(), { once: true, capture: true });
document.addEventListener('keydown', () => music.enable(), { once: true, capture: true });
musicToggle.addEventListener('click', () => music.toggle());

document.querySelectorAll('[data-coin-pack]').forEach((button) => {
  button.addEventListener('click', () => paymentDialog.showModal());
});
document.getElementById('payment-dialog-close').addEventListener('click', () => paymentDialog.close());

document.querySelectorAll('[data-screen]').forEach((button) => {
  button.addEventListener('click', () => showScreen(button.dataset.screen));
});

levelGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-level]');
  if (button) startLevel(Number(button.dataset.level));
});

shopGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-skin]');
  if (!button) return;
  const skin = skins.find((item) => item.id === button.dataset.skin);
  if (!skin) return;

  const owned = gameSave.ownedSkins.includes(skin.id);
  if (!owned) {
    if (gameSave.coins < skin.cost) return;
    gameSave.coins -= skin.cost;
    gameSave.ownedSkins.push(skin.id);
  }
  gameSave.equippedSkin = skin.id;
  writeSave();
  updateWallets();
  renderShop();
});

window.addEventListener('keydown', (event) => {
  const lowerKey = event.key.toLowerCase();
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'w'].includes(event.key)) event.preventDefault();
  if (event.key === 'ArrowLeft' || lowerKey === 'a') keys.left = true;
  if (event.key === 'ArrowRight' || lowerKey === 'd') keys.right = true;
  if ((event.key === 'ArrowUp' || event.key === ' ' || lowerKey === 'w') && !event.repeat) jump();
  if (lowerKey === 'r' && !event.repeat && !document.getElementById('game-screen').hidden) restartLevel();
  if (event.key === 'Escape' && !document.getElementById('game-screen').hidden) showScreen('level-screen');
});

window.addEventListener('keyup', (event) => {
  const lowerKey = event.key.toLowerCase();
  if (event.key === 'ArrowLeft' || lowerKey === 'a') keys.left = false;
  if (event.key === 'ArrowRight' || lowerKey === 'd') keys.right = false;
});

canvas.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse' || event.button === 0) jump();
  canvas.focus();
});

document.querySelectorAll('[data-control]').forEach((button) => {
  const control = button.dataset.control;
  if (control === 'jump') {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      jump();
    });
    return;
  }

  const setControl = (value) => {
    keys[control] = value;
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setControl(true);
  });
  button.addEventListener('pointerup', () => setControl(false));
  button.addEventListener('pointercancel', () => setControl(false));
});

window.addEventListener('blur', () => {
  keys.left = false;
  keys.right = false;
});

renderLevelCards();
renderShop();
updateWallets();
resetPlayer();
requestAnimationFrame(gameLoop);
