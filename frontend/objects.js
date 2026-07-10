const platform = (x, y, width, type = 'solid', extra = {}) => ({
  x,
  y,
  width,
  height: 26,
  type,
  ...extra
});

const ground = (x, width) => platform(x, 545, width, 'solid', { height: 75 });

const spike = (x, floorY = 545, hidden = true, triggerX = x - 210, width = 44) => ({
  type: 'spike',
  x,
  y: floorY,
  width,
  height: 42,
  hidden,
  triggerX
});

const saw = (x, y, radius = 27, axis = 'y', range = 65, speed = 0.002) => ({
  type: 'saw',
  x,
  y,
  radius,
  axis,
  range,
  speed
});

const dropBlock = (x, width, triggerX, targetY = 470) => ({
  type: 'drop',
  x,
  y: -90,
  width,
  height: 74,
  triggerX,
  targetY
});

const coin = (id, x, y) => ({ id, x, y });

export const skins = [
  { id: 'classic', name: 'Island Classic', cost: 0, colors: ['#ffca28', '#08764a'], mark: 'flag' },
  { id: 'coconut', name: 'Coconut Cub', cost: 0, colors: ['#f4e2b8', '#68472f'], mark: 'eyes' },
  { id: 'lagoon', name: 'Blue Lagoon', cost: 70, colors: ['#46d9d1', '#075f71'], mark: 'wave' },
  { id: 'sunset', name: 'Sunset Sprinter', cost: 120, colors: ['#ff934f', '#c92d4b'], mark: 'sun' },
  { id: 'reggae', name: 'Reggae Royal', cost: 190, colors: ['#18a968', '#ffca28'], mark: 'crown' },
  { id: 'midnight', name: 'Midnight Star', cost: 270, colors: ['#26243d', '#9d7bff'], mark: 'star' },
  { id: 'gold', name: 'Golden Legend', cost: 360, colors: ['#ffd95a', '#a56b00'], mark: 'crown' },
  { id: 'trickster', name: 'Island Trickster', cost: 450, colors: ['#e84c3d', '#4a1021'], mark: 'horns' }
];

