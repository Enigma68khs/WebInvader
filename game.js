const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const stageEl = document.getElementById('stage');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const musicBtn = document.getElementById('music-btn');
const helpBtn = document.getElementById('help-btn');
const languageBtn = document.getElementById('language-btn');
const helpModal = document.getElementById('help-modal');
const helpPanel = document.getElementById('help-panel');
const helpCloseBtn = document.getElementById('help-close-btn');
const helpTitleEl = document.getElementById('help-title');
const helpIntroEl = document.getElementById('help-intro');
const helpMobileTitleEl = document.getElementById('help-mobile-title');
const helpMobileBodyEl = document.getElementById('help-mobile-body');
const helpDesktopTitleEl = document.getElementById('help-desktop-title');
const helpDesktopBodyEl = document.getElementById('help-desktop-body');
const helpTipTitleEl = document.getElementById('help-tip-title');
const helpTipBodyEl = document.getElementById('help-tip-body');
const screenShell = document.querySelector('.screen-shell');
const marqueeTitleEl = document.querySelector('.marquee-title');
const marqueeSubtitleEl = document.querySelector('.marquee-subtitle');
const creditsEl = document.getElementById('credits');

let player = { x: canvas.width / 2 - 25, y: canvas.height - 50, width: 50, height: 30 };
let bullets = [];
let enemies = [];
let score = 0;
let stage = 1;
let gameOver = false;
let gameOverReason = null;
let paused = false;
let keys = {};
let musicOn = false;
let musicTimer = null;
let musicStep = 0;
let currentLanguage = 'ko';
let helpOpen = false;
let moveTouchId = null;
let playerExplosion = null;
const languageOrder = ['ko', 'zh', 'en'];

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

const translations = {
    ko: {
        documentTitle: '웹 인베이더 게임',
        marqueeTitle: 'BNC 오락실',
        marqueeSubtitle: '네트워크를 지키기 위해 코인을 넣으세요',
        credits: 'Hansoo 제작',
        scoreLabel: '점수',
        scoreValue: '점수',
        stageLabel: '스테이지',
        stageValue: '스테이지',
        pause: '일시 정지',
        resume: '재개',
        restart: '다시하기',
        musicOn: '음악 켜기',
        musicOff: '음악 끄기',
        help: '사용방법',
        gameOver: '게임 오버',
        victory: '승리!',
        restartHint: '다시하기를 눌러주세요',
        stageCanvas: '스테이지',
        languageButton: '한국어',
        closeLabel: '닫기',
        helpTitle: '사용방법',
        helpIntro: '방향키와 스페이스바 또는 터치 조작으로 모든 적을 물리치세요.',
        helpMobileTitle: '핸드폰 조작',
        helpMobileBody: '화면을 누른 채 좌우로 움직이면 우주선이 따라 움직입니다. 그 상태에서 다른 손가락으로 탭하면 총알이 발사됩니다.',
        helpDesktopTitle: '키보드 조작',
        helpDesktopBody: '왼쪽/오른쪽 방향키로 이동하고 스페이스바로 발사합니다. P 키 또는 일시 정지 버튼으로 멈출 수 있습니다.',
        helpTipTitle: '플레이 팁',
        helpTipBody: '총알은 벽과 천장에 튕깁니다. 반사 각도를 활용하면 위쪽이나 가장자리 적도 쉽게 맞출 수 있습니다.'
    },
    zh: {
        documentTitle: '网页入侵者游戏',
        marqueeTitle: 'BNC游戏厅',
        marqueeSubtitle: '投币守护网络',
        credits: 'Hansoo 制作',
        scoreLabel: '分数',
        scoreValue: '分数',
        stageLabel: '关卡',
        stageValue: '关卡',
        pause: '暂停',
        resume: '继续',
        restart: '重新开始',
        musicOn: '开启音乐',
        musicOff: '关闭音乐',
        help: '使用方法',
        gameOver: '游戏结束',
        victory: '胜利！',
        restartHint: '请点击重新开始',
        stageCanvas: '关卡',
        languageButton: '中文',
        closeLabel: '关闭',
        helpTitle: '使用方法',
        helpIntro: '使用方向键、空格键或触屏操作，消灭所有敌人。',
        helpMobileTitle: '手机操作',
        helpMobileBody: '按住屏幕后左右滑动即可移动飞船。保持按住时，再用另一根手指点一下，就会发射子弹。',
        helpDesktopTitle: '键盘操作',
        helpDesktopBody: '使用左右方向键移动，按空格键发射。按 P 键或暂停按钮可以暂停游戏。',
        helpTipTitle: '游玩提示',
        helpTipBody: '子弹会在墙壁和顶部反弹。提前计算反弹路线，可以更快击中高处或边缘的敌人。'
    },
    en: {
        documentTitle: 'Web Invader Game',
        marqueeTitle: 'BNC Arcade',
        marqueeSubtitle: 'Insert Coin to Defend the Net',
        credits: 'Created by Hansoo',
        scoreLabel: 'Score',
        scoreValue: 'Score',
        stageLabel: 'Stage',
        stageValue: 'Stage',
        pause: 'Pause',
        resume: 'Resume',
        restart: 'Restart',
        musicOn: 'Music On',
        musicOff: 'Music Off',
        help: 'How To Play',
        gameOver: 'Game Over',
        victory: 'Victory!',
        restartHint: 'Press Restart to play again',
        stageCanvas: 'Stage',
        languageButton: 'English',
        closeLabel: 'Close',
        helpTitle: 'How To Play',
        helpIntro: 'Defeat all enemies using the arrow keys, the space bar, or touch controls.',
        helpMobileTitle: 'Phone Controls',
        helpMobileBody: 'Press and hold the screen, then drag left or right to move the ship. While holding, tap with another finger to fire.',
        helpDesktopTitle: 'Keyboard Controls',
        helpDesktopBody: 'Use the left and right arrow keys to move and press the space bar to fire. Press P or the pause button to pause the game.',
        helpTipTitle: 'Play Tip',
        helpTipBody: 'Bullets bounce off the walls and ceiling. Use the rebound angle to hit enemies near the top or edges faster.'
    }
};

