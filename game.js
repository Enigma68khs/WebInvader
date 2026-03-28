const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const stageEl = document.getElementById('stage');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const screenShell = document.querySelector('.screen-shell');

let player = { x: canvas.width / 2 - 25, y: canvas.height - 50, width: 50, height: 30 };
let bullets = [];
let enemies = [];
let score = 0;
let stage = 1;
let gameOver = false;
let paused = false;
let keys = {};
let musicOn = false;
let musicTimer = null;
let musicStep = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
ctx.imageSmoothingEnabled = false;

const musicLead = [
    'E5', 'B4', 'C5', 'D5',
    'C5', 'B4', 'A4', 'A4',
    'C5', 'E5', 'D5', 'C5',
    'B4', 'C5', 'D5', 'E5'
];

const musicBass = [
    'A2', 'A2', 'G2', 'G2',
    'F2', 'F2', 'G2', 'G2',
    'A2', 'A2', 'E2', 'E2',
    'F2', 'F2', 'G2', 'E2'
];

const noteFrequencies = {
    C2: 65.41,
    E2: 82.41,
    F2: 87.31,
    G2: 98.0,
    A2: 110.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    REST: null
};

function playSound(frequency, duration, type = 'sine') {
    if (audioContext.state === 'suspended') return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playShootSound() {
    playSound(800, 0.1, 'square');
}

function playExplosionSound() {
    playSound(200, 0.3, 'sawtooth');
}

function playNote(note, startTime, duration, type, volume) {
    const frequency = noteFrequencies[note];
    if (!frequency) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function stopBackgroundMusic() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
}

async function ensureAudioReady() {
    if (audioContext.state !== 'running') {
        await audioContext.resume();
    }
}

function scheduleMusicStep() {
    if (!musicOn || audioContext.state !== 'running') return;

    const stepDuration = 0.22;
    const startTime = audioContext.currentTime + 0.01;
    const leadNote = musicLead[musicStep % musicLead.length];
    const bassNote = musicBass[musicStep % musicBass.length];

    playNote(leadNote, startTime, stepDuration * 0.9, 'square', 0.045);
    playNote(bassNote, startTime, stepDuration * 0.95, 'triangle', 0.03);

    if (musicStep % 4 === 3) {
        playNote('A2', startTime, 0.08, 'sawtooth', 0.015);
    }

    musicStep++;
}

async function startBackgroundMusic() {
    await ensureAudioReady();
    if (musicTimer) return;

    musicStep = 0;
    scheduleMusicStep();
    musicTimer = setInterval(scheduleMusicStep, 220);
}

const enemyRows = 5;
const enemyCols = 10;
const enemyWidth = 40;
const enemyHeight = 30;
const bulletWidth = 4;
const bulletHeight = 12;
const enemyPalettes = [
    { body: '#ff5b79', eye: '#ffd8e6' },
    { body: '#62f4ff', eye: '#e8ffff' },
    { body: '#ffe066', eye: '#fff7cc' },
    { body: '#9bff6a', eye: '#f2ffd8' },
    { body: '#ff9cf6', eye: '#fff0ff' }
];
const stageThemes = [
    {
        name: 'Neon Grid',
        skyTop: '#091523',
        skyBottom: '#02060d',
        bloom: 'rgba(80, 245, 255, 0.18)',
        grid: 'rgba(98, 244, 255, 0.12)',
        glow: 'rgba(32, 196, 255, 0.12)',
        accent: '#62f4ff',
        detail: '#9ffcff',
        shellTop: '#294958',
        shellBottom: '#10212c',
        shellGlow: 'rgba(98, 244, 255, 0.32)',
        cabinetGlow: 'rgba(98, 244, 255, 0.22)',
        motif: 'stars'
    },
    {
        name: 'Sunset Circuit',
        skyTop: '#2a1027',
        skyBottom: '#14050b',
        bloom: 'rgba(255, 168, 83, 0.22)',
        grid: 'rgba(255, 132, 92, 0.14)',
        glow: 'rgba(255, 124, 70, 0.12)',
        accent: '#ff9b54',
        detail: '#ffd166',
        shellTop: '#574231',
        shellBottom: '#27140f',
        shellGlow: 'rgba(255, 155, 84, 0.28)',
        cabinetGlow: 'rgba(255, 105, 120, 0.24)',
        motif: 'sun'
    },
    {
        name: 'Deep Current',
        skyTop: '#061b25',
        skyBottom: '#020b11',
        bloom: 'rgba(59, 182, 214, 0.2)',
        grid: 'rgba(83, 211, 255, 0.11)',
        glow: 'rgba(0, 180, 255, 0.1)',
        accent: '#53d3ff',
        detail: '#86fff1',
        shellTop: '#20434e',
        shellBottom: '#0a1c25',
        shellGlow: 'rgba(83, 211, 255, 0.28)',
        cabinetGlow: 'rgba(83, 211, 255, 0.2)',
        motif: 'waves'
    },
    {
        name: 'Molten Core',
        skyTop: '#2a0b05',
        skyBottom: '#090202',
        bloom: 'rgba(255, 93, 44, 0.22)',
        grid: 'rgba(255, 118, 74, 0.12)',
        glow: 'rgba(255, 92, 30, 0.12)',
        accent: '#ff6b3d',
        detail: '#ffd7a1',
        shellTop: '#57311f',
        shellBottom: '#240d07',
        shellGlow: 'rgba(255, 107, 61, 0.28)',
        cabinetGlow: 'rgba(255, 117, 55, 0.24)',
        motif: 'embers'
    },
    {
        name: 'Cosmic Rift',
        skyTop: '#170729',
        skyBottom: '#05010c',
        bloom: 'rgba(192, 116, 255, 0.22)',
        grid: 'rgba(207, 132, 255, 0.14)',
        glow: 'rgba(148, 68, 255, 0.14)',
        accent: '#c084ff',
        detail: '#ff90e8',
        shellTop: '#46305e',
        shellBottom: '#180b28',
        shellGlow: 'rgba(192, 132, 255, 0.3)',
        cabinetGlow: 'rgba(192, 132, 255, 0.22)',
        motif: 'rift'
    }
];
let enemyDirection = 1;
const bulletSpeed = 6.5;
const playerSpeed = 5;

function init() {
    player.x = canvas.width / 2 - 25;
    bullets = [];
    enemies = [];
    score = 0;
    stage = 1;
    gameOver = false;
    paused = false;
    enemyDirection = 1;
    pauseBtn.textContent = '일시 정지';
    updateUI();
    applyStageTheme();
    if (musicOn) {
        startBackgroundMusic();
    }

    // 적 생성
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: col * (enemyWidth + 10) + 50,
                y: row * (enemyHeight + 10) + 50,
                width: enemyWidth,
                height: enemyHeight,
                alive: true
            });
        }
    }
}

