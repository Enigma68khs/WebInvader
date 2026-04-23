const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const stageEl = document.getElementById('stage');
const stageDownBtn = document.getElementById('stage-down-btn');
const stageUpBtn = document.getElementById('stage-up-btn');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const musicBtn = document.getElementById('music-btn');
const rapidFireCheckbox = document.getElementById('rapid-fire-checkbox');
const rapidFireLabelEl = document.getElementById('rapid-fire-label');
const helpBtn = document.getElementById('help-btn');
const languageBtn = document.getElementById('language-btn');
const nameModal = document.getElementById('name-modal');
const nameCloseBtn = document.getElementById('name-close-btn');
const nameModalTitleEl = document.getElementById('name-modal-title');
const nameModalTextEl = document.getElementById('name-modal-text');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameCancelBtn = document.getElementById('name-cancel-btn');
const nameSaveBtn = document.getElementById('name-save-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardCloseBtn = document.getElementById('leaderboard-close-btn');
const leaderboardModalTitleEl = document.getElementById('leaderboard-modal-title');
const leaderboardModalTextEl = document.getElementById('leaderboard-modal-text');
const leaderboardModalListEl = document.getElementById('leaderboard-modal-list');
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
const marqueeHighScoreEl = document.getElementById('marquee-high-score');
const visitTodayLabelEl = document.getElementById('visit-today-label');
const visitTodayValueEl = document.getElementById('visit-today-value');
const visitTotalLabelEl = document.getElementById('visit-total-label');
const visitTotalValueEl = document.getElementById('visit-total-value');

const PLAYER_SCALE = 1.1;
const PLAYER_BASE_WIDTH = 50;
const PLAYER_BASE_HEIGHT = 30;
const PLAYER_WIDTH = Math.round(PLAYER_BASE_WIDTH * PLAYER_SCALE);
const PLAYER_HEIGHT = Math.round(PLAYER_BASE_HEIGHT * PLAYER_SCALE);
const MAX_STAGE = 8;
const FINAL_BOSS_STAGE = 8;

let player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - 50,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT
};
let bullets = [];
let enemies = [];
let specialEnemies = [];
let finalBoss = null;
let enemyBombs = [];
let score = 0;
let stage = 1;
let gameOver = false;
let gameOverReason = null;
let gameStarted = false;
let paused = false;
let keys = {};
let musicOn = true;
let rapidFireEnabled = false;
let bulletReady = true;
let musicTimer = null;
let musicStep = 0;
let currentLanguage = 'en';
let helpOpen = false;
let nameModalOpen = false;
let leaderboardModalOpen = false;
let moveTouchId = null;
let fireTouchIds = new Set();
let playerExplosion = null;
let pendingScoreSubmission = null;
let leaderboardModalResult = null;
let highScores = [];
let scoreHistory = [];
let supabaseClient = null;
let frameCount = 0;
let leaderboardLoading = false;
let leaderboardSource = 'local';
let nameModalStatusKey = null;
let remainingSpecialSpawns = 0;
let specialSpawnCooldown = 0;
let specialEnemyIdCounter = 0;
let scorePopups = [];
let bossFightStartFrame = null;
let bossDefeatSummary = null;
const languageOrder = ['ko', 'zh', 'en'];
const HIGH_SCORE_STORAGE_KEY = 'webinvader.highscores.v1';
const SCORE_HISTORY_STORAGE_KEY = 'webinvader.score-history.v1';
const VISIT_STATS_STORAGE_KEY = 'webinvader.visit-stats.v1';
const VISITOR_ID_STORAGE_KEY = 'webinvader.visitor-id.v1';
const MAX_HIGH_SCORES = 5;
const MAX_PLAYER_NAME_LENGTH = 12;
const SUPABASE_TABLE_NAME = 'leaderboard_scores';
const SUPABASE_SUBMIT_SCORE_FUNCTION = 'submit-score';
const VISIT_COUNTER_TABLE_NAME = 'site_visits';
const SCORE_POPUP_LIFETIME = 72;
let visitStats = loadVisitStats();

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
        start: '시작',
        stageIncreaseLabel: '스테이지 증가',
        stageDecreaseLabel: '스테이지 감소',
        pause: '일시정지',
        resume: '재개',
        restart: '다시하기',
        musicOn: '음악켜기',
        musicOff: '음악끄기',
        topScoreLabel: '최고점수',
        globalBoard: '전역 TOP 5',
        localBoard: '로컬 TOP 5',
        loadingRecords: '불러오는 중...',
        rapidFire: '연속발사',
        rapidFireLockedBoss: '보스전 단발 고정',
        help: '사용방법',
        gameOver: '게임 오버',
        victory: '승리!',
        restartHint: '다시하기를 눌러주세요',
        finalBossIncoming: '경고: 거대 우주선 출현',
        finalBossName: '심판의 모함',
        bossFastLabel: '광속 격추',
        bossFastMessage: '순식간에 격추했습니다. 최고 보너스!',
        bossGreatLabel: '정밀 타격',
        bossGreatMessage: '아주 빠르게 처리했습니다. 큰 보너스!',
        bossGoodLabel: '정면 돌파',
        bossGoodMessage: '안정적으로 격추했습니다.',
        bossSlowLabel: '간신히 승리',
        bossSlowMessage: '늦었지만 결국 격추했습니다.',
        newRecordTitle: '점수 기록 저장',
        newRecordPrompt: '이름을 입력하면 점수를 저장하고 현재 순위를 보여줍니다. 원하지 않으면 취소하세요.',
        saveRecordPending: '기록을 저장하는 중입니다...',
        saveRecordFailed: '전역 기록 저장에 실패했습니다. 다시 시도해 주세요.',
        saveRecordFallback: '전역 저장에 실패해 로컬 기록으로 저장했습니다.',
        emptyName: '이름을 입력하거나 취소를 눌러 주세요.',
        invalidName: '이름은 문자, 숫자, 공백, 밑줄(_), 하이픈(-)만 12자까지 사용할 수 있습니다.',
        namePlaceholder: '이름',
        saveRecord: '저장',
        cancelAction: '취소',
        leaderboardTitle: '점수판',
        leaderboardRankUnavailable: '현재 순위를 계산하지 못했습니다.',
        emptyRecord: '아직 기록이 없습니다.',
        stageCanvas: '스테이지',
        languageButton: '한국어',
        closeLabel: '닫기',
        helpTitle: '사용방법',
        helpIntro: '방향키와 스페이스바 또는 터치 조작으로 일반 적과 특수괴물을 모두 물리치세요.',
        startPrompt: '시작 버튼을 눌러 선택한 스테이지에서 게임을 시작하세요.',
        helpMobileTitle: '핸드폰 조작',
        helpMobileBody: '화면을 누른 채 좌우로 움직이면 우주선이 따라 움직입니다. 그 상태에서 다른 손가락으로 탭하면 총알이 발사됩니다. 특수괴물이 던지는 폭탄은 반드시 피해야 합니다.',
        helpDesktopTitle: '키보드 조작',
        helpDesktopBody: '왼쪽/오른쪽 방향키로 이동하고 스페이스바로 발사합니다. P 키 또는 일시 정지 버튼으로 멈출 수 있습니다. 폭탄에 맞으면 즉시 게임 오버입니다.',
        helpTipTitle: '플레이 팁',
        helpTipBody: '총알은 벽과 천장에 튕깁니다. 특수괴물은 스테이지가 올라갈수록 더 많이 나오고 더 단단해집니다. 라이프 에너지를 모두 깎아야 폭파되므로 반사 각도까지 활용해 빠르게 처리하세요.'
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
        start: '开始',
        stageIncreaseLabel: '提高关卡',
        stageDecreaseLabel: '降低关卡',
        pause: '暂停',
        resume: '继续',
        restart: '重新开始',
        musicOn: '开启音乐',
        musicOff: '关闭音乐',
        topScoreLabel: '最高分',
        globalBoard: '全球 TOP 5',
        localBoard: '本地 TOP 5',
        loadingRecords: '正在加载...',
        rapidFire: '连续发射',
        rapidFireLockedBoss: '首领战仅限单发',
        help: '使用方法',
        gameOver: '游戏结束',
        victory: '胜利！',
        restartHint: '请点击重新开始',
        finalBossIncoming: '警报：巨型战舰出现',
        finalBossName: '审判母舰',
        bossFastLabel: '闪电击坠',
        bossFastMessage: '你在极短时间内击坠了它，获得最高奖励！',
        bossGreatLabel: '精准打击',
        bossGreatMessage: '击坠速度很快，获得高额奖励！',
        bossGoodLabel: '正面突破',
        bossGoodMessage: '你稳稳地击坠了它。',
        bossSlowLabel: '险胜',
        bossSlowMessage: '虽然花了些时间，但最终还是击坠了它。',
        newRecordTitle: '保存分数',
        newRecordPrompt: '输入名字后会保存分数并显示当前排名。不想输入的话可以取消。',
        saveRecordPending: '正在保存记录...',
        saveRecordFailed: '保存全球记录失败，请重试。',
        saveRecordFallback: '全球保存失败，已改为保存到本地记录。',
        emptyName: '请输入名字，或者直接取消。',
        invalidName: '名字最多 12 个字符，只能包含文字、数字、空格、下划线和连字符。',
        namePlaceholder: '名字',
        saveRecord: '保存',
        cancelAction: '取消',
        leaderboardTitle: '排行榜',
        leaderboardRankUnavailable: '暂时无法计算当前排名。',
        emptyRecord: '暂无记录。',
        stageCanvas: '关卡',
        languageButton: '中文',
        closeLabel: '关闭',
        helpTitle: '使用方法',
        helpIntro: '使用方向键、空格键或触屏操作，消灭所有普通敌人和特殊怪物。',
        startPrompt: '点击开始按钮，从所选关卡开始游戏。',
        helpMobileTitle: '手机操作',
        helpMobileBody: '按住屏幕后左右滑动即可移动飞船。保持按住时，再用另一根手指点一下，就会发射子弹。特殊怪物投下的炸弹必须立刻躲开。',
        helpDesktopTitle: '键盘操作',
        helpDesktopBody: '使用左右方向键移动，按空格键发射。按 P 键或暂停按钮可以暂停游戏。被炸弹击中会立刻结束游戏。',
        helpTipTitle: '游玩提示',
        helpTipBody: '子弹会在墙壁和顶部反弹。关卡越高，特殊怪物出现得越多、生命越高。必须把它们的生命能量全部打空，它们才会爆炸。'
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
        start: 'Start',
        stageIncreaseLabel: 'Increase stage',
        stageDecreaseLabel: 'Decrease stage',
        pause: 'Pause',
        resume: 'Resume',
        restart: 'Restart',
        musicOn: 'Music On',
        musicOff: 'Music Off',
        topScoreLabel: 'Top Score',
        globalBoard: 'Global Top 5',
        localBoard: 'Local Top 5',
        loadingRecords: 'Loading...',
        rapidFire: 'Rapid Fire',
        rapidFireLockedBoss: 'Boss Fight: Single Shot Only',
        help: 'How To Play',
        gameOver: 'Game Over',
        victory: 'Victory!',
        restartHint: 'Press Restart to play again',
        finalBossIncoming: 'Warning: Giant battleship incoming',
        finalBossName: 'Judgment Mothership',
        bossFastLabel: 'LIGHTNING KILL',
        bossFastMessage: 'You deleted it almost instantly. Maximum bonus.',
        bossGreatLabel: 'PRECISION STRIKE',
        bossGreatMessage: 'Fast takedown. Big bonus awarded.',
        bossGoodLabel: 'FRONTAL BREAK',
        bossGoodMessage: 'Clean takedown. Solid bonus awarded.',
        bossSlowLabel: 'LAST SECOND',
        bossSlowMessage: 'Slow finish, but the mothership is down.',
        newRecordTitle: 'Save Your Score',
        newRecordPrompt: 'Enter your name to save your score and see your rank. You can also cancel.',
        saveRecordPending: 'Saving your record...',
        saveRecordFailed: 'Failed to save the global record. Please try again.',
        saveRecordFallback: 'Global save failed, so the score was saved locally instead.',
        emptyName: 'Enter a name or cancel.',
        invalidName: 'Names can be up to 12 characters and may only use letters, numbers, spaces, underscores, and hyphens.',
        namePlaceholder: 'Name',
        saveRecord: 'Save',
        cancelAction: 'Cancel',
        leaderboardTitle: 'Leaderboard',
        leaderboardRankUnavailable: 'Unable to calculate your current rank.',
        emptyRecord: 'No records yet.',
        stageCanvas: 'Stage',
        languageButton: 'English',
        closeLabel: 'Close',
        helpTitle: 'How To Play',
        helpIntro: 'Defeat every regular enemy and special monster using the arrow keys, the space bar, or touch controls.',
        startPrompt: 'Press Start to begin the game from the selected stage.',
        helpMobileTitle: 'Phone Controls',
        helpMobileBody: 'Press and hold the screen, then drag left or right to move the ship. While holding, tap with another finger to fire. Dodge every bomb dropped by special monsters.',
        helpDesktopTitle: 'Keyboard Controls',
        helpDesktopBody: 'Use the left and right arrow keys to move and press the space bar to fire. Press P or the pause button to pause the game. A bomb hit ends the run immediately.',
        helpTipTitle: 'Play Tip',
        helpTipBody: 'Bullets bounce off the walls and ceiling. Higher stages spawn more special monsters with more life energy, so use rebounds to burn down their health before they can flood the screen with bombs.'
    }
};

