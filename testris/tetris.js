/**
 * Classic Modern Tetris
 * HTML5 Canvas & Web Audio API Engine
 */

// ==========================================
// 1. 상수 및 테트로미노 정의
// ==========================================
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 300 x 600 px

const COLORS = {
  I: { main: '#00e5ff', light: '#80f2ff', dark: '#0099ab' },
  J: { main: '#2979ff', light: '#82b1ff', dark: '#1c54b2' },
  L: { main: '#ff9100', light: '#ffc47d', dark: '#b26500' },
  O: { main: '#ffd600', light: '#ffe666', dark: '#b29500' },
  S: { main: '#00e676', light: '#69f0ae', dark: '#00a152' },
  T: { main: '#d500f9', light: '#ea80fc', dark: '#9500ae' },
  Z: { main: '#ff1744', light: '#ff616f', dark: '#b2102f' },
  GHOST: 'rgba(255, 255, 255, 0.25)',
  GRID: 'rgba(255, 255, 255, 0.04)'
};

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

// ==========================================
// 2. Web Audio API 사운드 합성기
// ==========================================
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, type, duration, gainVal = 0.1, stopDelay = 0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime + stopDelay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio playback safe ignore
    }
  }

  move() {
    this.playTone(220, 'sine', 0.05, 0.05);
  }

  rotate() {
    this.playTone(360, 'sine', 0.08, 0.06);
  }

  drop() {
    this.playTone(140, 'triangle', 0.08, 0.08);
  }

  hardDrop() {
    this.playTone(80, 'square', 0.12, 0.12);
  }

  hold() {
    this.playTone(330, 'triangle', 0.06, 0.08);
  }

  clear(lines) {
    if (!this.enabled || !this.ctx) return;
    const baseFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const count = Math.min(lines, 4);
    for (let i = 0; i < count; i++) {
      this.playTone(baseFreqs[i], 'triangle', 0.15, 0.1, i * 0.07);
    }
  }

  gameOver() {
    if (!this.enabled || !this.ctx) return;
    const notes = [300, 260, 220, 180, 140];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.25, 0.1, idx * 0.15);
    });
  }
}

// ==========================================
// 3. 메인 테트리스 게임 클래스
// ==========================================
class TetrisGame {
  constructor() {
    // 캔버스 엘리먼트
    this.mainCanvas = document.getElementById('tetris-canvas');
    this.mainCtx = this.mainCanvas.getContext('2d');
    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas.getContext('2d');
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');

    // UI 요소
    this.scoreEl = document.getElementById('score');
    this.highScoreEl = document.getElementById('high-score');
    this.levelEl = document.getElementById('level');
    this.linesEl = document.getElementById('lines');
    this.finalScoreEl = document.getElementById('final-score');
    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.soundBtn = document.getElementById('sound-btn');

    // 오디오
    this.sound = new SoundController();

    // 게임 상태 변수
    this.board = this.createBoard();
    this.bag = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.holdPiece = null;
    this.canHold = true;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.highScore = parseInt(localStorage.getItem('tetris_high_score') || '0', 10);
    this.highScoreEl.innerText = this.highScore.toLocaleString();

    this.isPaused = false;
    this.isGameOver = false;
    this.isPlaying = false;

    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;
    this.animationId = null;

    // 라인 클리어 애니메이션 상태
    this.clearingLines = [];
    this.clearAnimationTimer = 0;

    // 이벤트 리스너 바인딩
    this.bindEvents();
    this.drawEmptyBoard();
  }

  createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  // 7-Bag 랜덤 추첨 시스템
  generateBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }

  getNextPieceType() {
    if (this.bag.length === 0) {
      this.bag = this.generateBag();
    }
    return this.bag.pop();
  }

  createPiece(type) {
    const shape = SHAPES[type].map(row => [...row]);
    return {
      type,
      shape,
      color: COLORS[type],
      x: Math.floor((COLS - shape[0].length) / 2),
      y: type === 'I' ? -1 : 0
    };
  }

  start() {
    this.sound.init();
    this.board = this.createBoard();
    this.bag = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 1000;
    this.isGameOver = false;
    this.isPaused = false;
    this.isPlaying = true;
    this.holdPiece = null;
    this.canHold = true;
    this.clearingLines = [];

    this.updateStats();
    this.nextPiece = this.createPiece(this.getNextPieceType());
    this.spawnPiece();

    this.startOverlay.classList.remove('active');
    this.pauseOverlay.classList.remove('active');
    this.gameOverOverlay.classList.remove('active');

    this.lastTime = performance.now();
    cancelAnimationFrame(this.animationId);
    this.update();
  }

  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.createPiece(this.getNextPieceType());
    this.canHold = true;
    this.drawPreview(this.nextCtx, this.nextPiece);

    // 스폰 위치에서 이미 충돌하면 게임 오버
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.gameOver();
    }
  }

  hold() {
    if (!this.canHold || !this.isPlaying || this.isPaused || this.isGameOver) return;
    this.sound.init();
    this.sound.hold();

    const currentType = this.currentPiece.type;
    if (this.holdPiece === null) {
      this.holdPiece = this.createPiece(currentType);
      this.spawnPiece();
    } else {
      const prevHoldType = this.holdPiece.type;
      this.holdPiece = this.createPiece(currentType);
      this.currentPiece = this.createPiece(prevHoldType);
    }

    this.canHold = false;
    this.drawPreview(this.holdCtx, this.holdPiece);
  }

  pause() {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseOverlay.classList.add('active');
    } else {
      this.sound.init();
      this.pauseOverlay.classList.remove('active');
      this.lastTime = performance.now();
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.isPlaying = false;
    this.sound.gameOver();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('tetris_high_score', this.highScore.toString());
      this.highScoreEl.innerText = this.highScore.toLocaleString();
    }

    this.finalScoreEl.innerText = this.score.toLocaleString();
    this.gameOverOverlay.classList.add('active');
  }

  checkCollision(offsetX, offsetY, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = offsetX + c;
          const newY = offsetY + r;

          // 보드 경계 검사
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }

          // 이미 고정된 블록과의 충돌
          if (newY >= 0 && this.board[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  rotateMatrix(matrix, clockwise = true) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (clockwise) {
          result[c][N - 1 - r] = matrix[r][c];
        } else {
          result[N - 1 - c][r] = matrix[r][c];
        }
      }
    }
    return result;
  }

  rotate(clockwise = true) {
    if (!this.isPlaying || this.isPaused || this.isGameOver || !this.currentPiece) return;
    if (this.currentPiece.type === 'O') return; // O 블록은 회전 생략

    const rotated = this.rotateMatrix(this.currentPiece.shape, clockwise);
    
    // 벽 킥 (Wall Kick) 오프셋 시도
    const kicks = [0, -1, 1, -2, 2];
    for (const offset of kicks) {
      if (!this.checkCollision(this.currentPiece.x + offset, this.currentPiece.y, rotated)) {
        this.currentPiece.x += offset;
        this.currentPiece.shape = rotated;
        this.sound.rotate();
        return;
      }
    }
  }

  moveLeft() {
    if (!this.isPlaying || this.isPaused || this.isGameOver || !this.currentPiece) return;
    if (!this.checkCollision(this.currentPiece.x - 1, this.currentPiece.y, this.currentPiece.shape)) {
      this.currentPiece.x--;
      this.sound.move();
    }
  }

  moveRight() {
    if (!this.isPlaying || this.isPaused || this.isGameOver || !this.currentPiece) return;
    if (!this.checkCollision(this.currentPiece.x + 1, this.currentPiece.y, this.currentPiece.shape)) {
      this.currentPiece.x++;
      this.sound.move();
    }
  }

  moveDown() {
    if (!this.isPlaying || this.isPaused || this.isGameOver || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      this.score += 1; // 소프트 드롭 점수
      this.updateStats();
      return true;
    } else {
      this.lockPiece();
      return false;
    }
  }

  hardDrop() {
    if (!this.isPlaying || this.isPaused || this.isGameOver || !this.currentPiece) return;
    let dropCount = 0;
    while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      dropCount++;
    }
    this.score += dropCount * 2; // 하드 드롭 점수
    this.sound.hardDrop();
    this.lockPiece();
    this.updateStats();
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
      ghostY++;
    }
    return ghostY;
  }

  lockPiece() {
    const { shape, x, y, color } = this.currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardY = y + r;
          const boardX = x + c;
          if (boardY < 0) {
            this.gameOver();
            return;
          }
          this.board[boardY][boardX] = color;
        }
      }
    }

    this.sound.drop();
    this.clearLines();
  }

  clearLines() {
    const linesToClear = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== 0)) {
        linesToClear.push(r);
      }
    }

    if (linesToClear.length > 0) {
      this.clearingLines = linesToClear;
      this.clearAnimationTimer = 100; // 100ms 번쩍임 효과
      this.sound.clear(linesToClear.length);

      // 점수 계산 (클래식 닌텐도 테트리스 스케일링)
      const baseScores = [0, 100, 300, 500, 800];
      this.score += (baseScores[linesToClear.length] || 1000) * this.level;
      this.lines += linesToClear.length;

      // 10줄마다 레벨업
      const calculatedLevel = Math.floor(this.lines / 10) + 1;
      if (calculatedLevel > this.level) {
        this.level = calculatedLevel;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 85);
      }

      this.updateStats();
    } else {
      this.spawnPiece();
    }
  }

  finishClearLines() {
    this.clearingLines.forEach(r => {
      this.board.splice(r, 1);
      this.board.unshift(Array(COLS).fill(0));
    });
    this.clearingLines = [];
    this.spawnPiece();
  }

  updateStats() {
    this.scoreEl.innerText = this.score.toLocaleString();
    this.levelEl.innerText = this.level;
    this.linesEl.innerText = this.lines;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreEl.innerText = this.highScore.toLocaleString();
    }
  }

  // ==========================================
  // 4. 렌더링 로직 (Canvas Drawing)
  // ==========================================
  drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
    const px = x * size;
    const py = y * size;

    // 메인 색상 바닥
    ctx.fillStyle = color.main;
    ctx.fillRect(px, py, size, size);

    // 상단 및 좌측 하이라이트 (3D 엠보싱)
    ctx.fillStyle = color.light;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + size, py);
    ctx.lineTo(px + size - 3, py + 3);
    ctx.lineTo(px + 3, py + 3);
    ctx.lineTo(px + 3, py + size - 3);
    ctx.lineTo(px, py + size);
    ctx.closePath();
    ctx.fill();

    // 하단 및 우측 섀도우
    ctx.fillStyle = color.dark;
    ctx.beginPath();
    ctx.moveTo(px + size, py);
    ctx.lineTo(px + size, py + size);
    ctx.lineTo(px, py + size);
    ctx.lineTo(px + 3, py + size - 3);
    ctx.lineTo(px + size - 3, py + size - 3);
    ctx.lineTo(px + size - 3, py + 3);
    ctx.closePath();
    ctx.fill();

    // 안쪽 사각 면
    ctx.fillStyle = color.main;
    ctx.fillRect(px + 3, py + 3, size - 6, size - 6);
  }

  drawGhostBlock(ctx, x, y, size = BLOCK_SIZE) {
    const px = x * size;
    const py = y * size;
    ctx.strokeStyle = COLORS.GHOST;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
  }

  drawGrid() {
    this.mainCtx.strokeStyle = COLORS.GRID;
    this.mainCtx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      this.mainCtx.beginPath();
      this.mainCtx.moveTo(c * BLOCK_SIZE, 0);
      this.mainCtx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      this.mainCtx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      this.mainCtx.beginPath();
      this.mainCtx.moveTo(0, r * BLOCK_SIZE);
      this.mainCtx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
      this.mainCtx.stroke();
    }
  }

  drawEmptyBoard() {
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.drawGrid();
  }

  drawPreview(ctx, piece) {
    ctx.clearRect(0, 0, 100, 100);
    if (!piece) return;

    const shape = piece.shape;
    const size = 20;
    const shapeWidth = shape[0].length * size;
    const shapeHeight = shape.length * size;
    const startX = Math.floor((100 - shapeWidth) / 2 / size);
    const startY = Math.floor((100 - shapeHeight) / 2 / size);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          this.drawBlock(ctx, startX + c, startY + r, piece.color, size);
        }
      }
    }
  }

  render() {
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.drawGrid();

    // 1. 고정된 보드 블록 렌더링
    for (let r = 0; r < ROWS; r++) {
      const isClearing = this.clearingLines.includes(r);
      for (let c = 0; c < COLS; c++) {
        if (this.board[r][c] !== 0) {
          if (isClearing) {
            // 라인 클리어 반짝임 효과
            this.mainCtx.fillStyle = '#ffffff';
            this.mainCtx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          } else {
            this.drawBlock(this.mainCtx, c, r, this.board[r][c]);
          }
        }
      }
    }

    if (!this.currentPiece || this.clearingLines.length > 0) return;

    // 2. 고스트 피스 렌더링
    const ghostY = this.getGhostY();
    const { shape, x, y, color } = this.currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          this.drawGhostBlock(this.mainCtx, x + c, ghostY + r);
        }
      }
    }

    // 3. 현재 떨어지는 블록 렌더링
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const drawY = y + r;
          if (drawY >= 0) {
            this.drawBlock(this.mainCtx, x + c, drawY, color);
          }
        }
      }
    }
  }

  // ==========================================
  // 5. 메인 게임 루프
  // ==========================================
  update(time = 0) {
    if (!this.isPlaying) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (!this.isPaused && !this.isGameOver) {
      if (this.clearingLines.length > 0) {
        this.clearAnimationTimer -= deltaTime;
        if (this.clearAnimationTimer <= 0) {
          this.finishClearLines();
        }
      } else {
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
          this.moveDown();
          this.dropCounter = 0;
        }
      }
    }

    this.render();
    this.animationId = requestAnimationFrame(this.update.bind(this));
  }

  // ==========================================
  // 6. 이벤트 바인딩
  // ==========================================
  bindEvents() {
    // 키보드 이벤트
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault(); // 스크롤 방지
      }

      this.sound.init();

      if (!this.isPlaying) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.start();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
          this.moveLeft();
          break;
        case 'ArrowRight':
          this.moveRight();
          break;
        case 'ArrowDown':
          this.moveDown();
          break;
        case 'ArrowUp':
          this.rotate(true);
          break;
        case 'KeyZ':
          this.rotate(false);
          break;
        case 'Space':
          this.hardDrop();
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.hold();
          break;
        case 'KeyP':
        case 'Escape':
          this.pause();
          break;
      }
    });

    // 버튼 이벤트
    document.getElementById('start-btn').addEventListener('click', () => this.start());
    document.getElementById('resume-btn').addEventListener('click', () => this.pause());
    document.getElementById('restart-btn').addEventListener('click', () => this.start());

    // 사운드 토글
    this.soundBtn.addEventListener('click', () => {
      this.sound.init();
      const enabled = this.sound.toggle();
      this.soundBtn.innerText = enabled ? '🔊' : '🔇';
    });

    // 온스크린 모바일 터치 버튼 바인딩
    const touchMappings = [
      { id: 'btn-left', action: () => this.moveLeft() },
      { id: 'btn-right', action: () => this.moveRight() },
      { id: 'btn-down', action: () => this.moveDown() },
      { id: 'btn-rotate', action: () => this.rotate(true) },
      { id: 'btn-rotate-ccw', action: () => this.rotate(false) },
      { id: 'btn-hard-drop', action: () => this.hardDrop() },
      { id: 'btn-hold', action: () => this.hold() }
    ];

    touchMappings.forEach(({ id, action }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.sound.init();
          action();
        });
      }
    });
  }
}

// 브라우저 로드 시 테트리스 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.tetris = new TetrisGame();
});