function updateUI() {
    scoreEl.querySelector('.hud-value').textContent = `점수: ${score}`;
    stageEl.querySelector('.hud-value').textContent = `스테이지: ${stage}`;
}

function draw() {
    const theme = getStageTheme();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStageBackdrop(theme);
    drawGrid(theme);
    drawStageLabel(theme);

    // 플레이어 그리기
    drawPixelShip(player.x, player.y, '#5eff9b', '#d9ffe5');

    // 총알 그리기
    bullets.forEach(bullet => {
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
        ctx.fillStyle = '#fff8cc';
        ctx.fillRect(bullet.x + 1, bullet.y - 2, 2, 4);
    });

    // 적 그리기
    enemies.forEach(enemy => {
        if (enemy.alive) {
            drawEnemy(enemy.x, enemy.y);
        }
    });

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff5fb7';
        ctx.shadowBlur = 12;
        ctx.fillText(stage > 5 ? '승리!' : '게임 오버', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#62f4ff';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText('PRESS RESTART', canvas.width / 2, canvas.height / 2 + 42);
    }
}

function getStageTheme() {
    return stageThemes[(stage - 1) % stageThemes.length];
}

function applyStageTheme() {
    const theme = getStageTheme();

    document.documentElement.style.setProperty('--stage-shell-top', theme.shellTop);
    document.documentElement.style.setProperty('--stage-shell-bottom', theme.shellBottom);
    document.documentElement.style.setProperty('--stage-shell-glow', theme.shellGlow);
    document.documentElement.style.setProperty('--stage-canvas-top', theme.skyTop);
    document.documentElement.style.setProperty('--stage-canvas-bottom', theme.skyBottom);
    document.documentElement.style.setProperty('--stage-canvas-bloom', theme.bloom);
    document.documentElement.style.setProperty('--stage-cabinet-glow', theme.cabinetGlow);

    document.body.style.background = `
        radial-gradient(circle at top, ${theme.bloom}, transparent 30%),
        linear-gradient(180deg, ${theme.shellTop} 0%, ${theme.shellBottom} 45%, #050308 100%)
    `;

    if (screenShell) {
        screenShell.style.boxShadow = `
            0 0 0 4px #6b7a73,
            0 0 0 10px #0f1118,
            0 28px 55px rgba(0, 0, 0, 0.55),
            0 0 25px ${theme.shellGlow}
        `;
    }
}

