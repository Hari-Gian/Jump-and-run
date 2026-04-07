const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const groundHeight = 50;

const gravity = 0.5;
let isOnGround = false;

const player = {
    x: 10,
    y: canvas.height - groundHeight - 50,
    width: 50,
    height: 50,
    speed: 4,
    vx: 0,
    vy: 0,
    color: '#ffcb00'
};

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
};

function update() {
    if (keys.ArrowLeft) {
        player.vx = -player.speed;
    } else if (keys.ArrowRight) {
        player.vx = player.speed;
    } else {
        player.vx = 0;
    }

    if (keys.ArrowUp) {
        if (isOnGround) {
            player.vy = -10;
            isOnGround = false;
        }
    }

    player.x += player.vx;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    player.vy += gravity;
    player.y += player.vy;
    player.y = Math.min(canvas.height - groundHeight - player.height, player.y);

    if (player.y >= canvas.height - groundHeight - player.height) {
    player.y = canvas.height - groundHeight - player.height;
    player.vy = 0;
    isOnGround = true;
}
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#3a3f5a';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    const cubeOffset = 14;
    const frontX = player.x;
    const frontY = player.y;
    const size = player.width;

    ctx.fillStyle = player.color;
    ctx.fillRect(frontX, frontY, size, size);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Benutze die Pfeiltasten, um den Spieler zu bewegen und zu springen.', 10, 20);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        keys[event.key] = true;
        event.preventDefault();
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        keys[event.key] = false;
        event.preventDefault();
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp') {
        keys[event.key] = false;
        event.preventDefault();
    }
});

loop();