function syncHelpPanelVisibility() {
    helpModal.hidden = !helpOpen;
    helpModal.setAttribute('aria-hidden', String(!helpOpen));
    helpBtn.setAttribute('aria-expanded', String(helpOpen));
}

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

function playPlayerExplosionSound() {
    playSound(180, 0.45, 'sawtooth');
    playSound(92, 0.55, 'triangle');
    playSound(360, 0.18, 'square');
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
        name: { ko: '네온 그리드', zh: '霓虹网格', en: 'Neon Grid' },
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
        name: { ko: '선셋 서킷', zh: '落日回路', en: 'Sunset Circuit' },
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
        name: { ko: '심해 조류', zh: '深海涌流', en: 'Deepsea Current' },
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
        name: { ko: '용암 코어', zh: '熔火核心', en: 'Lava Core' },
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
        name: { ko: '코스믹 리프트', zh: '宇宙裂隙', en: 'Cosmic Rift' },
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
    gameOverReason = null;
    paused = false;
    enemyDirection = 1;
    moveTouchId = null;
    playerExplosion = null;
    syncLanguageUI();
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
    const text = translations[currentLanguage];
    scoreEl.querySelector('.hud-value').textContent = `${text.scoreValue}: ${score}`;
    stageEl.querySelector('.hud-value').textContent = `${text.stageValue}: ${stage}`;
}

function draw() {
    const theme = getStageTheme();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStageBackdrop(theme);
    drawGrid(theme);
    drawStageLabel(theme);

    if (!playerExplosion) {
        drawPixelShip(player.x, player.y, '#5eff9b', '#d9ffe5');
    } else {
        drawPlayerExplosion();
    }

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
        const overlayAlpha = playerExplosion ? Math.min(0.78, 0.2 + playerExplosion.frame * 0.02) : 0.7;
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff5fb7';
        ctx.shadowBlur = 12;
        ctx.fillText(gameOverReason === 'victory' ? getText('victory') : getText('gameOver'), canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#62f4ff';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText(getText('restartHint'), canvas.width / 2, canvas.height / 2 + 42);
    }
}

function getText(key) {
    return translations[currentLanguage][key];
}

function getLocalizedThemeName(theme) {
    return theme.name[currentLanguage];
}