function drawStageBackdrop(theme) {
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    backgroundGradient.addColorStop(0, theme.skyTop);
    backgroundGradient.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glowGradient = ctx.createRadialGradient(canvas.width / 2, 140, 40, canvas.width / 2, 140, 340);
    glowGradient.addColorStop(0, theme.bloom);
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawThemeMotif(theme);
}

function drawThemeMotif(theme) {
    ctx.save();

    if (theme.motif === 'stars') {
        for (let i = 0; i < 20; i++) {
            const x = (i * 97) % canvas.width;
            const y = (i * 53) % 260;
            const size = i % 3 === 0 ? 3 : 2;
            ctx.fillStyle = i % 2 === 0 ? theme.detail : theme.accent;
            ctx.fillRect(x, y, size, size);
        }
    }

    if (theme.motif === 'sun') {
        ctx.fillStyle = 'rgba(255, 209, 102, 0.18)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 165, 96, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 155, 84, 0.32)';
        ctx.lineWidth = 3;
        for (let y = 120; y <= 220; y += 18) {
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2 - 96, y);
            ctx.lineTo(canvas.width / 2 + 96, y);
            ctx.stroke();
        }
    }

    if (theme.motif === 'waves') {
        ctx.strokeStyle = 'rgba(134, 255, 241, 0.18)';
        ctx.lineWidth = 3;
        for (let row = 0; row < 5; row++) {
            ctx.beginPath();
            const baseY = 110 + row * 34;
            for (let x = 0; x <= canvas.width; x += 24) {
                const y = baseY + Math.sin((x + row * 50) * 0.03) * 10;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
    }

    if (theme.motif === 'embers') {
        for (let i = 0; i < 24; i++) {
            const x = (i * 61) % canvas.width;
            const y = ((i * 37) % 200) + 40;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 167, 82, 0.22)' : 'rgba(255, 107, 61, 0.18)';
            ctx.fillRect(x, y, 4, 10);
        }
    }

    if (theme.motif === 'rift') {
        ctx.strokeStyle = 'rgba(255, 144, 232, 0.22)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.48, 0);
        ctx.lineTo(canvas.width * 0.44, 110);
        ctx.lineTo(canvas.width * 0.58, 220);
        ctx.lineTo(canvas.width * 0.5, 330);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(192, 132, 255, 0.18)';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.5, 100 + i * 34);
            ctx.lineTo(canvas.width * 0.32, 70 + i * 42);
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawGrid(theme) {
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawStageLabel(theme) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 6, 10, 0.38)';
    ctx.fillRect(18, 14, 190, 44);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 14, 190, 44);
    ctx.fillStyle = theme.detail;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`STAGE ${stage}`, 32, 32);
    ctx.fillStyle = theme.accent;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(theme.name.toUpperCase(), 32, 49);
    ctx.restore();
}

function drawPixelShip(x, y, baseColor, accentColor) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(x + 8, y + 16, 34, 10);
    ctx.fillRect(x + 16, y + 8, 18, 8);
    ctx.fillRect(x + 22, y, 6, 8);

    ctx.fillStyle = accentColor;
    ctx.fillRect(x + 22, y + 12, 6, 8);
    ctx.fillRect(x + 4, y + 20, 8, 6);
    ctx.fillRect(x + 38, y + 20, 8, 6);
}