export const levels = [
  {
    name: 'Treasure Beach',
    difficulty: 'Sneaky',
    worldWidth: 3000,
    reward: 30,
    sky: ['#73d8d1', '#ecf5d5'],
    platformColor: '#08764a',
    accentColor: '#ffca28',
    platforms: [
      ground(0, 440),
      platform(500, 500, 180),
      ground(740, 330),
      platform(1130, 470, 180, 'collapse', { delay: 520 }),
      ground(1370, 400),
      platform(1830, 455, 160),
      platform(2050, 510, 250, 'fake', { delay: 300 }),
      platform(2360, 430, 160),
      ground(2580, 420)
    ],
    hazards: [
      spike(330),
      spike(900, 545, false),
      spike(1580, 545, true, 1460, 70),
      saw(2180, 420, 25, 'y', 55)
    ],
    coins: [coin('a', 190, 485), coin('b', 585, 440), coin('c', 1010, 485), coin('d', 1450, 485), coin('e', 1905, 395), coin('f', 2430, 370)],
    goal: { x: 2890, y: 453, width: 62, height: 92 }
  },
  {
    name: 'Kingston Rush',
    difficulty: 'Tricky',
    worldWidth: 3300,
    reward: 35,
    sky: ['#78c9dc', '#f2e7c7'],
    platformColor: '#176b4c',
    accentColor: '#f4c64f',
    platforms: [
      ground(0, 360),
      platform(420, 500, 150),
      ground(630, 350),
      platform(1040, 450, 150, 'moving', { axis: 'x', range: 45, speed: 0.002 }),
      ground(1250, 350),
      platform(1660, 480, 130, 'fake', { delay: 260 }),
      ground(1850, 300),
      platform(2210, 435, 150),
      platform(2420, 495, 140, 'collapse', { delay: 430 }),
      ground(2620, 680)
    ],
    hazards: [
      spike(275, 545, true, 150),
      spike(800, 545, false, 0, 80),
      saw(1450, 475, 25, 'x', 95, 0.0024),
      spike(1960, 545, true, 1830),
      dropBlock(2760, 90, 2670, 470)
    ],
    coins: [coin('a', 140, 485), coin('b', 490, 440), coin('c', 900, 485), coin('d', 1110, 370), coin('e', 2070, 485), coin('f', 2290, 345)],
    goal: { x: 3180, y: 453, width: 62, height: 92 }
  },
  {
    name: "Dunn's Deception",
    difficulty: 'Hard',
    worldWidth: 3500,
    reward: 40,
    sky: ['#5bc5ce', '#d9f2dc'],
    platformColor: '#0f6546',
    accentColor: '#e8f3d6',
    platforms: [
      ground(0, 300),
      platform(360, 480, 130),
      platform(550, 390, 130),
      ground(740, 390),
      platform(1190, 465, 150, 'moving', { axis: 'y', range: 60, speed: 0.0022 }),
      ground(1410, 350),
      platform(1820, 435, 140),
      platform(2020, 330, 130, 'collapse', { delay: 500 }),
      ground(2210, 350),
      platform(2620, 465, 140, 'fake', { delay: 280 }),
      ground(2820, 680)
    ],
    hazards: [
      saw(470, 390, 23, 'y', 65, 0.0026),
      spike(930, 545, true, 800, 72),
      dropBlock(1540, 100, 1440, 470),
      saw(1900, 330, 26, 'x', 75, 0.0025),
      spike(2380, 545, false, 0, 95),
      spike(3040, 545, true, 2890)
    ],
    coins: [coin('a', 90, 485), coin('b', 420, 420), coin('c', 610, 330), coin('d', 1280, 355), coin('e', 2090, 270), coin('f', 3300, 485)],
    goal: { x: 3380, y: 453, width: 62, height: 92 }
  },
  {
    name: 'Coconut Chaos',
    difficulty: 'Brutal',
    worldWidth: 3700,
    reward: 45,
    sky: ['#8bd7c4', '#f5e9bb'],
    platformColor: '#1a724b',
    accentColor: '#ffca28',
    platforms: [
      ground(0, 320),
      platform(380, 495, 130, 'collapse', { delay: 520 }),
      platform(570, 420, 130, 'collapse', { delay: 460 }),
      platform(760, 345, 130, 'collapse', { delay: 400 }),
      ground(950, 400),
      platform(1410, 480, 150),
      ground(1620, 380),
      platform(2060, 435, 140, 'fake', { delay: 250 }),
      platform(2260, 495, 140),
      ground(2460, 500),
      platform(3020, 430, 140, 'moving', { axis: 'x', range: 50, speed: 0.0025 }),
      ground(3220, 480)
    ],
    hazards: [
      spike(240, 545, true, 100),
      saw(845, 255, 24, 'x', 50, 0.003),
      spike(1160, 545, false, 0, 74),
      dropBlock(1720, 90, 1640, 470),
      saw(2340, 405, 27, 'y', 55, 0.0025),
      spike(2760, 545, true, 2610, 80),
      dropBlock(3390, 95, 3300, 470)
    ],
    coins: [coin('a', 120, 485), coin('b', 440, 430), coin('c', 630, 355), coin('d', 820, 280), coin('e', 1500, 420), coin('f', 3100, 365)],
    goal: { x: 3580, y: 453, width: 62, height: 92 }
  },
  {
    name: 'Port Royal Panic',
    difficulty: 'Cruel',
    worldWidth: 3900,
    reward: 50,
    sky: ['#78b8cc', '#e9d6b3'],
    platformColor: '#315f48',
    accentColor: '#f3b93f',
    platforms: [
      ground(0, 390),
      platform(450, 470, 155),
      ground(665, 290),
      platform(1015, 435, 145, 'moving', { axis: 'y', range: 55, speed: 0.0025 }),
      platform(1220, 480, 150),
      ground(1430, 420),
      platform(1910, 430, 145, 'fake', { delay: 240 }),
      ground(2115, 340),
      platform(2515, 475, 140, 'collapse', { delay: 380 }),
      platform(2715, 390, 140),
      ground(2915, 410),
      platform(3385, 460, 145, 'moving', { axis: 'x', range: 55, speed: 0.0028 }),
      ground(3590, 310)
    ],
    hazards: [
      dropBlock(300, 90, 205, 470),
      spike(790, 545, true, 660),
      saw(1300, 390, 25, 'x', 70, 0.0028),
      dropBlock(1580, 105, 1470, 470),
      spike(2260, 545, false, 0, 84),
      dropBlock(3010, 100, 2940, 470),
      saw(3480, 360, 28, 'y', 70, 0.003)
    ],
    coins: [coin('a', 110, 485), coin('b', 525, 410), coin('c', 1100, 300), coin('d', 1700, 485), coin('e', 2790, 330), coin('f', 3700, 485)],
    goal: { x: 3790, y: 453, width: 62, height: 92 }
  },
  {
    name: 'Rainforest Ruse',
    difficulty: 'Wicked',
    worldWidth: 4100,
    reward: 55,
    sky: ['#6bc5aa', '#cce5bd'],
    platformColor: '#0c5137',
    accentColor: '#8dd45b',
    platforms: [
      ground(0, 330),
      platform(390, 485, 150, 'fake', { delay: 250 }),
      ground(600, 350),
      platform(1010, 435, 135),
      platform(1205, 345, 135, 'collapse', { delay: 420 }),
      ground(1400, 400),
      platform(1860, 480, 140, 'moving', { axis: 'x', range: 65, speed: 0.003 }),
      platform(2070, 390, 130),
      ground(2260, 420),
      platform(2740, 450, 145, 'fake', { delay: 220 }),
      ground(2945, 360),
      platform(3365, 435, 140, 'moving', { axis: 'y', range: 55, speed: 0.003 }),
      platform(3565, 475, 140),
      ground(3765, 335)
    ],
    hazards: [
      spike(205, 545, true, 70, 72),
      spike(760, 545, true, 630, 76),
      saw(1090, 335, 24, 'y', 55, 0.003),
      dropBlock(1530, 100, 1430, 470),
      saw(2140, 300, 27, 'x', 70, 0.003),
      spike(2480, 545, false, 0, 90),
      dropBlock(3060, 95, 2980, 470),
      spike(3900, 545, true, 3780)
    ],
    coins: [coin('a', 115, 485), coin('b', 465, 425), coin('c', 1080, 365), coin('d', 1270, 285), coin('e', 2340, 485), coin('f', 3440, 315)],
    goal: { x: 3990, y: 453, width: 62, height: 92 }
  },
  {
    name: 'Volcano Run',
    difficulty: 'Savage',
    worldWidth: 4300,
    reward: 60,
    sky: ['#7d8796', '#efc18f'],
    platformColor: '#442f2c',
    accentColor: '#f06a3b',
    platforms: [
      ground(0, 360),
      platform(420, 470, 145),
      platform(625, 380, 135),
      ground(820, 390),
      platform(1270, 475, 145, 'collapse', { delay: 380 }),
      ground(1475, 330),
      platform(1865, 435, 140, 'moving', { axis: 'y', range: 65, speed: 0.003 }),
      platform(2070, 485, 145),
      ground(2275, 390),
      platform(2725, 435, 140, 'fake', { delay: 220 }),
      platform(2925, 340, 135),
      ground(3120, 400),
      platform(3580, 465, 145, 'moving', { axis: 'x', range: 65, speed: 0.0032 }),
      ground(3785, 515)
    ],
    hazards: [
      saw(290, 455, 29, 'y', 60, 0.0033),
      spike(980, 545, true, 850, 78),
      saw(1560, 450, 28, 'x', 90, 0.0035),
      dropBlock(2330, 105, 2260, 470),
      saw(3000, 250, 28, 'y', 65, 0.0035),
      spike(3330, 545, false, 0, 95),
      dropBlock(3970, 100, 3870, 470)
    ],
    coins: [coin('a', 100, 485), coin('b', 490, 410), coin('c', 690, 320), coin('d', 1350, 415), coin('e', 1950, 320), coin('f', 3660, 405)],
    goal: { x: 4190, y: 453, width: 62, height: 92 }
  },
  {
    name: 'Moonlit Mountain',
    difficulty: 'Merciless',
    worldWidth: 4500,
    reward: 65,
    sky: ['#374d6c', '#a8b8b1'],
    platformColor: '#172f2b',
    accentColor: '#b8a7ff',
    platforms: [
      ground(0, 300),
      platform(360, 470, 130, 'moving', { axis: 'y', range: 60, speed: 0.003 }),
      platform(550, 370, 130),
      ground(740, 340),
      platform(1140, 435, 135, 'fake', { delay: 210 }),
      platform(1335, 340, 130),
      ground(1525, 360),
      platform(1945, 470, 140, 'collapse', { delay: 340 }),
      platform(2145, 370, 135, 'moving', { axis: 'x', range: 70, speed: 0.0035 }),
      ground(2340, 390),
      platform(2790, 430, 135),
      platform(2985, 330, 130, 'fake', { delay: 200 }),
      ground(3175, 370),
      platform(3605, 450, 140, 'moving', { axis: 'y', range: 75, speed: 0.0034 }),
      platform(3805, 350, 135, 'collapse', { delay: 330 }),
      ground(4000, 500)
    ],
    hazards: [
      spike(180, 545, true, 60),
      saw(630, 285, 25, 'x', 55, 0.0035),
      dropBlock(860, 100, 760, 470),
      saw(1420, 250, 27, 'y', 70, 0.0034),
      spike(1700, 545, false, 0, 85),
      dropBlock(2460, 100, 2370, 470),
      saw(3060, 240, 28, 'x', 60, 0.0038),
      spike(3370, 545, true, 3220, 90),
      dropBlock(4160, 100, 4060, 470)
    ],
    coins: [coin('a', 100, 485), coin('b', 420, 380), coin('c', 1210, 370), coin('d', 2210, 305), coin('e', 3050, 265), coin('f', 3880, 285)],
    goal: { x: 4390, y: 453, width: 62, height: 92 }
  },
  {
    name: "Devil's Reef",
    difficulty: 'Nightmare',
    worldWidth: 4700,
    reward: 70,
    sky: ['#3d7690', '#91c8bb'],
    platformColor: '#133e3a',
    accentColor: '#42dfcc',
    platforms: [
      ground(0, 310),
      platform(370, 480, 135, 'fake', { delay: 200 }),
      platform(565, 385, 130, 'collapse', { delay: 320 }),
      ground(755, 350),
      platform(1165, 455, 140, 'moving', { axis: 'x', range: 70, speed: 0.0036 }),
      platform(1365, 355, 130),
      ground(1555, 360),
      platform(1975, 465, 140, 'fake', { delay: 190 }),
      platform(2175, 365, 135, 'moving', { axis: 'y', range: 75, speed: 0.0037 }),
      ground(2370, 380),
      platform(2810, 435, 135, 'collapse', { delay: 300 }),
      platform(3005, 325, 130),
      ground(3195, 380),
      platform(3635, 465, 140, 'moving', { axis: 'x', range: 80, speed: 0.004 }),
      platform(3835, 365, 135, 'fake', { delay: 190 }),
      ground(4030, 670)
    ],
    hazards: [
      saw(220, 450, 27, 'y', 60, 0.0038),
      spike(900, 545, true, 770, 82),
      dropBlock(1610, 100, 1530, 470),
      saw(2250, 270, 28, 'x', 65, 0.004),
      spike(2530, 545, false, 0, 96),
      dropBlock(3270, 100, 3180, 470),
      saw(3920, 270, 30, 'y', 75, 0.004),
      spike(4260, 545, true, 4120, 90),
      dropBlock(4490, 100, 4400, 470)
    ],
    coins: [coin('a', 100, 485), coin('b', 435, 420), coin('c', 630, 325), coin('d', 1235, 390), coin('e', 2880, 355), coin('f', 3900, 300)],
    goal: { x: 4590, y: 453, width: 62, height: 92 }
  },
  {
    name: 'The Last Laugh',
    difficulty: 'Impossible-ish',
    worldWidth: 5000,
    reward: 80,
    sky: ['#392a46', '#b45d65'],
    platformColor: '#2c202f',
    accentColor: '#ffca28',
    platforms: [
      ground(0, 290),
      platform(350, 470, 130, 'collapse', { delay: 300 }),
      platform(540, 370, 125, 'fake', { delay: 190 }),
      ground(725, 340),
      platform(1125, 450, 135, 'moving', { axis: 'y', range: 75, speed: 0.004 }),
      platform(1320, 345, 125, 'collapse', { delay: 280 }),
      ground(1505, 350),
      platform(1915, 465, 135, 'fake', { delay: 180 }),
      platform(2110, 360, 130, 'moving', { axis: 'x', range: 80, speed: 0.0042 }),
      ground(2300, 360),
      platform(2720, 435, 130, 'collapse', { delay: 280 }),
      platform(2910, 320, 125, 'fake', { delay: 170 }),
      ground(3095, 350),
      platform(3505, 455, 135, 'moving', { axis: 'y', range: 80, speed: 0.0043 }),
      platform(3700, 350, 125, 'collapse', { delay: 260 }),
      ground(3885, 350),
      platform(4295, 430, 130, 'fake', { delay: 170 }),
      platform(4485, 330, 125, 'moving', { axis: 'x', range: 70, speed: 0.0045 }),
      ground(4670, 330)
    ],
    hazards: [
      spike(170, 545, true, 50, 80),
      saw(620, 270, 27, 'x', 55, 0.0042),
      dropBlock(790, 100, 710, 470),
      saw(1200, 350, 28, 'y', 70, 0.0043),
      spike(1660, 545, false, 0, 92),
      dropBlock(2350, 105, 2270, 470),
      saw(2980, 225, 29, 'x', 65, 0.0045),
      spike(3260, 545, true, 3120, 95),
      dropBlock(3935, 110, 3850, 470),
      saw(4360, 330, 29, 'y', 75, 0.0045),
      spike(4770, 545, true, 4660, 86)
    ],
    coins: [coin('a', 90, 485), coin('b', 415, 410), coin('c', 600, 305), coin('d', 2180, 295), coin('e', 2980, 250), coin('f', 4545, 265)],
    goal: { x: 4890, y: 453, width: 62, height: 92 }
  }
];