function syncLanguageUI() {
    const text = translations[currentLanguage];

    document.documentElement.lang = currentLanguage === 'ko' ? 'ko' : currentLanguage === 'zh' ? 'zh-CN' : 'en';
    document.title = text.documentTitle;
    marqueeTitleEl.textContent = text.marqueeTitle;
    marqueeSubtitleEl.textContent = text.marqueeSubtitle;
    creditsEl.textContent = text.credits;
    scoreEl.querySelector('.hud-label').textContent = text.scoreLabel;
    stageEl.querySelector('.hud-label').textContent = text.stageLabel;
    pauseBtn.textContent = paused ? text.resume : text.pause;
    restartBtn.textContent = text.restart;
    musicBtn.textContent = musicOn ? text.musicOff : text.musicOn;
    helpBtn.textContent = text.help;
    languageBtn.textContent = text.languageButton;
    helpTitleEl.textContent = text.helpTitle;
    helpCloseBtn.setAttribute('aria-label', text.closeLabel);
    helpIntroEl.textContent = text.helpIntro;
    helpMobileTitleEl.textContent = text.helpMobileTitle;
    helpMobileBodyEl.textContent = text.helpMobileBody;
    helpDesktopTitleEl.textContent = text.helpDesktopTitle;
    helpDesktopBodyEl.textContent = text.helpDesktopBody;
    helpTipTitleEl.textContent = text.helpTipTitle;
    helpTipBodyEl.textContent = text.helpTipBody;
    syncHelpPanelVisibility();
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
    ctx.fillText(`${getText('stageCanvas')} ${stage}`, 32, 32);
    ctx.fillStyle = theme.accent;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(getLocalizedThemeName(theme), 32, 49);
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

function createPlayerExplosion() {
    const particles = [];
    const blocks = [
        { x: 8, y: 16, width: 34, height: 10, color: '#5eff9b' },
        { x: 16, y: 8, width: 18, height: 8, color: '#5eff9b' },
        { x: 22, y: 0, width: 6, height: 8, color: '#5eff9b' },
        { x: 22, y: 12, width: 6, height: 8, color: '#d9ffe5' },
        { x: 4, y: 20, width: 8, height: 6, color: '#d9ffe5' },
        { x: 38, y: 20, width: 8, height: 6, color: '#d9ffe5' }
    ];

    blocks.forEach(block => {
        for (let offsetX = 0; offsetX < block.width; offsetX += 4) {
            for (let offsetY = 0; offsetY < block.height; offsetY += 4) {
                particles.push({
                    x: player.x + block.x + offsetX,
                    y: player.y + block.y + offsetY,
                    vx: (Math.random() - 0.5) * 5.2,
                    vy: -Math.random() * 4.2 - 0.4,
                    size: 4,
                    color: block.color
                });
            }
        }
    });

    return {
        frame: 0,
        flash: 1,
        particles
    };
}

function triggerPlayerDefeat() {
    if (gameOver) return;

    gameOver = true;
    gameOverReason = 'defeat';
    playerExplosion = createPlayerExplosion();
    ensureAudioReady();
    playPlayerExplosionSound();
}

function updatePlayerExplosion() {
    if (!playerExplosion) return;

    playerExplosion.frame++;
    playerExplosion.flash = Math.max(0, playerExplosion.flash - 0.08);

    playerExplosion.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.18;
        particle.vx *= 0.99;
    });
}

function drawPlayerExplosion() {
    if (!playerExplosion) return;

    ctx.save();

    playerExplosion.particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });

    if (playerExplosion.flash > 0) {
        ctx.fillStyle = `rgba(255, 240, 180, ${playerExplosion.flash * 0.45})`;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 46 + playerExplosion.frame * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
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

function shootBullet() {
    if (gameOver || paused) return;

    ensureAudioReady();
    bullets.push(createBullet());
    playShootSound();
}

function getCanvasRelativeX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * canvas.width;
    return Math.max(0, Math.min(canvas.width, relativeX));
}

function movePlayerToClientX(clientX) {
    const touchX = getCanvasRelativeX(clientX);
    player.x = Math.max(0, Math.min(canvas.width - player.width, touchX - player.width / 2));
}

function handleTouchStart(event) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
        if (moveTouchId === null) {
            moveTouchId = touch.identifier;
            movePlayerToClientX(touch.clientX);
        } else if (touch.identifier !== moveTouchId) {
            shootBullet();
        }
    }
}

function handleTouchMove(event) {
    if (moveTouchId === null) return;

    for (const touch of event.changedTouches) {
        if (touch.identifier === moveTouchId) {
            event.preventDefault();
            movePlayerToClientX(touch.clientX);
            break;
        }
    }
}

function handleTouchEnd(event) {
    const moveTouchEnded = Array.from(event.changedTouches).some(touch => touch.identifier === moveTouchId);
    if (!moveTouchEnded) return;

    const remainingTouch = Array.from(event.touches)[0];
    moveTouchId = remainingTouch ? remainingTouch.identifier : null;

    if (remainingTouch) {
        movePlayerToClientX(remainingTouch.clientX);
    }
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
            triggerPlayerDefeat();
        }
    });

    // 다음 스테이지
    if (enemies.every(enemy => !enemy.alive)) {
        if (stage < 5) {
            stage++;
            updateUI();
            nextStage();
        } else if (!gameOver) {
            gameOver = true;
            gameOverReason = 'victory';
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
        if (gameOver) {
            updatePlayerExplosion();
        } else {
            update();
        }
    }
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        shootBullet();
    }
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        paused = !paused;
        syncLanguageUI();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

restartBtn.addEventListener('click', init);

pauseBtn.addEventListener('click', () => {
    paused = !paused;
    syncLanguageUI();
});

musicBtn.addEventListener('click', async () => {
    musicOn = !musicOn;
    syncLanguageUI();
    if (musicOn) {
        await startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
});

helpBtn.addEventListener('click', () => {
    helpOpen = !helpOpen;
    syncHelpPanelVisibility();
});

helpCloseBtn.addEventListener('click', () => {
    helpOpen = false;
    syncHelpPanelVisibility();
});

helpModal.addEventListener('click', (event) => {
    if (event.target === helpModal) {
        helpOpen = false;
        syncHelpPanelVisibility();
    }
});

languageBtn.addEventListener('click', () => {
    const currentIndex = languageOrder.indexOf(currentLanguage);
    currentLanguage = languageOrder[(currentIndex + 1) % languageOrder.length];
    syncLanguageUI();
    updateUI();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && helpOpen) {
        helpOpen = false;
        syncHelpPanelVisibility();
    }
});

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('touchcancel', handleTouchEnd);

init();
gameLoop();