function syncHelpPanelVisibility() {
    helpModal.hidden = !helpOpen;
    helpModal.setAttribute('aria-hidden', String(!helpOpen));
    helpBtn.setAttribute('aria-expanded', String(helpOpen));
}

function syncNameModalVisibility() {
    nameModal.hidden = !nameModalOpen;
    nameModal.setAttribute('aria-hidden', String(!nameModalOpen));
}

function syncLeaderboardModalVisibility() {
    leaderboardModal.hidden = !leaderboardModalOpen;
    leaderboardModal.setAttribute('aria-hidden', String(!leaderboardModalOpen));
}

function normalizePlayerName(value) {
    if (typeof value !== 'string') return null;

    const normalized = value
        .normalize('NFKC')
        .replace(/\s+/gu, ' ')
        .trim();
    const truncated = Array.from(normalized).slice(0, MAX_PLAYER_NAME_LENGTH).join('');

    if (!truncated || !/^[\p{L}\p{N} _-]+$/u.test(truncated)) {
        return null;
    }

    return truncated;
}

function sanitizeScoreEntries(entries, limit = Number.POSITIVE_INFINITY) {
    if (!Array.isArray(entries)) return [];

    return entries
        .filter(entry => entry && typeof entry.name === 'string' && Number.isFinite(entry.score))
        .map(entry => ({
            name: normalizePlayerName(entry.name) || 'AAA',
            score: Math.max(0, Math.floor(entry.score))
        }))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Number.isFinite(limit) ? limit : undefined);
}

function sanitizeHighScoreEntries(entries) {
    return sanitizeScoreEntries(entries, MAX_HIGH_SCORES);
}

function sanitizeScoreHistoryEntries(entries) {
    return sanitizeScoreEntries(entries);
}

function loadHighScores() {
    try {
        const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return sanitizeHighScoreEntries(parsed);
    } catch {
        return [];
    }
}

function saveHighScores() {
    try {
        window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(highScores));
    } catch {
        // Ignore storage failures and keep runtime state.
    }
}

function loadScoreHistory() {
    try {
        const raw = window.localStorage.getItem(SCORE_HISTORY_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return sanitizeScoreHistoryEntries(parsed);
    } catch {
        return [];
    }
}

function saveScoreHistory() {
    try {
        window.localStorage.setItem(SCORE_HISTORY_STORAGE_KEY, JSON.stringify(scoreHistory));
    } catch {
        // Ignore storage failures and keep runtime state.
    }
}

function loadVisitStats() {
    try {
        const raw = window.localStorage.getItem(VISIT_STATS_STORAGE_KEY);
        if (!raw) return { today: null, total: null };

        const parsed = JSON.parse(raw);
        return {
            today: Number.isFinite(parsed?.today) ? parsed.today : null,
            total: Number.isFinite(parsed?.total) ? parsed.total : null
        };
    } catch {
        return { today: null, total: null };
    }
}

function saveVisitStats() {
    try {
        window.localStorage.setItem(VISIT_STATS_STORAGE_KEY, JSON.stringify(visitStats));
    } catch {
        // Ignore storage failures and keep runtime state.
    }
}

function generateVisitorId() {
    if (typeof window.crypto?.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        const value = char === 'x' ? random : (random & 0x3) | 0x8;
        return value.toString(16);
    });
}

function getVisitorId() {
    try {
        const existingId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
        if (existingId) return existingId;

        const newId = generateVisitorId();

        window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, newId);
        return newId;
    } catch {
        return generateVisitorId();
    }
}