export function drawPlatforms(ctx, level, cameraX = 0, runtimePlatforms = level.platforms) {
  runtimePlatforms.forEach((item) => {
    if (!item.active) return;
    const x = item.x - cameraX;
    if (x + item.width < -20 || x > ctx.canvas.width + 20) return;

    ctx.fillStyle = 'rgba(7, 29, 22, 0.18)';
    ctx.fillRect(x + 7, item.y + 8, item.width, item.height);
    ctx.fillStyle = level.platformColor;
    ctx.fillRect(x, item.y, item.width, item.height);
    ctx.fillStyle = item.type === 'fake' ? 'rgba(255,255,255,.48)' : level.accentColor;
    ctx.fillRect(x, item.y, item.width, Math.min(9, item.height));

    if (item.type === 'collapse') {
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      for (let crackX = x + 28; crackX < x + item.width; crackX += 42) {
        ctx.fillRect(crackX, item.y + 10, 3, 12);
      }
    }
  });
}

export const objects = levels[0].platforms;

export function drawObjects(ctx) {
  drawPlatforms(ctx, levels[0]);
}

export function colisionDetection(player, platformList = objects) {
  return platformList.some((item) => (
    player.x < item.x + item.width &&
    player.x + player.width > item.x &&
    player.y < item.y + item.height &&
    player.y + player.height > item.y
  ));
}