function getEnemyPalette() {
    return enemyPalettes[(stage - 1) % enemyPalettes.length];
}

function drawEnemy(x, y) {
    const palette = getEnemyPalette();

    ctx.fillStyle = palette.body;
    ctx.fillRect(x + 8, y, 24, 8);
    ctx.fillRect(x + 4, y + 8, 32, 8);
    ctx.fillRect(x, y + 16, 40, 8);
    ctx.fillRect(x + 4, y + 24, 8, 6);
    ctx.fillRect(x + 28, y + 24, 8, 6);

    ctx.fillStyle = palette.eye;
    ctx.fillRect(x + 10, y + 10, 4, 4);
    ctx.fillRect(x + 26, y + 10, 4, 4);
}

function createBullet() {
    let angle = 0;
    if (keys['ArrowLeft'] && !keys['ArrowRight']) {
        angle = -22;
    } else if (keys['ArrowRight'] && !keys['ArrowLeft']) {
        angle = 22;
    }

    const radians = angle * (Math.PI / 180);

    return {
        x: player.x + player.width / 2 - bulletWidth / 2,
        y: player.y,
        vx: Math.sin(radians) * bulletSpeed,
        vy: -Math.cos(radians) * bulletSpeed
    };
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x <= 0) {
            bullet.x = 0;
            bullet.vx *= -1;
        } else if (bullet.x + bulletWidth >= canvas.width) {
            bullet.x = canvas.width - bulletWidth;
            bullet.vx *= -1;
        }

        if (bullet.y <= 0) {
            bullet.y = 0;
            bullet.vy *= -1;
        }

        // 플레이어 쪽으로 다시 내려온 총알은 피해 없이 제거
        if (bullet.y >= player.y + player.height) {
            bullets.splice(i, 1);
        }
    }
}

function handleBulletCollisions() {
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets[bIndex];
        let bulletConsumed = false;

        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];

            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bulletWidth > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bulletHeight > enemy.y) {
                enemy.alive = false;
                bullets.splice(bIndex, 1);
                score += 10;
                updateUI();
                playExplosionSound();
                bulletConsumed = true;
                break;
            }
        }

        if (bulletConsumed) {
            continue;
        }
    }
}

function update() {
    if (gameOver) return;

    // 플레이어 이동
    if (keys['ArrowLeft'] && player.x > 0) player.x -= playerSpeed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += playerSpeed;

    // 총알 이동
    updateBullets();

    // 적 이동
    let moveDown = false;
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.x += enemyDirection * (stage * 0.5);
            if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                moveDown = true;
            }
        }
    });

    if (moveDown) {
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += 20;
            }
        });
        enemyDirection *= -1;
    }

    // 충돌 체크
    handleBulletCollisions();

    // 게임 오버 체크
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemy.height >= player.y) {
            gameOver = true;
        }
    });

    // 다음 스테이지
    if (enemies.every(enemy => !enemy.alive)) {
        if (stage < 5) {
            stage++;
            updateUI();
            nextStage();
        } else {
            gameOver = true; // 승리
        }
    }
}

function nextStage() {
    applyStageTheme();
    enemies = [];
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: col * (enemyWidth + 10) + 50,
                y: row * (enemyHeight + 10) + 50,
                width: enemyWidth,
                height: enemyHeight,
                alive: true
            });
        }
    }
}

function gameLoop() {
    if (!paused) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        ensureAudioReady();
        bullets.push(createBullet());
        playShootSound();
    }
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        paused = !paused;
        pauseBtn.textContent = paused ? '재개' : '일시 정지';
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

restartBtn.addEventListener('click', init);

pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '재개' : '일시 정지';
});

const musicBtn = document.getElementById('music-btn');

musicBtn.addEventListener('click', async () => {
    musicOn = !musicOn;
    musicBtn.textContent = musicOn ? '음악 끄기' : '음악 켜기';
    if (musicOn) {
        await startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
});

init();
gameLoop();