function getVisitDateString(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function formatCompactNumber(value) {
    if (!Number.isFinite(value)) return '--';

    const locale = currentLanguage === 'ko'
        ? 'ko-KR'
        : currentLanguage === 'zh'
            ? 'zh-CN'
            : 'en-US';

    return new Intl.NumberFormat(locale).format(value);
}

function renderVisitStats() {
    visitTodayLabelEl.textContent = 'Today';
    visitTotalLabelEl.textContent = 'Total';
    visitTodayValueEl.textContent = formatCompactNumber(visitStats.today);
    visitTotalValueEl.textContent = formatCompactNumber(visitStats.total);
}

function createSupabaseClient() {
    const config = window.WEB_INVADER_SUPABASE_CONFIG;
    const url = typeof config?.url === 'string' ? config.url.trim() : '';
    const anonKey = typeof config?.anonKey === 'string' ? config.anonKey.trim() : '';

    if (!url || !anonKey || !window.supabase?.createClient) {
        return null;
    }

    return window.supabase.createClient(url, anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

function mergeHighScoreEntry(entry) {
    return sanitizeHighScoreEntries([...highScores, entry]);
}

function mergeScoreHistoryEntry(entry) {
    return sanitizeScoreHistoryEntries([...scoreHistory, entry]);
}

function getScoreRank(entries, scoreValue) {
    if (!Number.isFinite(scoreValue) || scoreValue <= 0) return null;
    return entries.filter(entry => entry.score > scoreValue).length + 1;
}

function getBoardLabel(source = leaderboardSource) {
    const text = translations[currentLanguage];
    return source === 'global' ? text.globalBoard : text.localBoard;
}

function formatRankMessage(rank, source = leaderboardSource) {
    if (!Number.isFinite(rank) || rank < 1) {
        return getText('leaderboardRankUnavailable');
    }

    const boardLabel = getBoardLabel(source);

    switch (currentLanguage) {
    case 'ko':
        return `${boardLabel} 기준 현재 ${rank}등입니다.`;
    case 'zh':
        return `当前在${boardLabel}中排名第 ${rank} 名。`;
    default:
        return `You ranked #${rank} on the ${boardLabel}.`;
    }
}

function getSpecialEnemyDefeatScore(stageNumber) {
    const difficultyBonus = 30 + stageNumber * 8;
    const durabilityBonus = getSpecialEnemyMaxHealth(stageNumber) * 4;
    const randomBonusCap = 8 + stageNumber * 4;
    const randomBonus = Math.floor(Math.random() * (randomBonusCap + 1));
    const total = difficultyBonus + durabilityBonus + randomBonus;
    let label = '';

    if (randomBonus >= Math.max(6, Math.floor(randomBonusCap * 0.8))) {
        label = 'LUCKY SHOT';
    } else if (stageNumber >= 4 || total >= 105) {
        label = 'CRITICAL';
    }

    return {
        total,
        randomBonus,
        label
    };
}

function getBossDefeatScore(elapsedFrames) {
    const elapsedSeconds = elapsedFrames / 60;

    if (elapsedSeconds <= 8) {
        return { total: 1600, labelKey: 'bossFastLabel', messageKey: 'bossFastMessage' };
    }

    if (elapsedSeconds <= 14) {
        return { total: 1200, labelKey: 'bossGreatLabel', messageKey: 'bossGreatMessage' };
    }

    if (elapsedSeconds <= 22) {
        return { total: 850, labelKey: 'bossGoodLabel', messageKey: 'bossGoodMessage' };
    }

    return { total: 500, labelKey: 'bossSlowLabel', messageKey: 'bossSlowMessage' };
}

function spawnScorePopup(x, y, amount, label = '') {
    const isLuckyShot = label === 'LUCKY SHOT';
    const isCritical = label === 'CRITICAL';

    scorePopups.push({
        x,
        y,
        amount,
        label,
        life: SCORE_POPUP_LIFETIME,
        maxLife: SCORE_POPUP_LIFETIME,
        driftX: (Math.random() - 0.5) * 0.35,
        driftY: -1.03,
        color: amount >= 120 ? '#ffe066' : '#62f4ff',
        labelColor: isLuckyShot ? '#fff4a3' : isCritical ? '#ffd0dc' : '#fff4b3',
        labelGlow: isLuckyShot ? '#62f4ff' : isCritical ? '#ff5fb7' : '#ff8ac6'
    });
}

function isBossPhaseActive() {
    return Boolean(finalBoss && finalBoss.alive);
}

function updateScorePopups() {
    scorePopups = scorePopups
        .map(popup => ({
            ...popup,
            x: popup.x + popup.driftX,
            y: popup.y + popup.driftY,
            life: popup.life - 1
        }))
        .filter(popup => popup.life > 0);
}

function setNameModalStatus(statusKey = null) {
    nameModalStatusKey = statusKey;
    nameModalTextEl.textContent = getText(statusKey || 'newRecordPrompt');
}

function renderLeaderboardModal() {
    leaderboardModalTitleEl.textContent = getText('leaderboardTitle');
    leaderboardModalListEl.replaceChildren();

    if (!leaderboardModalResult) {
        leaderboardModalTextEl.textContent = getText('emptyRecord');
        return;
    }

    leaderboardModalTextEl.textContent = formatRankMessage(
        leaderboardModalResult.rank,
        leaderboardModalResult.source
    );

    const displayEntries = Array.isArray(leaderboardModalResult.entries)
        ? leaderboardModalResult.entries.slice(0, MAX_HIGH_SCORES)
        : [];
    const shouldAppendCurrentEntry = Number.isFinite(leaderboardModalResult.rank)
        && leaderboardModalResult.rank > MAX_HIGH_SCORES;

    const rows = displayEntries.map((entry, index) => ({
        rank: index + 1,
        entry,
        isCurrent: Number.isFinite(leaderboardModalResult.rank) && leaderboardModalResult.rank === index + 1
            && entry.name === leaderboardModalResult.entry.name
            && entry.score === leaderboardModalResult.entry.score
    }));

    if (shouldAppendCurrentEntry) {
        rows.push({
            rank: leaderboardModalResult.rank,
            entry: leaderboardModalResult.entry,
            isCurrent: true
        });
    }

    rows.forEach(({ rank, entry, isCurrent }) => {
        const item = document.createElement('li');
        item.className = `leaderboard-row${isCurrent ? ' is-current' : ''}`;

        const rankEl = document.createElement('span');
        rankEl.className = 'leaderboard-rank';
        rankEl.textContent = `${rank}.`;

        const nameEl = document.createElement('span');
        nameEl.className = 'leaderboard-name';
        nameEl.textContent = entry.name;

        const scoreValueEl = document.createElement('span');
        scoreValueEl.className = 'leaderboard-score';
        scoreValueEl.textContent = String(entry.score);

        item.append(rankEl, nameEl, scoreValueEl);
        leaderboardModalListEl.append(item);
    });
}

function openLeaderboardModal(result) {
    leaderboardModalResult = result;
    leaderboardModalOpen = true;
    renderLeaderboardModal();
    syncLeaderboardModalVisibility();
}

function closeLeaderboardModal() {
    leaderboardModalOpen = false;
    syncLeaderboardModalVisibility();
}

async function refreshHighScores() {
    if (!supabaseClient) {
        leaderboardSource = 'local';
        leaderboardLoading = false;
        highScores = sanitizeHighScoreEntries(scoreHistory.length ? scoreHistory : loadHighScores());
        renderLeaderboard();
        return;
    }

    leaderboardLoading = true;
    renderLeaderboard();

    const { data, error } = await supabaseClient
        .from(SUPABASE_TABLE_NAME)
        .select('player_name, score, created_at')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(MAX_HIGH_SCORES);

    if (error) {
        leaderboardSource = 'local';
        leaderboardLoading = false;
        highScores = sanitizeHighScoreEntries(scoreHistory.length ? scoreHistory : loadHighScores());
        renderLeaderboard();
        return;
    }

    highScores = sanitizeHighScoreEntries(
        data.map(entry => ({
            name: entry.player_name,
            score: entry.score
        }))
    );
    saveHighScores();
    leaderboardSource = 'global';
    leaderboardLoading = false;
    renderLeaderboard();
}

async function fetchRemoteRank(scoreValue) {
    const { count, error } = await supabaseClient
        .from(SUPABASE_TABLE_NAME)
        .select('score', { count: 'exact', head: true })
        .gt('score', scoreValue);

    if (error) {
        const visibleIndex = highScores.findIndex(entry => entry.score === scoreValue);
        return visibleIndex >= 0 ? visibleIndex + 1 : null;
    }

    return (count ?? 0) + 1;
}

async function refreshVisitStats() {
    renderVisitStats();

    if (!supabaseClient) {
        return;
    }

    const visitorId = getVisitorId();
    const visitDate = getVisitDateString();

    const { error: insertError } = await supabaseClient
        .from(VISIT_COUNTER_TABLE_NAME)
        .insert({
            visit_date: visitDate,
            visitor_id: visitorId
        });

    if (insertError && insertError.code !== '23505') {
        return;
    }

    const [todayResult, totalResult] = await Promise.all([
        supabaseClient
            .from(VISIT_COUNTER_TABLE_NAME)
            .select('visitor_id', { count: 'exact', head: true })
            .eq('visit_date', visitDate),
        supabaseClient
            .from(VISIT_COUNTER_TABLE_NAME)
            .select('visitor_id', { count: 'exact', head: true })
    ]);

    if (todayResult.error || totalResult.error) {
        return;
    }

    visitStats = {
        today: todayResult.count ?? null,
        total: totalResult.count ?? null
    };
    saveVisitStats();
    renderVisitStats();
}

async function submitHighScore(entry) {
    const normalizedName = normalizePlayerName(entry.name) || 'AAA';
    const normalizedEntry = {
        name: normalizedName,
        score: Math.max(0, Math.floor(entry.score))
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.functions.invoke(SUPABASE_SUBMIT_SCORE_FUNCTION, {
            body: {
                playerName: normalizedEntry.name,
                score: normalizedEntry.score
            }
        });

        if (error) {
            scoreHistory = mergeScoreHistoryEntry(normalizedEntry);
            highScores = mergeHighScoreEntry(normalizedEntry);
            saveScoreHistory();
            saveHighScores();
            leaderboardSource = 'local';
            leaderboardLoading = false;
            renderLeaderboard();
            return {
                storedRemotely: false,
                rank: getScoreRank(scoreHistory, normalizedEntry.score),
                entry: normalizedEntry,
                entries: highScores,
                source: 'local'
            };
        }

        scoreHistory = mergeScoreHistoryEntry(normalizedEntry);
        saveScoreHistory();
        await refreshHighScores();
        return {
            storedRemotely: true,
            rank: await fetchRemoteRank(normalizedEntry.score),
            entry: normalizedEntry,
            entries: highScores,
            source: 'global'
        };
    }

    scoreHistory = mergeScoreHistoryEntry(normalizedEntry);
    highScores = mergeHighScoreEntry(normalizedEntry);
    saveScoreHistory();
    saveHighScores();
    leaderboardSource = 'local';
    renderLeaderboard();
    return {
        storedRemotely: false,
        rank: getScoreRank(scoreHistory, normalizedEntry.score),
        entry: normalizedEntry,
        entries: highScores,
        source: 'local'
    };
}

function renderLeaderboard() {
    const text = translations[currentLanguage];
    const boardLabel = leaderboardSource === 'global' ? text.globalBoard : text.localBoard;

    if (leaderboardLoading) {
        marqueeHighScoreEl.textContent = `${boardLabel}  ${text.loadingRecords}`;
        return;
    }

    const entries = Array.from({ length: MAX_HIGH_SCORES }, (_, index) => {
        const entry = highScores[index];
        return entry
            ? `${index + 1}. ${entry.name} ${entry.score}`
            : `${index + 1}. ---`;
    });

    marqueeHighScoreEl.textContent = `${boardLabel}  ${entries.join('  |  ')}`;
}

function maybePromptScoreSubmission() {
    if (!gameOver || pendingScoreSubmission) return;

    pendingScoreSubmission = { score };
    nameInput.value = '';
    setNameModalStatus();
    nameModalOpen = true;
    syncNameModalVisibility();
}

function closeNameModal() {
    nameModalOpen = false;
    syncNameModalVisibility();
}

function cancelScoreSubmission() {
    pendingScoreSubmission = null;
    nameInput.value = '';
    nameSaveBtn.disabled = false;
    setNameModalStatus();
    closeNameModal();
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

function playTimedSound(frequency, duration, type = 'sine', volume = 0.18, delay = 0) {
    if (audioContext.state === 'suspended') return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = audioContext.currentTime + delay;

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

function playShootSound() {
    playSound(800, 0.1, 'square');
}

function playExplosionSound() {
    playSound(200, 0.3, 'sawtooth');
}

function playPlayerExplosionSound() {
    playSound(140, 0.8, 'sawtooth');
    playSound(72, 1.05, 'triangle');
    playSound(210, 0.65, 'sawtooth');
    playSound(320, 0.32, 'square');
}

function playBossExplosionSound() {
    playTimedSound(62, 1.4, 'sawtooth', 0.28, 0);
    playTimedSound(92, 1.15, 'triangle', 0.2, 0.05);
    playTimedSound(180, 0.72, 'square', 0.12, 0.1);
    playTimedSound(340, 0.28, 'sawtooth', 0.09, 0.18);
}

function playBonusScoreSound(label) {
    if (label === 'CRITICAL') {
        playTimedSound(170, 0.28, 'sawtooth', 0.17, 0);
        playTimedSound(255, 0.2, 'square', 0.12, 0.05);
        playTimedSound(410, 0.18, 'triangle', 0.1, 0.12);
        return;
    }

    if (label === 'LUCKY SHOT') {
        playTimedSound(620, 0.14, 'square', 0.12, 0);
        playTimedSound(840, 0.15, 'triangle', 0.11, 0.06);
        playTimedSound(1080, 0.2, 'sine', 0.1, 0.13);
    }
}

function syncStageControls() {
    const stageControlsEnabled = !gameStarted || paused;
    stageDownBtn.disabled = !stageControlsEnabled;
    stageUpBtn.disabled = !stageControlsEnabled;
    startBtn.disabled = !stageControlsEnabled;
    pauseBtn.disabled = !gameStarted || gameOver;
    restartBtn.disabled = !gameStarted || (!paused && !gameOver);
    rapidFireCheckbox.disabled = isBossPhaseActive();
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

async function syncBackgroundMusic() {
    if (musicOn && gameStarted && !paused && !gameOver) {
        await startBackgroundMusic();
        return;
    }

    stopBackgroundMusic();
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
const enemyGapX = 10;
const enemyGapY = 10;
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
    },
    {
        name: { ko: '오로라 볼트', zh: '极光风暴', en: 'Aurora Volt' },
        skyTop: '#041d1e',
        skyBottom: '#01070d',
        bloom: 'rgba(123, 255, 214, 0.24)',
        grid: 'rgba(112, 255, 221, 0.14)',
        glow: 'rgba(61, 240, 255, 0.14)',
        accent: '#7bffd6',
        detail: '#d9fff5',
        shellTop: '#245152',
        shellBottom: '#0b1d27',
        shellGlow: 'rgba(123, 255, 214, 0.3)',
        cabinetGlow: 'rgba(61, 240, 255, 0.22)',
        motif: 'aurora'
    },
    {
        name: { ko: '아이언 메일스트롬', zh: '钢铁风暴眼', en: 'Iron Maelstrom' },
        skyTop: '#171717',
        skyBottom: '#030303',
        bloom: 'rgba(255, 70, 70, 0.2)',
        grid: 'rgba(255, 120, 120, 0.12)',
        glow: 'rgba(255, 210, 120, 0.1)',
        accent: '#ff6e6e',
        detail: '#ffe0a3',
        shellTop: '#4d3831',
        shellBottom: '#160f0d',
        shellGlow: 'rgba(255, 110, 110, 0.32)',
        cabinetGlow: 'rgba(255, 180, 90, 0.2)',
        motif: 'storm'
    },
    {
        name: { ko: '황혼 함대', zh: '黄昏舰队', en: 'Dusk Armada' },
        skyTop: '#060b1d',
        skyBottom: '#010206',
        bloom: 'rgba(255, 205, 92, 0.22)',
        grid: 'rgba(120, 180, 255, 0.14)',
        glow: 'rgba(255, 205, 92, 0.12)',
        accent: '#ffd464',
        detail: '#eaf4ff',
        shellTop: '#3a425f',
        shellBottom: '#111522',
        shellGlow: 'rgba(255, 212, 100, 0.32)',
        cabinetGlow: 'rgba(120, 180, 255, 0.22)',
        motif: 'fleet'
    }
];
const stageFormations = [
    [
        '0001111000',
        '0011111100',
        '0111111110',
        '1110011111',
        '1100000011'
    ],
    [
        '1111111111',
        '1100000011',
        '1110110111',
        '1100000011',
        '1111111111'
    ],
    [
        '1000000001',
        '1100000011',
        '1110000111',
        '1111001111',
        '1111111111'
    ],
    [
        '1100110011',
        '1111111111',
        '0111111110',
        '0011111100',
        '0001111000'
    ],
    [
        '1011001101',
        '0111111110',
        '0011111100',
        '0111111110',
        '1011001101'
    ],
    [
        '1110011111',
        '1111111111',
        '0111111110',
        '1111111111',
        '1110011111'
    ],
    [
        '1111111111',
        '1110110111',
        '1111111111',
        '1101111011',
        '1111111111'
    ],
    [
        '1111111111',
        '1110011111',
        '1111111111',
        '1110011111',
        '1111111111'
    ]
];
const stageSpecialConfigs = [
    {
        name: { ko: '네온 감시자', zh: '霓虹监察者', en: 'Neon Sentinel' },
        body: '#5af7ff',
        accent: '#c8feff',
        glow: 'rgba(90, 247, 255, 0.28)',
        bomb: '#62f4ff',
        style: 'sentinel'
    },
    {
        name: { ko: '선셋 포트리스', zh: '落日堡垒', en: 'Sunset Fortress' },
        body: '#ff9b54',
        accent: '#ffe2a8',
        glow: 'rgba(255, 155, 84, 0.28)',
        bomb: '#ffd166',
        style: 'fortress'
    },
    {
        name: { ko: '심해 레비아탄', zh: '深海利维坦', en: 'Deepsea Leviathan' },
        body: '#53d3ff',
        accent: '#86fff1',
        glow: 'rgba(83, 211, 255, 0.24)',
        bomb: '#86fff1',
        style: 'leviathan'
    },
    {
        name: { ko: '용암 기갑병', zh: '熔火装甲兵', en: 'Lava Juggernaut' },
        body: '#ff6b3d',
        accent: '#ffd7a1',
        glow: 'rgba(255, 107, 61, 0.24)',
        bomb: '#ffb066',
        style: 'juggernaut'
    },
    {
        name: { ko: '리프트 군주', zh: '裂隙领主', en: 'Rift Overlord' },
        body: '#c084ff',
        accent: '#ff90e8',
        glow: 'rgba(192, 132, 255, 0.28)',
        bomb: '#ff90e8',
        style: 'overlord'
    },
    {
        name: { ko: '오로라 파동체', zh: '极光脉冲体', en: 'Aurora Warden' },
        body: '#7bffd6',
        accent: '#d9fff5',
        glow: 'rgba(123, 255, 214, 0.28)',
        bomb: '#8fffe8',
        style: 'sentinel'
    },
    {
        name: { ko: '메일스트롬 타이탄', zh: '风暴泰坦', en: 'Maelstrom Titan' },
        body: '#ff6e6e',
        accent: '#ffe0a3',
        glow: 'rgba(255, 110, 110, 0.3)',
        bomb: '#ffc16e',
        style: 'juggernaut'
    },
    {
        name: { ko: '전위 호위기', zh: '前卫护航舰', en: 'Vanguard Escort' },
        body: '#ffd464',
        accent: '#eaf4ff',
        glow: 'rgba(255, 212, 100, 0.3)',
        bomb: '#ff9f5c',
        style: 'fortress'
    }
];
let enemyDirection = 1;
const bulletSpeed = 3.25;
const playerSpeed = 5;
const specialEnemyWidth = 64;
const specialEnemyHeight = 44;
const finalBossWidth = 144;
const finalBossHeight = 96;
const bombRadius = 7;

function changeStageSelection(direction) {
    if (gameStarted && !paused) return;

    stage = Math.max(1, Math.min(MAX_STAGE, stage + direction));
    updateUI();
    applyStageTheme();
}

function init(startStage = stage) {
    player.x = canvas.width / 2 - player.width / 2;
    bullets = [];
    enemies = [];
    specialEnemies = [];
    finalBoss = null;
    enemyBombs = [];
    score = 0;
    stage = startStage;
    gameOver = false;
    gameOverReason = null;
    gameStarted = true;
    paused = false;
    musicOn = true;
    bulletReady = true;
    enemyDirection = 1;
    moveTouchId = null;
    fireTouchIds = new Set();
    playerExplosion = null;
    pendingScoreSubmission = null;
    leaderboardModalResult = null;
    frameCount = 0;
    bossFightStartFrame = null;
    bossDefeatSummary = null;
    remainingSpecialSpawns = getSpecialSpawnCount(stage);
    specialSpawnCooldown = 150;
    specialEnemyIdCounter = 0;
    scorePopups = [];
    closeNameModal();
    closeLeaderboardModal();
    syncLanguageUI();
    updateUI();
    applyStageTheme();
    syncBackgroundMusic();
    syncStageControls();
    enemies = createEnemiesForStage(stage);
}

function updateUI() {
    scoreEl.querySelector('.hud-value').textContent = String(score);
    stageEl.querySelector('.hud-value').textContent = String(stage);
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

    specialEnemies.forEach(enemy => {
        if (enemy.alive) {
            drawSpecialEnemy(enemy);
        }
    });
    if (finalBoss?.alive) {
        drawFinalBoss(finalBoss);
    }

    enemyBombs.forEach(drawEnemyBomb);
    drawScorePopups();

    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 34px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(getText('start'), canvas.width / 2, canvas.height / 2 - 12);
        ctx.fillStyle = '#62f4ff';
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText(getText('startPrompt'), canvas.width / 2, canvas.height / 2 + 28);
        return;
    }

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
        if (gameOverReason === 'victory' && bossDefeatSummary) {
            ctx.fillStyle = '#ffd464';
            ctx.font = 'bold 21px "Courier New", monospace';
            ctx.fillText(`+${bossDefeatSummary.total}  ${getText(bossDefeatSummary.labelKey)}`, canvas.width / 2, canvas.height / 2 + 78);
            ctx.fillStyle = '#eaf4ff';
            ctx.font = '16px "Courier New", monospace';
            ctx.fillText(getText(bossDefeatSummary.messageKey), canvas.width / 2, canvas.height / 2 + 108);
        }
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
    startBtn.textContent = text.start;
    stageUpBtn.setAttribute('aria-label', text.stageIncreaseLabel);
    stageDownBtn.setAttribute('aria-label', text.stageDecreaseLabel);
    pauseBtn.textContent = paused ? text.resume : text.pause;
    restartBtn.textContent = text.restart;
    musicBtn.textContent = musicOn ? text.musicOff : text.musicOn;
    rapidFireLabelEl.textContent = isBossPhaseActive() ? text.rapidFireLockedBoss : text.rapidFire;
    rapidFireCheckbox.checked = rapidFireEnabled;
    helpBtn.textContent = text.help;
    languageBtn.textContent = text.languageButton;
    nameModalTitleEl.textContent = text.newRecordTitle;
    nameModalTextEl.textContent = text.newRecordPrompt;
    nameInput.placeholder = text.namePlaceholder;
    nameCancelBtn.textContent = text.cancelAction;
    nameSaveBtn.textContent = text.saveRecord;
    leaderboardModalTitleEl.textContent = text.leaderboardTitle;
    helpTitleEl.textContent = text.helpTitle;
    helpCloseBtn.setAttribute('aria-label', text.closeLabel);
    nameCloseBtn.setAttribute('aria-label', text.closeLabel);
    leaderboardCloseBtn.setAttribute('aria-label', text.closeLabel);
    helpIntroEl.textContent = text.helpIntro;
    helpMobileTitleEl.textContent = text.helpMobileTitle;
    helpMobileBodyEl.textContent = text.helpMobileBody;
    helpDesktopTitleEl.textContent = text.helpDesktopTitle;
    helpDesktopBodyEl.textContent = text.helpDesktopBody;
    helpTipTitleEl.textContent = text.helpTipTitle;
    helpTipBodyEl.textContent = text.helpTipBody;
    setNameModalStatus(nameModalStatusKey);
    syncHelpPanelVisibility();
    syncNameModalVisibility();
    renderLeaderboardModal();
    syncLeaderboardModalVisibility();
    renderVisitStats();
    renderLeaderboard();
    syncStageControls();
}

function getStageTheme() {
    return stageThemes[stage - 1] || stageThemes[stageThemes.length - 1];
}

function getStageSpecialConfig(stageNumber) {
    return stageSpecialConfigs[stageNumber - 1] || stageSpecialConfigs[stageSpecialConfigs.length - 1];
}

function getLocalizedSpecialEnemyName(stageNumber) {
    return getStageSpecialConfig(stageNumber).name[currentLanguage];
}

function getStageFormation(stageNumber) {
    return stageFormations[stageNumber - 1] || stageFormations[stageFormations.length - 1];
}

function getSpecialSpawnCount(stageNumber) {
    return Math.min(7, 1 + Math.floor(stageNumber * 0.9));
}

function getSpecialEnemyMaxHealth(stageNumber) {
    return 2 + stageNumber + Math.floor(stageNumber / 3);
}

function getSpecialEnemySpeed(stageNumber) {
    return 1.05 + stageNumber * 0.22;
}

function getSpecialEnemyBombSpeed(stageNumber) {
    return 2.5 + stageNumber * 0.28;
}

function getSpecialEnemySpawnDelay(stageNumber) {
    return Math.max(70, 230 - stageNumber * 20);
}

function getSpecialEnemyFireDelay(stageNumber) {
    return Math.max(60, 180 - stageNumber * 16);
}

function getSpecialEnemyConcurrentLimit(stageNumber) {
    return Math.min(4, 1 + Math.floor((stageNumber + 1) / 2));
}

function getEnemyAdvanceSpeed(stageNumber) {
    return 0.45 + stageNumber * 0.4;
}

function getEnemyDropDistance(stageNumber) {
    return 18 + Math.floor(stageNumber / 2) * 2;
}

function createEnemiesForStage(stageNumber) {
    const formation = getStageFormation(stageNumber);
    const formationWidth = enemyCols * enemyWidth + (enemyCols - 1) * enemyGapX;
    const startX = Math.max(20, Math.floor((canvas.width - formationWidth) / 2));
    const startY = 50;
    const spawnedEnemies = [];

    formation.forEach((rowPattern, rowIndex) => {
        Array.from(rowPattern).forEach((cell, colIndex) => {
            if (cell !== '1') return;

            spawnedEnemies.push({
                x: startX + colIndex * (enemyWidth + enemyGapX),
                y: startY + rowIndex * (enemyHeight + enemyGapY),
                width: enemyWidth,
                height: enemyHeight,
                alive: true
            });
        });
    });

    return spawnedEnemies;
}

function createSpecialEnemy(stageNumber) {
    const spawnOnLeft = Math.random() < 0.5;
    const y = 76 + Math.random() * 84;
    const direction = spawnOnLeft ? 1 : -1;
    const x = spawnOnLeft ? 30 : canvas.width - specialEnemyWidth - 30;

    return {
        id: ++specialEnemyIdCounter,
        x,
        y,
        width: specialEnemyWidth,
        height: specialEnemyHeight,
        alive: true,
        direction,
        speed: getSpecialEnemySpeed(stageNumber),
        health: getSpecialEnemyMaxHealth(stageNumber),
        maxHealth: getSpecialEnemyMaxHealth(stageNumber),
        bobOffset: Math.random() * Math.PI * 2,
        fireCooldown: getSpecialEnemyFireDelay(stageNumber) + Math.floor(Math.random() * 50)
    };
}

function maybeSpawnSpecialEnemy() {
    if (remainingSpecialSpawns <= 0) return;
    if (specialEnemies.filter(enemy => enemy.alive).length >= getSpecialEnemyConcurrentLimit(stage)) return;

    if (specialSpawnCooldown > 0) {
        specialSpawnCooldown--;
        return;
    }

    specialEnemies.push(createSpecialEnemy(stage));
    remainingSpecialSpawns--;
    specialSpawnCooldown = getSpecialEnemySpawnDelay(stage);
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

    if (theme.motif === 'aurora') {
        for (let band = 0; band < 4; band++) {
            ctx.strokeStyle = band % 2 === 0 ? 'rgba(123, 255, 214, 0.2)' : 'rgba(217, 255, 245, 0.16)';
            ctx.lineWidth = 10 - band * 2;
            ctx.beginPath();
            for (let x = 0; x <= canvas.width; x += 24) {
                const y = 70 + band * 34 + Math.sin((x + band * 30) * 0.02) * 18;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
    }

    if (theme.motif === 'storm') {
        ctx.strokeStyle = 'rgba(255, 224, 163, 0.2)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const originX = 110 + i * 130;
            ctx.beginPath();
            ctx.moveTo(originX, 30);
            ctx.lineTo(originX - 18, 95);
            ctx.lineTo(originX + 10, 95);
            ctx.lineTo(originX - 24, 170);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 110, 110, 0.12)';
        for (let i = 0; i < 7; i++) {
            ctx.fillRect(40 + i * 108, 190 + (i % 2) * 24, 46, 14);
        }
    }

    if (theme.motif === 'fleet') {
        ctx.fillStyle = 'rgba(255, 212, 100, 0.12)';
        for (let i = 0; i < 5; i++) {
            const offset = i * 148;
            ctx.fillRect(50 + offset, 74, 76, 12);
            ctx.fillRect(66 + offset, 86, 44, 10);
            ctx.fillRect(82 + offset, 60, 12, 14);
        }

        ctx.strokeStyle = 'rgba(234, 244, 255, 0.18)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(80 + i * 190, 140);
            ctx.lineTo(150 + i * 190, 210);
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
    ctx.fillRect(18, 14, 274, 64);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 14, 274, 64);
    ctx.fillStyle = theme.detail;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${getText('stageCanvas')} ${stage}`, 32, 32);
    ctx.fillStyle = theme.accent;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(getLocalizedThemeName(theme), 32, 49);
    ctx.fillStyle = 'rgba(248, 241, 215, 0.9)';
    ctx.font = '11px "Courier New", monospace';
    const bossIncoming = stage === FINAL_BOSS_STAGE
        && enemies.every(enemy => !enemy.alive)
        && specialEnemies.every(enemy => !enemy.alive)
        && remainingSpecialSpawns === 0
        && !finalBoss;

    if (isBossPhaseActive()) {
        ctx.fillText(`${getText('finalBossName')}  HP ${finalBoss.health}/${finalBoss.maxHealth}`, 32, 66);
    } else if (bossIncoming) {
        ctx.fillText(getText('finalBossIncoming'), 32, 66);
    } else {
        ctx.fillText(`${getLocalizedSpecialEnemyName(stage)}  HP ${getSpecialEnemyMaxHealth(stage)}  x${getSpecialSpawnCount(stage)}`, 32, 66);
    }
    ctx.restore();
}

function drawPixelShip(x, y, baseColor, accentColor) {
    const scale = player.width / PLAYER_BASE_WIDTH;

    ctx.fillStyle = baseColor;
    ctx.fillRect(x + 8 * scale, y + 16 * scale, 34 * scale, 10 * scale);
    ctx.fillRect(x + 16 * scale, y + 8 * scale, 18 * scale, 8 * scale);
    ctx.fillRect(x + 22 * scale, y, 6 * scale, 8 * scale);

    ctx.fillStyle = accentColor;
    ctx.fillRect(x + 22 * scale, y + 12 * scale, 6 * scale, 8 * scale);
    ctx.fillRect(x + 4 * scale, y + 20 * scale, 8 * scale, 6 * scale);
    ctx.fillRect(x + 38 * scale, y + 20 * scale, 8 * scale, 6 * scale);
}

function createPlayerExplosion() {
    const scale = player.width / PLAYER_BASE_WIDTH;
    const particles = [];
    const blocks = [
        { x: 8 * scale, y: 16 * scale, width: 34 * scale, height: 10 * scale, color: '#5eff9b' },
        { x: 16 * scale, y: 8 * scale, width: 18 * scale, height: 8 * scale, color: '#5eff9b' },
        { x: 22 * scale, y: 0, width: 6 * scale, height: 8 * scale, color: '#5eff9b' },
        { x: 22 * scale, y: 12 * scale, width: 6 * scale, height: 8 * scale, color: '#d9ffe5' },
        { x: 4 * scale, y: 20 * scale, width: 8 * scale, height: 6 * scale, color: '#d9ffe5' },
        { x: 38 * scale, y: 20 * scale, width: 8 * scale, height: 6 * scale, color: '#d9ffe5' }
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
    syncStageControls();
    stopBackgroundMusic();
    playerExplosion = createPlayerExplosion();
    ensureAudioReady();
    playPlayerExplosionSound();
    maybePromptScoreSubmission();
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

function drawEnergyBar(x, y, width, progress, color) {
    ctx.fillStyle = 'rgba(3, 8, 12, 0.72)';
    ctx.fillRect(x, y, width, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * progress), 4);
}

function getSpecialEnemyRenderY(enemy) {
    return enemy.y + Math.sin(frameCount * 0.08 + enemy.bobOffset) * 1.8;
}

function drawSpecialEnemy(enemy) {
    const config = getStageSpecialConfig(stage);
    const x = enemy.x;
    const y = getSpecialEnemyRenderY(enemy);

    ctx.save();
    ctx.shadowColor = config.glow;
    ctx.shadowBlur = 14;
    ctx.fillStyle = config.body;

    if (config.style === 'sentinel') {
        ctx.fillRect(x + 12, y + 6, 40, 10);
        ctx.fillRect(x + 6, y + 16, 52, 12);
        ctx.fillRect(x + 14, y + 28, 36, 8);
        ctx.fillRect(x, y + 18, 6, 10);
        ctx.fillRect(x + 58, y + 18, 6, 10);
    } else if (config.style === 'fortress') {
        ctx.fillRect(x + 6, y + 6, 52, 12);
        ctx.fillRect(x, y + 18, 64, 12);
        ctx.fillRect(x + 10, y + 30, 18, 10);
        ctx.fillRect(x + 36, y + 30, 18, 10);
    } else if (config.style === 'leviathan') {
        ctx.fillRect(x + 16, y + 4, 30, 8);
        ctx.fillRect(x + 8, y + 12, 46, 10);
        ctx.fillRect(x + 4, y + 22, 56, 10);
        ctx.fillRect(x, y + 32, 16, 8);
        ctx.fillRect(x + 48, y + 32, 16, 8);
    } else if (config.style === 'juggernaut') {
        ctx.fillRect(x + 16, y + 2, 32, 10);
        ctx.fillRect(x + 8, y + 12, 48, 12);
        ctx.fillRect(x, y + 24, 64, 12);
        ctx.fillRect(x + 12, y + 36, 12, 8);
        ctx.fillRect(x + 40, y + 36, 12, 8);
    } else {
        ctx.fillRect(x + 24, y, 16, 8);
        ctx.fillRect(x + 10, y + 8, 44, 10);
        ctx.fillRect(x, y + 18, 64, 12);
        ctx.fillRect(x + 10, y + 30, 16, 10);
        ctx.fillRect(x + 38, y + 30, 16, 10);
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = config.accent;
    ctx.fillRect(x + 18, y + 12, 10, 6);
    ctx.fillRect(x + 36, y + 12, 10, 6);
    ctx.fillRect(x + 28, y + 24, 8, 6);

    drawEnergyBar(x + 6, y - 10, enemy.width - 12, enemy.health / enemy.maxHealth, config.accent);
    ctx.restore();
}

function drawFinalBoss(enemy) {
    const x = enemy.x;
    const y = enemy.y + Math.sin(frameCount * 0.045) * 4;

    ctx.save();
    ctx.shadowColor = 'rgba(255, 212, 100, 0.4)';
    ctx.shadowBlur = 22;

    ctx.fillStyle = '#ffd464';
    ctx.fillRect(x + 56, y, 32, 12);
    ctx.fillRect(x + 28, y + 12, 88, 18);
    ctx.fillRect(x + 12, y + 30, 120, 20);
    ctx.fillRect(x, y + 50, 144, 20);
    ctx.fillRect(x + 18, y + 70, 32, 18);
    ctx.fillRect(x + 94, y + 70, 32, 18);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#eaf4ff';
    ctx.fillRect(x + 30, y + 34, 18, 8);
    ctx.fillRect(x + 96, y + 34, 18, 8);
    ctx.fillRect(x + 61, y + 18, 22, 10);
    ctx.fillRect(x + 66, y + 52, 12, 14);

    drawEnergyBar(x + 12, y - 14, enemy.width - 24, enemy.health / enemy.maxHealth, '#ffd464');
    ctx.restore();
}

function drawScorePopups() {
    ctx.save();
    ctx.textAlign = 'center';

    scorePopups.forEach(popup => {
        const progress = 1 - popup.life / popup.maxLife;
        const alpha = progress < 0.5
            ? 1
            : Math.max(0, 1 - (progress - 0.5) / 0.5);
        let amountScale = 1.05;
        let labelScale = 1.2;

        if (progress < 0.18) {
            const intro = progress / 0.18;
            amountScale = 0.75 + intro * 1.25;
            labelScale = 0.9 + intro * 1.4;
        } else if (progress < 0.42) {
            const settle = (progress - 0.18) / 0.24;
            amountScale = 2 - settle * 0.78;
            labelScale = 2.3 - settle * 0.95;
        } else {
            const fadeSettle = (progress - 0.42) / 0.58;
            amountScale = 1.22 - fadeSettle * 0.24;
            labelScale = 1.35 - fadeSettle * 0.28;
        }

        ctx.globalAlpha = Math.min(1, alpha * 1.15);
        ctx.shadowColor = popup.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = popup.color;
        ctx.font = `bold ${Math.round(24 * amountScale)}px "Courier New", monospace`;
        ctx.fillText(`+${popup.amount}`, popup.x, popup.y);

        if (popup.label) {
            ctx.globalAlpha = Math.min(1, alpha * 0.95);
            ctx.shadowColor = popup.labelGlow;
            ctx.shadowBlur = 16;
            ctx.fillStyle = popup.labelColor;
            ctx.font = `bold ${Math.round(16 * labelScale)}px "Courier New", monospace`;
            ctx.fillText(popup.label, popup.x, popup.y - (24 + labelScale * 6));
        }
    });

    ctx.restore();
}

function drawEnemyBomb(bomb) {
    ctx.save();
    ctx.fillStyle = bomb.color;
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, bomb.radius || bombRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 248, 220, 0.7)';
    ctx.beginPath();
    ctx.arc(bomb.x - 2, bomb.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function launchEnemyBomb(enemy) {
    const config = getStageSpecialConfig(stage);
    const originX = enemy.x + enemy.width / 2;
    const originY = enemy.y + enemy.height;
    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;
    const dx = targetX - originX;
    const dy = targetY - originY;
    const magnitude = Math.hypot(dx, dy) || 1;
    const speed = getSpecialEnemyBombSpeed(stage);

    enemyBombs.push({
        x: originX,
        y: originY,
        vx: (dx / magnitude) * speed,
        vy: Math.max(1.9, (dy / magnitude) * speed),
        color: config.bomb,
        radius: bombRadius
    });
}

function launchFinalBossBombVolley(enemy) {
    const originX = enemy.x + enemy.width / 2;
    const originY = enemy.y + enemy.height - 10;
    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;
    const dx = targetX - originX;
    const dy = targetY - originY;
    const baseAngle = Math.atan2(dy, dx);
    const speed = getSpecialEnemyBombSpeed(stage) + 0.9;
    const spreads = [-0.28, 0, 0.28];

    spreads.forEach(spread => {
        const angle = baseAngle + spread;
        enemyBombs.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.max(2.2, Math.sin(angle) * speed),
            color: '#ff9f5c',
            radius: bombRadius + 2
        });
    });
}

function createBullet(muzzleOffsetX = 0) {
    let angle = 0;
    if (keys['ArrowLeft'] && !keys['ArrowRight']) {
        angle = -22;
    } else if (keys['ArrowRight'] && !keys['ArrowLeft']) {
        angle = 22;
    }

    const radians = angle * (Math.PI / 180);

    return {
        x: player.x + player.width / 2 - bulletWidth / 2 + muzzleOffsetX,
        y: player.y,
        vx: Math.sin(radians) * bulletSpeed,
        vy: -Math.cos(radians) * bulletSpeed
    };
}

function shootBullet() {
    if (!gameStarted || gameOver || paused) return;
    if (isBossPhaseActive()) {
        rapidFireEnabled = false;
    }
    if (!rapidFireEnabled && !bulletReady) return;

    ensureAudioReady();
    bulletReady = false;
    if (!isBossPhaseActive() && !rapidFireEnabled && stage >= 5) {
        const muzzleOffset = Math.max(8, player.width * 0.2);
        bullets.push(createBullet(-muzzleOffset), createBullet(muzzleOffset));
    } else {
        bullets.push(createBullet());
    }
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
            fireTouchIds.add(touch.identifier);
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
    for (const touch of event.changedTouches) {
        fireTouchIds.delete(touch.identifier);
    }

    const moveTouchEnded = Array.from(event.changedTouches).some(touch => touch.identifier === moveTouchId);
    if (!moveTouchEnded) return;

    const remainingTouches = Array.from(event.touches);
    const remainingMoveTouch = remainingTouches.find(touch => !fireTouchIds.has(touch.identifier)) || null;

    moveTouchId = remainingMoveTouch ? remainingMoveTouch.identifier : null;

    if (remainingMoveTouch) {
        movePlayerToClientX(remainingMoveTouch.clientX);
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
            bulletReady = true;
        } else if (bullet.x + bulletWidth >= canvas.width) {
            bullet.x = canvas.width - bulletWidth;
            bullet.vx *= -1;
            bulletReady = true;
        }

        if (bullet.y <= 0) {
            bullet.y = 0;
            bullet.vy *= -1;
            bulletReady = true;
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
                bulletReady = true;
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

        for (let sIndex = specialEnemies.length - 1; sIndex >= 0; sIndex--) {
            const enemy = specialEnemies[sIndex];

            if (!enemy.alive) continue;

            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bulletWidth > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bulletHeight > enemy.y) {
                enemy.health -= 1;
                bullets.splice(bIndex, 1);
                bulletReady = true;
                playExplosionSound();

                if (enemy.health <= 0) {
                    const awardedScore = getSpecialEnemyDefeatScore(stage);
                    enemy.alive = false;
                    score += awardedScore.total;
                    spawnScorePopup(
                        enemy.x + enemy.width / 2,
                        getSpecialEnemyRenderY(enemy) + enemy.height * 0.35,
                        awardedScore.total,
                        awardedScore.label
                    );
                    if (awardedScore.label) {
                        playBonusScoreSound(awardedScore.label);
                    }
                    updateUI();
                }

                bulletConsumed = true;
                break;
            }
        }

        if (bulletConsumed || !finalBoss || !finalBoss.alive) {
            continue;
        }

        if (bullet.x < finalBoss.x + finalBoss.width &&
            bullet.x + bulletWidth > finalBoss.x &&
            bullet.y < finalBoss.y + finalBoss.height &&
            bullet.y + bulletHeight > finalBoss.y) {
            finalBoss.health -= 1;
            bullets.splice(bIndex, 1);
            bulletReady = true;
            playExplosionSound();

            if (finalBoss.health <= 0) {
                const defeatScore = getBossDefeatScore(frameCount - bossFightStartFrame);
                finalBoss.alive = false;
                bullets = [];
                enemyBombs = [];
                score += defeatScore.total;
                bossDefeatSummary = defeatScore;
                spawnScorePopup(
                    finalBoss.x + finalBoss.width / 2,
                    finalBoss.y + finalBoss.height * 0.35,
                    defeatScore.total,
                    getText(defeatScore.labelKey)
                );
                ensureAudioReady();
                playBossExplosionSound();
                updateUI();
                gameOver = true;
                gameOverReason = 'victory';
                syncStageControls();
                stopBackgroundMusic();
                maybePromptScoreSubmission();
            }
        }
    }
}

function updateSpecialEnemies() {
    if (finalBoss) return;
    maybeSpawnSpecialEnemy();

    specialEnemies.forEach(enemy => {
        if (!enemy.alive) return;

        enemy.x += enemy.direction * enemy.speed;

        if (enemy.x <= 12 || enemy.x + enemy.width >= canvas.width - 12) {
            enemy.direction *= -1;
            enemy.x = Math.max(12, Math.min(canvas.width - enemy.width - 12, enemy.x));
            enemy.y = Math.min(player.y - 130, enemy.y + 10);
        }

        enemy.fireCooldown--;
        if (enemy.fireCooldown <= 0) {
            launchEnemyBomb(enemy);
            enemy.fireCooldown = getSpecialEnemyFireDelay(stage) + Math.floor(Math.random() * 40);
        }
    });
}

function startFinalBossPhase() {
    specialEnemies = [];
    enemyBombs = [];
    remainingSpecialSpawns = 0;
    rapidFireEnabled = false;
    bulletReady = true;
    finalBoss = {
        x: canvas.width / 2 - finalBossWidth / 2,
        y: 42,
        width: finalBossWidth,
        height: finalBossHeight,
        health: 36,
        maxHealth: 36,
        speed: 1.8,
        direction: 1,
        alive: true,
        fireCooldown: 72
    };
    bossFightStartFrame = frameCount;
    bossDefeatSummary = null;
    syncLanguageUI();
}

function updateFinalBoss() {
    if (!finalBoss || !finalBoss.alive) return;

    finalBoss.x += finalBoss.direction * finalBoss.speed;

    if (finalBoss.x <= 18 || finalBoss.x + finalBoss.width >= canvas.width - 18) {
        finalBoss.direction *= -1;
        finalBoss.x = Math.max(18, Math.min(canvas.width - finalBoss.width - 18, finalBoss.x));
    }

    finalBoss.fireCooldown--;
    if (finalBoss.fireCooldown <= 0) {
        launchFinalBossBombVolley(finalBoss);
        finalBoss.fireCooldown = 56;
    }
}

function updateEnemyBombs() {
    for (let i = enemyBombs.length - 1; i >= 0; i--) {
        const bomb = enemyBombs[i];
        bomb.x += bomb.vx;
        bomb.y += bomb.vy;
        const radius = bomb.radius || bombRadius;

        const collidesWithPlayer =
            bomb.x + radius > player.x &&
            bomb.x - radius < player.x + player.width &&
            bomb.y + radius > player.y &&
            bomb.y - radius < player.y + player.height;

        if (collidesWithPlayer) {
            triggerPlayerDefeat();
            return;
        }

        if (
            bomb.y - radius > canvas.height ||
            bomb.x + radius < 0 ||
            bomb.x - radius > canvas.width
        ) {
            enemyBombs.splice(i, 1);
        }
    }
}

function update() {
    if (!gameStarted || gameOver) return;
    frameCount++;

    // 플레이어 이동
    if (keys['ArrowLeft'] && player.x > 0) player.x -= playerSpeed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += playerSpeed;

    // 총알 이동
    updateBullets();
    updateSpecialEnemies();
    updateFinalBoss();
    updateEnemyBombs();

    // 적 이동
    let moveDown = false;
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.x += enemyDirection * getEnemyAdvanceSpeed(stage);
            if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                moveDown = true;
            }
        }
    });

    if (moveDown) {
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += getEnemyDropDistance(stage);
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
    specialEnemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemy.height >= player.y) {
            triggerPlayerDefeat();
        }
    });
    if (finalBoss?.alive && finalBoss.y + finalBoss.height >= player.y) {
        triggerPlayerDefeat();
    }

    // 다음 스테이지
    if (
        enemies.every(enemy => !enemy.alive) &&
        specialEnemies.every(enemy => !enemy.alive) &&
        (!finalBoss || !finalBoss.alive) &&
        remainingSpecialSpawns === 0 &&
        enemyBombs.length === 0
    ) {
        if (stage < FINAL_BOSS_STAGE) {
            stage++;
            updateUI();
            nextStage();
        } else if (!finalBoss) {
            startFinalBossPhase();
        } else if (!gameOver) {
            gameOver = true;
            gameOverReason = 'victory';
            syncStageControls();
            stopBackgroundMusic();
            maybePromptScoreSubmission();
        }
    }
}

function nextStage() {
    applyStageTheme();
    enemies = createEnemiesForStage(stage);
    specialEnemies = [];
    finalBoss = null;
    enemyBombs = [];
    remainingSpecialSpawns = getSpecialSpawnCount(stage);
    specialSpawnCooldown = 120;
    specialEnemyIdCounter = 0;
    bossFightStartFrame = null;
    bossDefeatSummary = null;
}

function gameLoop() {
    if (gameStarted && !paused) {
        updateScorePopups();
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
    if (gameStarted && !gameOver && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        paused = !paused;
        syncBackgroundMusic();
        syncLanguageUI();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

stageDownBtn.addEventListener('click', () => {
    changeStageSelection(-1);
});

stageUpBtn.addEventListener('click', () => {
    changeStageSelection(1);
});

startBtn.addEventListener('click', () => {
    if (gameStarted && !paused) return;
    init(stage);
});

restartBtn.addEventListener('click', () => {
    if (!gameStarted) return;
    init(gameOver ? 1 : stage);
});

pauseBtn.addEventListener('click', () => {
    if (!gameStarted || gameOver) return;
    paused = !paused;
    syncBackgroundMusic();
    syncLanguageUI();
});

musicBtn.addEventListener('click', async () => {
    musicOn = !musicOn;
    syncLanguageUI();
    await syncBackgroundMusic();
});

rapidFireCheckbox.addEventListener('change', () => {
    if (isBossPhaseActive()) {
        rapidFireEnabled = false;
        rapidFireCheckbox.checked = false;
        syncLanguageUI();
        return;
    }

    rapidFireEnabled = rapidFireCheckbox.checked;
    if (rapidFireEnabled) {
        bulletReady = true;
    } else if (bullets.length === 0) {
        bulletReady = true;
    }
    syncLanguageUI();
});

nameForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!pendingScoreSubmission) return;

    nameSaveBtn.disabled = true;
    setNameModalStatus('saveRecordPending');

    const trimmedName = nameInput.value.trim();
    if (!trimmedName) {
        setNameModalStatus('emptyName');
        nameSaveBtn.disabled = false;
        return;
    }

    const normalizedName = normalizePlayerName(trimmedName);
    if (!normalizedName) {
        setNameModalStatus('invalidName');
        nameSaveBtn.disabled = false;
        return;
    }

    const entry = {
        name: normalizedName,
        score: pendingScoreSubmission.score
    };

    try {
        const result = await submitHighScore(entry);
        pendingScoreSubmission = null;
        closeNameModal();
        openLeaderboardModal(result);
        if (!result.storedRemotely) {
            window.alert(getText('saveRecordFallback'));
        }
    } catch {
        setNameModalStatus('saveRecordFailed');
    } finally {
        nameSaveBtn.disabled = false;
    }
});

nameCancelBtn.addEventListener('click', cancelScoreSubmission);
nameCloseBtn.addEventListener('click', cancelScoreSubmission);

nameModal.addEventListener('click', (event) => {
    if (event.target === nameModal) {
        cancelScoreSubmission();
    }
});

leaderboardCloseBtn.addEventListener('click', closeLeaderboardModal);

leaderboardModal.addEventListener('click', (event) => {
    if (event.target === leaderboardModal) {
        closeLeaderboardModal();
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
    if (event.key !== 'Escape') return;

    if (nameModalOpen) {
        cancelScoreSubmission();
        return;
    }

    if (leaderboardModalOpen) {
        closeLeaderboardModal();
        return;
    }

    if (helpOpen) {
        helpOpen = false;
        syncHelpPanelVisibility();
    }
});

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('touchcancel', handleTouchEnd);

supabaseClient = createSupabaseClient();
scoreHistory = loadScoreHistory();
if (!scoreHistory.length) {
    scoreHistory = sanitizeScoreHistoryEntries(loadHighScores());
}
highScores = sanitizeHighScoreEntries(scoreHistory.length ? scoreHistory : loadHighScores());
leaderboardSource = supabaseClient ? 'global' : 'local';
leaderboardLoading = Boolean(supabaseClient);
syncLanguageUI();
updateUI();
applyStageTheme();
gameLoop();
void refreshHighScores();
void refreshVisitStats();
