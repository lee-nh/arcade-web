/**
 * 🧱 BREAKOUT CLASSIC (브레이크아웃: 클래식 벽돌깨기)
 * 정통 아케이드 감성의 고전 벽돌깨기 게임 엔진
 */

(function () {
  'use strict';

  // ==========================================
  // 1. 상수 및 설정
  // ==========================================
  const V_WIDTH = 640;
  const V_HEIGHT = 720;

  const BRICK_COLS = 10;
  const BRICK_WIDTH = 56;
  const BRICK_HEIGHT = 22;
  const BRICK_PADDING = 6;
  const BRICK_OFFSET_TOP = 70;
  const BRICK_OFFSET_LEFT = (V_WIDTH - (BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_PADDING)) / 2; // 중앙 정렬 (13px)

  const BALL_RADIUS = 7;
  const BASE_BALL_SPEED = 430;
  const MAX_BALL_SPEED = 780;

  const PADDLE_HEIGHT = 16;
  const PADDLE_BASE_WIDTH = 105;
  const PADDLE_EXPAND_WIDTH = 155;
  const PADDLE_Y = 664;
  const PADDLE_KEY_SPEED = 600;

  // 벽돌 컬러 팔레트 & 속성
  const BRICK_TYPES = {
    // 1-hit 일반 벽돌
    RED:    { hp: 1, points: 90,  color: '#ef4444', light: '#f87171', shadow: '#991b1b', stroke: '#b91c1c' },
    ORANGE: { hp: 1, points: 80,  color: '#f97316', light: '#fb923c', shadow: '#9a3412', stroke: '#c2410c' },
    YELLOW: { hp: 1, points: 70,  color: '#eab308', light: '#facc15', shadow: '#854d0e', stroke: '#a16207' },
    GREEN:  { hp: 1, points: 60,  color: '#22c55e', light: '#4ade80', shadow: '#166534', stroke: '#15803d' },
    CYAN:   { hp: 1, points: 50,  color: '#06b6d4', light: '#22d3ee', shadow: '#155e75', stroke: '#0e7490' },
    BLUE:   { hp: 1, points: 40,  color: '#3b82f6', light: '#60a5fa', shadow: '#1e40af', stroke: '#1d4ed8' },
    PURPLE: { hp: 1, points: 30,  color: '#a855f7', light: '#c084fc', shadow: '#6b21a8', stroke: '#7e22ce' },

    // 특수 벽돌
    SILVER: { hp: 2, points: 150, color: '#94a3b8', light: '#cbd5e1', shadow: '#475569', stroke: '#64748b', isHard: true },
    GOLD:   { hp: 3, points: 250, color: '#f59e0b', light: '#fde047', shadow: '#b45309', stroke: '#d97706', isHard: true },
    BOMB:   { hp: 1, points: 200, color: '#dc2626', light: '#ff4d4d', shadow: '#7f1d1d', stroke: '#ff0000', isBomb: true },
    ITEM:   { hp: 1, points: 120, color: '#ec4899', light: '#f472b6', shadow: '#9d174d', stroke: '#db2777', isItem: true },
    SOLID:  { hp: Infinity, points: 0, color: '#475569', light: '#64748b', shadow: '#1e293b', stroke: '#334155', isSolid: true }
  };

  // 아이템 유형 정의
  const POWERUP_TYPES = [
    { type: 'EXPAND',   name: '패들 확장', color: '#10b981', symbol: '↔', duration: 15 },
    { type: 'MULTI',    name: '멀티볼 3X', color: '#06b6d4', symbol: '●●', duration: 0 },
    { type: 'LASER',    name: '레이저 캐논', color: '#ef4444', symbol: '▲', duration: 12 },
    { type: 'FIREBALL', name: '파이어볼 관통', color: '#f97316', symbol: '🔥', duration: 9 },
    { type: 'SLOW',     name: '볼 슬로우', color: '#8b5cf6', symbol: '🐢', duration: 0 },
    { type: 'BARRIER',  name: '하단 방어막', color: '#38bdf8', symbol: '🛡️', duration: 0 },
    { type: 'LIFE',     name: '생명 +1', color: '#ec4899', symbol: '♥', duration: 0 }
  ];

  // ==========================================
  // 2. 스테이지 레벨 디자인
  // ==========================================
  const STAGES = [
    // Stage 1: 정통 클래식 레인보우
    {
      name: "CLASSIC RAINBOW",
      description: "고전 벽돌깨기의 정석! 레인보우 벽돌을 격파하세요.",
      grid: [
        ["RED", "RED", "RED", "RED", "RED", "RED", "RED", "RED", "RED", "RED"],
        ["ORANGE", "ORANGE", "ORANGE", "ORANGE", "ITEM", "ORANGE", "ORANGE", "ORANGE", "ORANGE", "ORANGE"],
        ["YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW"],
        ["GREEN", "GREEN", "GREEN", "ITEM", "GREEN", "GREEN", "GREEN", "GREEN", "GREEN", "GREEN"],
        ["CYAN", "CYAN", "CYAN", "CYAN", "CYAN", "CYAN", "CYAN", "CYAN", "CYAN", "CYAN"],
        ["BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE"]
      ]
    },
    // Stage 2: 피라미드 어센트 (Pyramid)
    {
      name: "PYRAMID OF RA",
      description: "피라미드 정상에는 단단한 은색 벽돌과 행운의 아이템이 숨겨져 있습니다.",
      grid: [
        [null, null, null, null, "GOLD", "ITEM", null, null, null, null],
        [null, null, null, "SILVER", "SILVER", "SILVER", "SILVER", null, null, null],
        [null, null, "RED", "RED", "BOMB", "BOMB", "RED", "RED", null, null],
        [null, "ORANGE", "ORANGE", "ITEM", "ORANGE", "ORANGE", "ITEM", "ORANGE", "ORANGE", null],
        ["YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW", "YELLOW"],
        ["GREEN", "GREEN", "GREEN", "GREEN", "GREEN", "GREEN", "GREEN", "GREEN", "GREEN", "GREEN"],
        ["BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE", "BLUE"]
      ]
    },
    // Stage 3: 스페이스 인베이더 (Space Invader)
    {
      name: "SPACE INVADER",
      description: "우주 침략자 형태의 벽돌 편대! 붉은 눈(폭탄)을 노려 연쇄 폭발을 일으키세요.",
      grid: [
        [null, null, "CYAN", null, null, null, null, "CYAN", null, null],
        [null, null, null, "CYAN", null, null, "CYAN", null, null, null],
        [null, null, "PURPLE", "PURPLE", "PURPLE", "PURPLE", "PURPLE", "PURPLE", null, null],
        [null, "PURPLE", "PURPLE", "BOMB", "PURPLE", "PURPLE", "BOMB", "PURPLE", "PURPLE", null],
        ["PURPLE", "PURPLE", "PURPLE", "PURPLE", "ITEM", "ITEM", "PURPLE", "PURPLE", "PURPLE", "PURPLE"],
        ["PURPLE", null, "PURPLE", "PURPLE", "PURPLE", "PURPLE", "PURPLE", "PURPLE", null, "PURPLE"],
        ["PURPLE", null, "PURPLE", null, null, null, null, "PURPLE", null, "PURPLE"],
        [null, null, null, "SILVER", "SILVER", "SILVER", "SILVER", null, null, null]
      ]
    },
    // Stage 4: 다이아몬드 요새 (Diamond Fortress)
    {
      name: "DIAMOND FORTRESS",
      description: "강철 장갑으로 둘러싸인 요새 코어를 폭탄과 파이어볼로 뚫으세요!",
      grid: [
        [null, null, null, null, "SILVER", "SILVER", null, null, null, null],
        [null, null, null, "SILVER", "GOLD", "GOLD", "SILVER", null, null, null],
        [null, null, "SILVER", "RED", "BOMB", "BOMB", "RED", "SILVER", null, null],
        [null, "SILVER", "ORANGE", "ITEM", "GOLD", "GOLD", "ITEM", "ORANGE", "SILVER", null],
        ["SILVER", "YELLOW", "YELLOW", "YELLOW", "ITEM", "ITEM", "YELLOW", "YELLOW", "YELLOW", "SILVER"],
        [null, "SILVER", "GREEN", "GREEN", "BOMB", "BOMB", "GREEN", "GREEN", "SILVER", null],
        [null, null, "SILVER", "CYAN", "CYAN", "CYAN", "CYAN", "SILVER", null, null],
        [null, null, null, "SILVER", "BLUE", "BLUE", "SILVER", null, null, null],
        [null, null, null, null, "SILVER", "SILVER", null, null, null, null]
      ]
    },
    // Stage 5: 카오스 매트릭스 (Chaos Matrix)
    {
      name: "CHAOS MATRIX",
      description: "파괴 불가능한 티타늄 기둥과 연속 폭탄이 얽힌 최고 난이도 전장입니다.",
      grid: [
        ["SOLID", "RED", "BOMB", "RED", "SOLID", "SOLID", "RED", "BOMB", "RED", "SOLID"],
        ["ORANGE", "SILVER", "ITEM", "SILVER", "ORANGE", "ORANGE", "SILVER", "ITEM", "SILVER", "ORANGE"],
        ["BOMB", "YELLOW", "GOLD", "YELLOW", "BOMB", "BOMB", "YELLOW", "GOLD", "YELLOW", "BOMB"],
        ["SOLID", "GREEN", "BOMB", "GREEN", "SOLID", "SOLID", "GREEN", "BOMB", "GREEN", "SOLID"],
        ["CYAN", "SILVER", "ITEM", "SILVER", "CYAN", "CYAN", "SILVER", "ITEM", "SILVER", "CYAN"],
        ["BOMB", "BLUE", "GOLD", "BLUE", "BOMB", "BOMB", "BLUE", "GOLD", "BLUE", "BOMB"],
        ["SOLID", "PURPLE", "BOMB", "PURPLE", "SOLID", "SOLID", "PURPLE", "BOMB", "PURPLE", "SOLID"]
      ]
    }
  ];

  // ==========================================
  // 3. 메인 게임 클래스
  // ==========================================
  class BreakoutGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      // 내부 가상 크기 설정
      this.vWidth = V_WIDTH;
      this.vHeight = V_HEIGHT;

      // 게임 상태: 'INIT', 'PLAYING', 'PAUSED', 'STAGECLEAR', 'GAMEOVER'
      this.state = 'INIT';

      // 세션 통계
      this.score = 0;
      this.highScore = this.loadHighScore();
      this.level = 1;
      this.lives = 3;
      this.combo = 0;
      this.maxCombo = 0;

      // 패들
      this.paddle = {
        x: (this.vWidth - PADDLE_BASE_WIDTH) / 2,
        y: PADDLE_Y,
        width: PADDLE_BASE_WIDTH,
        height: PADDLE_HEIGHT,
        targetWidth: PADDLE_BASE_WIDTH,
        vx: 0,
        laserActive: false,
        laserTimer: 0,
        laserCooldown: 0
      };

      // 활성화된 볼 리스트
      this.balls = [];

      // 벽돌 그리드
      this.bricks = [];
      this.destructibleBricksCount = 0;

      // 파워업 아이템 리스트
      this.powerups = [];

      // 발사된 레이저 탄환 리스트
      this.lasers = [];

      // 이펙트 파티클 & 플로팅 텍스트
      this.particles = [];
      this.floatingTexts = [];

      // 특수 파워업 타이머 및 플래그
      this.activePowerups = {
        expandTimer: 0,
        fireballTimer: 0,
        laserTimer: 0,
        barrierActive: false
      };

      // 스크린 쉐이크 연출
      this.screenShake = 0;

      // 컨트롤 입력 상태
      this.keys = {
        left: false,
        right: false,
        space: false
      };
      this.mouseControl = {
        active: false,
        x: this.vWidth / 2
      };

      // 이전 프레임 시각
      this.lastTime = 0;

      // CRT 효과 상태
      this.crtEnabled = false;

      // 오디오
      this.audio = window.soundEngine;

      // DOM 요소 캐싱
      this.cacheDOMElements();

      // 이벤트 리스너 바인딩
      this.initEvents();

      // 캔버스 크기 리사이징
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      // 초기 화면 세팅
      this.updateUI();
      this.buildLevel(this.level);
      this.resetBallOnPaddle();
      this.render();

      // 게임 루프 시작
      requestAnimationFrame(time => this.loop(time));
    }

    cacheDOMElements() {
      this.dom = {
        score: document.getElementById('val-score'),
        highScore: document.getElementById('val-high-score'),
        level: document.getElementById('val-level'),
        livesContainer: document.getElementById('lives-display'),
        combo: document.getElementById('val-combo'),
        comboContainer: document.getElementById('combo-panel'),
        powerupBadges: document.getElementById('active-powerups'),

        // 오버레이들
        startOverlay: document.getElementById('start-overlay'),
        pauseOverlay: document.getElementById('pause-overlay'),
        stageClearOverlay: document.getElementById('stage-clear-overlay'),
        gameOverOverlay: document.getElementById('game-over-overlay'),

        // 버튼들
        startBtn: document.getElementById('start-btn'),
        resumeBtn: document.getElementById('resume-btn'),
        nextStageBtn: document.getElementById('next-stage-btn'),
        retryBtn: document.getElementById('retry-btn'),
        pauseToggleBtn: document.getElementById('pause-btn'),
        soundToggleBtn: document.getElementById('sound-btn'),
        crtToggleBtn: document.getElementById('crt-btn'),

        // 모바일 터치 발사 버튼
        touchLaunchBtn: document.getElementById('touch-launch-btn'),

        // 스테이지 완료/게임오버 텍스트
        stageClearTitle: document.getElementById('stage-clear-title'),
        stageClearDesc: document.getElementById('stage-clear-desc'),
        finalScore: document.getElementById('final-score'),
        finalHighScore: document.getElementById('final-high-score'),
        newRecordBadge: document.getElementById('new-record-badge')
      };
    }

    // ==========================================
    // 4. 이벤트 리스너 등록
    // ==========================================
    initEvents() {
      // 키보드 누름
      window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'KeyA'].includes(e.code)) {
          this.keys.left = true;
          this.mouseControl.active = false;
        }
        if (['ArrowRight', 'KeyD'].includes(e.code)) {
          this.keys.right = true;
          this.mouseControl.active = false;
        }
        if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
          e.preventDefault();
          this.keys.space = true;
          this.handleActionTrigger();
        }
        if (['KeyP', 'Escape'].includes(e.code)) {
          e.preventDefault();
          this.togglePause();
        }
        if (e.code === 'KeyM') {
          this.toggleSound();
        }
        if (e.code === 'KeyC') {
          this.toggleCRT();
        }
      });

      // 키보드 뗌
      window.addEventListener('keyup', (e) => {
        if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
        if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
        if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) this.keys.space = false;
      });

      // 마우스 이동 (캔버스 기준 좌표 매핑)
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.vWidth / rect.width;
        this.mouseControl.x = (e.clientX - rect.left) * scaleX;
        this.mouseControl.active = true;
      });

      // 마우스 클릭 -> 볼 발사 또는 레이저 격발
      this.canvas.addEventListener('click', (e) => {
        if (this.state === 'PLAYING') {
          this.handleActionTrigger();
        }
      });

      // 터치 이벤트 지원 (모바일/태블릿)
      const handleTouch = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.vWidth / rect.width;
        const touch = e.touches[0];
        this.mouseControl.x = (touch.clientX - rect.left) * scaleX;
        this.mouseControl.active = true;
      };

      this.canvas.addEventListener('touchstart', (e) => {
        handleTouch(e);
        if (this.state === 'PLAYING') {
          this.handleActionTrigger();
        }
        e.preventDefault();
      }, { passive: false });

      this.canvas.addEventListener('touchmove', (e) => {
        handleTouch(e);
        e.preventDefault();
      }, { passive: false });

      // UI 버튼들
      if (this.dom.startBtn) this.dom.startBtn.addEventListener('click', () => this.startGame());
      if (this.dom.resumeBtn) this.dom.resumeBtn.addEventListener('click', () => this.togglePause());
      if (this.dom.nextStageBtn) this.dom.nextStageBtn.addEventListener('click', () => this.nextStage());
      if (this.dom.retryBtn) this.dom.retryBtn.addEventListener('click', () => this.restartGame());
      if (this.dom.pauseToggleBtn) this.dom.pauseToggleBtn.addEventListener('click', () => this.togglePause());
      if (this.dom.soundToggleBtn) this.dom.soundToggleBtn.addEventListener('click', () => this.toggleSound());
      if (this.dom.crtToggleBtn) this.dom.crtToggleBtn.addEventListener('click', () => this.toggleCRT());
      if (this.dom.touchLaunchBtn) this.dom.touchLaunchBtn.addEventListener('click', () => this.handleActionTrigger());
    }

    // 발사/액션 트리거 처리 (스페이스바, 마우스 클릭, 터치 등)
    handleActionTrigger() {
      this.audio.init();

      if (this.state === 'INIT') {
        this.startGame();
        return;
      }

      if (this.state === 'STAGECLEAR') {
        this.nextStage();
        return;
      }

      if (this.state === 'GAMEOVER') {
        this.restartGame();
        return;
      }

      if (this.state === 'PLAYING') {
        // 1. 패들에 고정된 볼이 있다면 발사
        let launchedAny = false;
        this.balls.forEach(ball => {
          if (ball.stuckToPaddle) {
            this.launchBall(ball);
            launchedAny = true;
          }
        });

        // 2. 레이저 파워업이 활성화되어 있다면 레이저 발사
        if (this.activePowerups.laserTimer > 0 && this.paddle.laserCooldown <= 0) {
          this.fireLasers();
          this.paddle.laserCooldown = 0.22; // 0.22초 쿨다운
        }
      }
    }

    // 캔버스 크기 리사이징 (반응형 및 선명도 유지)
    resizeCanvas() {
      const container = this.canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // 4:3 ~ 9:10 적정 비율로 CSS 크기 맞춤
      const maxWidth = Math.min(rect.width, 640);
      const targetHeight = Math.round(maxWidth * (V_HEIGHT / V_WIDTH));

      this.canvas.style.width = maxWidth + 'px';
      this.canvas.style.height = targetHeight + 'px';

      this.canvas.width = Math.round(this.vWidth * dpr);
      this.canvas.height = Math.round(this.vHeight * dpr);

      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }

    // ==========================================
    // 5. 게임 수명 주기 관리
    // ==========================================
    startGame() {
      this.audio.init();
      this.audio.uiClick();
      this.state = 'PLAYING';
      this.hideAllOverlays();
      this.updateUI();

      // 시작 시 패들 위의 볼 발사
      this.balls.forEach(b => {
        if (b.stuckToPaddle) this.launchBall(b);
      });
    }

    togglePause() {
      if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

      this.audio.uiClick();
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.dom.pauseOverlay.classList.add('active');
        if (this.dom.pauseToggleBtn) this.dom.pauseToggleBtn.textContent = '▶ 계속';
      } else {
        this.state = 'PLAYING';
        this.dom.pauseOverlay.classList.remove('active');
        if (this.dom.pauseToggleBtn) this.dom.pauseToggleBtn.textContent = '⏸ 일시정지';
      }
    }

    toggleSound() {
      const isMuted = this.audio.toggleMute();
      if (this.dom.soundToggleBtn) {
        this.dom.soundToggleBtn.textContent = isMuted ? '🔇 음소거' : '🔊 사운드';
        this.dom.soundToggleBtn.classList.toggle('muted', isMuted);
      }
    }

    toggleCRT() {
      this.crtEnabled = !this.crtEnabled;
      const crtLayer = document.getElementById('crt-layer');
      if (crtLayer) crtLayer.classList.toggle('active', this.crtEnabled);
      if (this.dom.crtToggleBtn) {
        this.dom.crtToggleBtn.classList.toggle('active', this.crtEnabled);
        this.dom.crtToggleBtn.textContent = this.crtEnabled ? '📺 CRT On' : '📺 CRT Off';
      }
      this.audio.uiClick();
    }

    hideAllOverlays() {
      this.dom.startOverlay.classList.remove('active');
      this.dom.pauseOverlay.classList.remove('active');
      this.dom.stageClearOverlay.classList.remove('active');
      this.dom.gameOverOverlay.classList.remove('active');
    }

    // 스테이지 레벨 빌드
    buildLevel(levelNum) {
      this.bricks = [];
      this.destructibleBricksCount = 0;

      // 스테이지 데이터 참조 (범위 초과 시 루프 및 강화)
      const stageIndex = (levelNum - 1) % STAGES.length;
      const stageData = STAGES[stageIndex];
      const grid = stageData.grid;

      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const typeKey = grid[r][c];
          if (!typeKey || !BRICK_TYPES[typeKey]) continue;

          const baseProps = BRICK_TYPES[typeKey];
          const bx = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
          const by = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);

          // 다회차 루프 시 내구도 약간 보정
          const loopCount = Math.floor((levelNum - 1) / STAGES.length);
          let hp = baseProps.hp;
          if (hp < Infinity && loopCount > 0 && !baseProps.isBomb && !baseProps.isItem) {
            hp += Math.min(loopCount, 2);
          }

          const brick = {
            id: `${r}_${c}`,
            x: bx,
            y: by,
            w: BRICK_WIDTH,
            h: BRICK_HEIGHT,
            type: typeKey,
            color: baseProps.color,
            light: baseProps.light,
            shadow: baseProps.shadow,
            stroke: baseProps.stroke,
            points: baseProps.points,
            maxHp: hp,
            hp: hp,
            isBomb: !!baseProps.isBomb,
            isItem: !!baseProps.isItem,
            isHard: !!baseProps.isHard,
            isSolid: !!baseProps.isSolid,
            hitFlash: 0
          };

          this.bricks.push(brick);
          if (!brick.isSolid) {
            this.destructibleBricksCount++;
          }
        }
      }

      this.updateUI();
    }

    // 패들 위에 볼 올려놓기
    resetBallOnPaddle() {
      this.balls = [{
        x: this.paddle.x + this.paddle.width / 2,
        y: this.paddle.y - BALL_RADIUS - 1,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        speed: BASE_BALL_SPEED,
        stuckToPaddle: true,
        stuckOffsetX: 0,
        trail: []
      }];
    }

    // 볼 발사
    launchBall(ball) {
      ball.stuckToPaddle = false;
      // 패들 속도에 따라 약간의 발사 각도 영향 부여 (-45도 ~ 45도 상향)
      const influence = (this.paddle.vx / PADDLE_KEY_SPEED) * 0.35;
      const baseAngle = -Math.PI / 2 + influence + (Math.random() * 0.2 - 0.1);
      const angle = Math.max(-Math.PI * 0.8, Math.min(-Math.PI * 0.2, baseAngle));

      ball.vx = Math.cos(angle) * ball.speed;
      ball.vy = Math.sin(angle) * ball.speed;

      this.audio.paddleHit(0);
    }

    // 레이저 발사 (패들 양쪽 터렛에서 2발 동시 발사)
    fireLasers() {
      const leftX = this.paddle.x + 8;
      const rightX = this.paddle.x + this.paddle.width - 8;
      const laserY = this.paddle.y - 6;

      this.lasers.push({ x: leftX, y: laserY, vy: -650 });
      this.lasers.push({ x: rightX, y: laserY, vy: -650 });

      this.audio.laserShoot();
    }

    // 스테이지 클리어
    onStageClear() {
      this.state = 'STAGECLEAR';
      this.audio.stageClear();

      // 클리어 보너스 계산
      const stageBonus = 1000 * this.level;
      const lifeBonus = this.lives * 250;
      this.addScore(stageBonus + lifeBonus);

      const stageIndex = (this.level - 1) % STAGES.length;
      const stageData = STAGES[stageIndex];

      if (this.dom.stageClearTitle) {
        this.dom.stageClearTitle.textContent = `STAGE ${this.level} CLEAR! 🎉`;
      }
      if (this.dom.stageClearDesc) {
        this.dom.stageClearDesc.innerHTML = `
          <strong>${stageData.name}</strong> 격파 완료!<br>
          스테이지 클리어 보너스: +${stageBonus.toLocaleString()}P<br>
          잔여 생명 보너스: +${lifeBonus.toLocaleString()}P
        `;
      }

      this.dom.stageClearOverlay.classList.add('active');
    }

    // 다음 스테이지로 진입
    nextStage() {
      this.level++;
      this.hideAllOverlays();

      // 파워업 타이머 리셋
      this.activePowerups.expandTimer = 0;
      this.activePowerups.fireballTimer = 0;
      this.activePowerups.laserTimer = 0;
      this.paddle.width = PADDLE_BASE_WIDTH;
      this.paddle.targetWidth = PADDLE_BASE_WIDTH;

      this.powerups = [];
      this.lasers = [];
      this.combo = 0;

      this.buildLevel(this.level);
      this.resetBallOnPaddle();

      this.state = 'PLAYING';
      this.updateUI();
    }

    // 생명 1 감소 및 재장전
    loseLife() {
      this.lives--;
      this.combo = 0;
      this.audio.lifeLost();

      // 화면 진동
      this.screenShake = 15;

      // 파티클
      this.spawnExplosion(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#ef4444', 20);

      // 위험/패널티: 레이저, 파이어볼 소멸
      this.activePowerups.laserTimer = 0;
      this.activePowerups.fireballTimer = 0;

      this.updateUI();

      if (this.lives <= 0) {
        this.gameOver();
      } else {
        // 공 리셋 및 패들 위에 재장전
        this.resetBallOnPaddle();
      }
    }

    // 게임 오버
    gameOver() {
      this.state = 'GAMEOVER';
      this.audio.gameOver();

      const isNewRecord = this.score > this.highScore;
      if (isNewRecord) {
        this.highScore = this.score;
        this.saveHighScore(this.highScore);
      }

      if (this.dom.finalScore) this.dom.finalScore.textContent = this.score.toLocaleString();
      if (this.dom.finalHighScore) this.dom.finalHighScore.textContent = this.highScore.toLocaleString();
      if (this.dom.newRecordBadge) this.dom.newRecordBadge.style.display = isNewRecord ? 'inline-block' : 'none';

      this.dom.gameOverOverlay.classList.add('active');
      this.updateUI();
    }

    // 게임 재시작
    restartGame() {
      this.score = 0;
      this.level = 1;
      this.lives = 3;
      this.combo = 0;
      this.maxCombo = 0;
      this.activePowerups.expandTimer = 0;
      this.activePowerups.fireballTimer = 0;
      this.activePowerups.laserTimer = 0;
      this.activePowerups.barrierActive = false;
      this.paddle.width = PADDLE_BASE_WIDTH;
      this.paddle.targetWidth = PADDLE_BASE_WIDTH;

      this.powerups = [];
      this.lasers = [];
      this.particles = [];
      this.floatingTexts = [];

      this.hideAllOverlays();
      this.buildLevel(this.level);
      this.resetBallOnPaddle();

      this.state = 'PLAYING';
      this.updateUI();
    }

    // 점수 증가 및 콤보 반영
    addScore(points) {
      this.score += points;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.saveHighScore(this.highScore);
      }
      this.updateUI();
    }

    loadHighScore() {
      try {
        return parseInt(localStorage.getItem('breakout_high_score_v1') || '0', 10);
      } catch (e) {
        return 0;
      }
    }

    saveHighScore(val) {
      try {
        localStorage.setItem('breakout_high_score_v1', val.toString());
      } catch (e) {}
    }

    updateUI() {
      if (this.dom.score) this.dom.score.textContent = this.score.toLocaleString();
      if (this.dom.highScore) this.dom.highScore.textContent = this.highScore.toLocaleString();
      if (this.dom.level) this.dom.level.textContent = this.level.toString();

      // 생명 아이콘 렌더링
      if (this.dom.livesContainer) {
        let hearts = '';
        for (let i = 0; i < Math.max(0, this.lives); i++) {
          hearts += '<span class="life-icon" title="남은 기회">❤️</span>';
        }
        this.dom.livesContainer.innerHTML = hearts;
      }

      // 콤보 패널
      if (this.dom.combo) this.dom.combo.textContent = this.combo > 1 ? `${this.combo} COMBO!` : '';
      if (this.dom.comboContainer) {
        this.dom.comboContainer.classList.toggle('visible', this.combo >= 2);
      }

      // 활성 파워업 뱃지 렌더링
      if (this.dom.powerupBadges) {
        let badges = '';
        if (this.activePowerups.expandTimer > 0) {
          badges += `<span class="powerup-badge badge-expand">↔ 패들확장 ${Math.ceil(this.activePowerups.expandTimer)}s</span>`;
        }
        if (this.activePowerups.fireballTimer > 0) {
          badges += `<span class="powerup-badge badge-fire">🔥 파이어볼 ${Math.ceil(this.activePowerups.fireballTimer)}s</span>`;
        }
        if (this.activePowerups.laserTimer > 0) {
          badges += `<span class="powerup-badge badge-laser">▲ 레이저 ${Math.ceil(this.activePowerups.laserTimer)}s</span>`;
        }
        if (this.activePowerups.barrierActive) {
          badges += `<span class="powerup-badge badge-barrier">🛡️ 바닥보호막</span>`;
        }
        this.dom.powerupBadges.innerHTML = badges;
      }
    }

    // ==========================================
    // 6. 물리 시뮬레이션 및 업데이트 (Update)
    // ==========================================
    update(dt) {
      if (this.state !== 'PLAYING') return;

      // 스크린 쉐이크 감쇠
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 40);
      }

      // 파워업 타이머 갱신
      this.updatePowerupTimers(dt);

      // 패들 조작 및 위치 업데이트
      this.updatePaddle(dt);

      // 공 업데이트 (벽, 패들, 블록 충돌)
      this.updateBalls(dt);

      // 레이저 탄환 업데이트
      this.updateLasers(dt);

      // 아이템 낙하 업데이트
      this.updatePowerups(dt);

      // 파티클 및 텍스트 갱신
      this.updateParticles(dt);

      // 스테이지 클리어 조건 검사
      if (this.destructibleBricksCount <= 0) {
        this.onStageClear();
      }
    }

    updatePowerupTimers(dt) {
      if (this.activePowerups.expandTimer > 0) {
        this.activePowerups.expandTimer -= dt;
        if (this.activePowerups.expandTimer <= 0) {
          this.paddle.targetWidth = PADDLE_BASE_WIDTH;
        }
      }

      if (this.activePowerups.fireballTimer > 0) {
        this.activePowerups.fireballTimer -= dt;
      }

      if (this.activePowerups.laserTimer > 0) {
        this.activePowerups.laserTimer -= dt;
      }

      if (this.paddle.laserCooldown > 0) {
        this.paddle.laserCooldown -= dt;
      }

      this.updateUI();
    }

    updatePaddle(dt) {
      // 패들 가로 크기 스무스 애니메이션
      this.paddle.width += (this.paddle.targetWidth - this.paddle.width) * Math.min(1, dt * 10);

      // 키보드 조작
      let moveDir = 0;
      if (this.keys.left) moveDir -= 1;
      if (this.keys.right) moveDir += 1;

      if (moveDir !== 0) {
        this.paddle.vx = moveDir * PADDLE_KEY_SPEED;
        this.paddle.x += this.paddle.vx * dt;
      } else if (this.mouseControl.active) {
        // 마우스 / 터치 조작 (중앙을 커서 위치로)
        const targetX = this.mouseControl.x - this.paddle.width / 2;
        const diff = targetX - this.paddle.x;
        this.paddle.vx = diff * 15;
        this.paddle.x += diff * Math.min(1, dt * 25);
      } else {
        this.paddle.vx = 0;
      }

      // 화면 경계 클램프
      if (this.paddle.x < 0) this.paddle.x = 0;
      if (this.paddle.x + this.paddle.width > this.vWidth) {
        this.paddle.x = this.vWidth - this.paddle.width;
      }

      // 패들에 붙어있는 볼 위치 동기화
      this.balls.forEach(ball => {
        if (ball.stuckToPaddle) {
          ball.x = this.paddle.x + this.paddle.width / 2;
          ball.y = this.paddle.y - ball.radius - 1;
        }
      });
    }

    updateBalls(dt) {
      const isFireball = this.activePowerups.fireballTimer > 0;

      for (let i = this.balls.length - 1; i >= 0; i--) {
        const ball = this.balls[i];
        if (ball.stuckToPaddle) continue;

        // 서브스텝 물리 시뮬레이션 (터널링 방지)
        const steps = 3;
        const sdt = dt / steps;

        for (let s = 0; s < steps; s++) {
          ball.x += ball.vx * sdt;
          ball.y += ball.vy * sdt;

          // 1. 좌우 벽 충돌
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            this.audio.wallHit();
            this.spawnWallSparks(ball.x, ball.y, 1, 0);
          } else if (ball.x + ball.radius >= this.vWidth) {
            ball.x = this.vWidth - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            this.audio.wallHit();
            this.spawnWallSparks(ball.x, ball.y, -1, 0);
          }

          // 2. 상단 천장 충돌
          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            this.audio.wallHit();
            this.spawnWallSparks(ball.x, ball.y, 0, 1);
          }

          // 3. 하단 바닥 통과 / 방어막 충돌
          if (ball.y + ball.radius >= this.vHeight) {
            // 하단 방어막이 활성화되어 있는 경우
            if (this.activePowerups.barrierActive) {
              ball.y = this.vHeight - ball.radius - 4;
              ball.vy = -Math.abs(ball.vy);
              this.activePowerups.barrierActive = false; // 1회 방어 후 소멸
              this.audio.paddleHit(0);
              this.spawnExplosion(ball.x, this.vHeight - 10, '#38bdf8', 16);
              this.addFloatingText('BARRIER DEFLECT!', ball.x, this.vHeight - 30, '#38bdf8');
              this.updateUI();
              continue;
            }

            // 볼 제거
            this.balls.splice(i, 1);
            break;
          }

          // 4. 패들 충돌 검사
          if (ball.vy > 0 &&
              ball.y + ball.radius >= this.paddle.y &&
              ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
              ball.x + ball.radius >= this.paddle.x &&
              ball.x - ball.radius <= this.paddle.x + this.paddle.width) {

            // 패들 표면 위로 위치 보정
            ball.y = this.paddle.y - ball.radius;

            // 충돌 위치 비율 (-1 ~ +1)
            const paddleCenter = this.paddle.x + this.paddle.width / 2;
            const hitRatio = (ball.x - paddleCenter) / (this.paddle.width / 2);
            const clampedRatio = Math.max(-0.95, Math.min(0.95, hitRatio));

            // 반사 각도 계산 (중앙: 직각 위, 양 끝: 최대 65도 기울기)
            const maxAngle = 65 * (Math.PI / 180);
            const bounceAngle = clampedRatio * maxAngle - Math.PI / 2;

            // 속도 약간 증가 (최대 제한)
            ball.speed = Math.min(MAX_BALL_SPEED, ball.speed + 8);
            ball.vx = Math.cos(bounceAngle) * ball.speed;
            ball.vy = Math.sin(bounceAngle) * ball.speed;

            // 패들 충돌 사운드 및 스파크
            this.audio.paddleHit(clampedRatio);
            this.spawnPaddleSparks(ball.x, this.paddle.y);

            // 콤보 리셋
            this.combo = 0;
            this.updateUI();
          }

          // 5. 벽돌과의 충돌 검사
          this.checkBrickCollision(ball, isFireball);
        }

        // 트레일 파티클 기록
        if (ball) {
          ball.trail.push({ x: ball.x, y: ball.y, alpha: 1.0 });
          if (ball.trail.length > (isFireball ? 12 : 6)) {
            ball.trail.shift();
          }
        }
      }

      // 화면 내 볼이 모두 소진되었을 때 생명 감소
      if (this.balls.length === 0) {
        this.loseLife();
      }
    }

    // 볼과 벽돌 충돌 로직
    checkBrickCollision(ball, isFireball) {
      for (let i = 0; i < this.bricks.length; i++) {
        const brick = this.bricks[i];
        if (brick.hp <= 0) continue;

        // AABB 원형 충돌 판정
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));

        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distanceSq = distX * distX + distY * distY;

        if (distanceSq < ball.radius * ball.radius) {
          // 충돌 발생!
          if (!isFireball || brick.isSolid) {
            // 침투 깊이 분석하여 반사 방향 결정
            const overlapX = (ball.radius) - Math.abs(distX);
            const overlapY = (ball.radius) - Math.abs(distY);

            if (distX === 0 && distY === 0) {
              // 완전 내부
              ball.vy = -ball.vy;
            } else if (Math.abs(distX) > Math.abs(distY)) {
              // 좌우 측면 충돌
              ball.vx = distX > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
            } else {
              // 상하 측면 충돌
              ball.vy = distY > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
            }
          }

          // 벽돌 데미지 처리
          this.damageBrick(brick, 1, isFireball);

          // 파이어볼이 아닌 경우 단일 충돌 후 중단
          if (!isFireball) break;
        }
      }
    }

    // 벽돌 타격 & 파괴
    damageBrick(brick, amount = 1, isFireball = false) {
      if (brick.isSolid) {
        this.audio.hardHit();
        this.spawnWallSparks(brick.x + brick.w / 2, brick.y + brick.h / 2, 0, -1);
        return;
      }

      brick.hitFlash = 1.0;
      brick.hp -= amount;

      if (brick.hp <= 0) {
        // 벽돌 파괴!
        this.destructibleBricksCount--;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        const comboMultiplier = Math.min(3.5, 1 + (this.combo - 1) * 0.25);
        const earnedPoints = Math.round(brick.points * comboMultiplier);
        this.addScore(earnedPoints);

        // 플로팅 점수 표시
        const scoreText = this.combo > 1 ? `+${earnedPoints} (x${comboMultiplier.toFixed(1)})` : `+${earnedPoints}`;
        this.addFloatingText(scoreText, brick.x + brick.w / 2, brick.y, brick.light);

        // 사운드 재생
        if (brick.isBomb) {
          this.audio.bombExplode();
          this.triggerBomb(brick);
        } else {
          this.audio.brickHit(brick.points, this.combo);
        }

        // 파괴 파티클 생성
        this.spawnExplosion(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 12);

        // 아이템 드롭 검사
        this.checkItemDrop(brick);

      } else {
        // 단단한 벽돌 피격 (HP 남음)
        this.audio.hardHit();
        this.spawnWallSparks(brick.x + brick.w / 2, brick.y + brick.h / 2, 0, -1);
      }

      this.updateUI();
    }

    // 폭탄 벽돌 폭발 (3x3 반경 인접 벽돌 동시 격파)
    triggerBomb(bombBrick) {
      this.screenShake = 12;
      const radiusX = (BRICK_WIDTH + BRICK_PADDING) * 1.5;
      const radiusY = (BRICK_HEIGHT + BRICK_PADDING) * 1.5;

      this.bricks.forEach(b => {
        if (b.hp <= 0 || b.isSolid) return;
        const dx = Math.abs((b.x + b.w / 2) - (bombBrick.x + bombBrick.w / 2));
        const dy = Math.abs((b.y + b.h / 2) - (bombBrick.y + bombBrick.h / 2));

        if (dx <= radiusX && dy <= radiusY && b !== bombBrick) {
          // 연쇄 폭발
          setTimeout(() => {
            if (b.hp > 0) this.damageBrick(b, 3);
          }, 40 + Math.random() * 80);
        }
      });
    }

    // 아이템 드롭 확률 계산
    checkItemDrop(brick) {
      // ITEM 벽돌은 100% 드롭, 일반 벽돌은 14% 확률 드롭
      const shouldDrop = brick.isItem || Math.random() < 0.14;
      if (!shouldDrop) return;

      // 파워업 종류 무작위 선택 (가중치 부여)
      const powerupDef = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

      this.powerups.push({
        x: brick.x + brick.w / 2,
        y: brick.y + brick.h / 2,
        w: 36,
        h: 20,
        vy: 140,
        type: powerupDef.type,
        name: powerupDef.name,
        color: powerupDef.color,
        symbol: powerupDef.symbol,
        duration: powerupDef.duration,
        rotation: 0
      });
    }

    // 레이저 탄환 업데이트
    updateLasers(dt) {
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const laser = this.lasers[i];
        laser.y += laser.vy * dt;

        // 화면 상단 밖으로 이탈
        if (laser.y < 0) {
          this.lasers.splice(i, 1);
          continue;
        }

        // 벽돌과의 충돌 검사
        for (let j = 0; j < this.bricks.length; j++) {
          const brick = this.bricks[j];
          if (brick.hp <= 0) continue;

          if (laser.x >= brick.x && laser.x <= brick.x + brick.w &&
              laser.y >= brick.y && laser.y <= brick.y + brick.h) {

            this.audio.laserHit();
            this.damageBrick(brick, 1);
            this.spawnWallSparks(laser.x, laser.y, 0, 1);
            this.lasers.splice(i, 1);
            break;
          }
        }
      }
    }

    // 떨어지는 파워업 아이템 업데이트
    updatePowerups(dt) {
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const item = this.powerups[i];
        item.y += item.vy * dt;
        item.rotation += dt * 3;

        // 패들과 충돌 검사 (획득)
        if (item.y + item.h / 2 >= this.paddle.y &&
            item.y - item.h / 2 <= this.paddle.y + this.paddle.height &&
            item.x + item.w / 2 >= this.paddle.x &&
            item.x - item.w / 2 <= this.paddle.x + this.paddle.width) {

          this.activatePowerup(item);
          this.powerups.splice(i, 1);
          continue;
        }

        // 화면 바닥 밖으로 떨어짐
        if (item.y - item.h > this.vHeight) {
          this.powerups.splice(i, 1);
        }
      }
    }

    // 획득한 파워업 발동
    activatePowerup(item) {
      this.audio.powerupCollect();
      this.addScore(100);
      this.addFloatingText(`${item.name}!`, item.x, this.paddle.y - 20, item.color);
      this.spawnExplosion(item.x, this.paddle.y, item.color, 16);

      switch (item.type) {
        case 'EXPAND':
          this.activePowerups.expandTimer = item.duration;
          this.paddle.targetWidth = PADDLE_EXPAND_WIDTH;
          break;

        case 'MULTI':
          // 각 볼에서 새로운 2개 볼 복제 분기
          const newBalls = [];
          this.balls.forEach(ball => {
            for (let a = -1; a <= 1; a += 2) {
              const angle = Math.atan2(ball.vy, ball.vx) + a * 0.35;
              newBalls.push({
                x: ball.x,
                y: ball.y,
                vx: Math.cos(angle) * ball.speed,
                vy: Math.sin(angle) * ball.speed,
                radius: ball.radius,
                speed: ball.speed,
                stuckToPaddle: false,
                trail: []
              });
            }
          });
          this.balls = this.balls.concat(newBalls);
          break;

        case 'LASER':
          this.activePowerups.laserTimer = item.duration;
          break;

        case 'FIREBALL':
          this.activePowerups.fireballTimer = item.duration;
          break;

        case 'SLOW':
          this.balls.forEach(b => {
            b.speed = BASE_BALL_SPEED;
            const currentAngle = Math.atan2(b.vy, b.vx);
            b.vx = Math.cos(currentAngle) * BASE_BALL_SPEED;
            b.vy = Math.sin(currentAngle) * BASE_BALL_SPEED;
          });
          break;

        case 'BARRIER':
          this.activePowerups.barrierActive = true;
          break;

        case 'LIFE':
          if (this.lives < 5) {
            this.lives++;
          }
          break;
      }

      this.updateUI();
    }

    // 파티클 및 플로팅 텍스트 갱신
    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.gravity || 0) * dt;
        p.alpha -= dt / p.lifetime;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y -= 45 * dt;
        ft.alpha -= dt / 0.85;

        if (ft.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    // ==========================================
    // 7. 시각 효과 및 파티클 생성기
    // ==========================================
    spawnExplosion(x, y, color, count = 10) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 240,
          size: 2 + Math.random() * 4,
          color: color,
          alpha: 1.0,
          lifetime: 0.35 + Math.random() * 0.35
        });
      }
    }

    spawnPaddleSparks(x, y) {
      for (let i = 0; i < 7; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const speed = 80 + Math.random() * 140;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 120,
          size: 2 + Math.random() * 2,
          color: '#38bdf8',
          alpha: 1.0,
          lifetime: 0.25
        });
      }
    }

    spawnWallSparks(x, y, nx, ny) {
      for (let i = 0; i < 5; i++) {
        const baseAngle = Math.atan2(ny, nx);
        const angle = baseAngle + (Math.random() - 0.5) * 1.2;
        const speed = 70 + Math.random() * 100;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 80,
          size: 2,
          color: '#ffffff',
          alpha: 0.9,
          lifetime: 0.2
        });
      }
    }

    addFloatingText(text, x, y, color = '#ffffff') {
      this.floatingTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        alpha: 1.0
      });
    }

    // ==========================================
    // 8. 렌더링 (Draw)
    // ==========================================
    render() {
      const ctx = this.ctx;

      // 캔버스 클리어 & 배경 그리기
      ctx.save();

      // 스크린 쉐이크 오프셋 적용
      if (this.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * this.screenShake;
        const shakeY = (Math.random() - 0.5) * this.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 짙은 우주 아케이드 배경
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, this.vWidth, this.vHeight);

      // 미세 배경 격자선
      this.drawBackgroundGrid(ctx);

      // 하단 안전 방어막 (활성화 시)
      if (this.activePowerups.barrierActive) {
        this.drawBarrier(ctx);
      }

      // 벽돌 렌더링
      this.drawBricks(ctx);

      // 레이저 탄환
      this.drawLasers(ctx);

      // 아이템 캡슐
      this.drawPowerups(ctx);

      // 패들 렌더링
      this.drawPaddle(ctx);

      // 볼 렌더링
      this.drawBalls(ctx);

      // 파티클
      this.drawParticles(ctx);

      // 플로팅 텍스트
      this.drawFloatingTexts(ctx);

      ctx.restore();
    }

    drawBackgroundGrid(ctx) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < this.vWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.vHeight);
        ctx.stroke();
      }
      for (let y = 0; y < this.vHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.vWidth, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawBarrier(ctx) {
      ctx.save();
      const glow = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(56, 189, 248, ${glow})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(0, this.vHeight - 4);
      ctx.lineTo(this.vWidth, this.vHeight - 4);
      ctx.stroke();
      ctx.restore();
    }

    drawBricks(ctx) {
      for (let i = 0; i < this.bricks.length; i++) {
        const b = this.bricks[i];
        if (b.hp <= 0) continue;

        ctx.save();

        // 타격 플래시 효과
        if (b.hitFlash > 0) {
          ctx.fillStyle = '#ffffff';
          b.hitFlash = Math.max(0, b.hitFlash - 0.1);
        } else {
          // 벽돌 그라데이션 및 입체 베벨
          const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
          grad.addColorStop(0, b.light);
          grad.addColorStop(1, b.color);
          ctx.fillStyle = grad;
        }

        // 라운드 박스 그리기
        this.roundRect(ctx, b.x, b.y, b.w, b.h, 3);
        ctx.fill();

        // 입체 광택 테두리
        ctx.strokeStyle = b.stroke;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 상단 하이라이트 라인
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(b.x + 2, b.y + 2);
        ctx.lineTo(b.x + b.w - 2, b.y + 2);
        ctx.stroke();

        // 내구도 크랙 표시 (단단한 벽돌이 타격받은 경우)
        if (b.isHard && b.hp < b.maxHp) {
          this.drawCracks(ctx, b);
        }

        // 폭탄 벽돌 아이콘 (💣)
        if (b.isBomb) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', b.x + b.w / 2, b.y + b.h / 2);
        }

        // 아이템 벽돌 아이콘 (⭐)
        if (b.isItem) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const pulse = Math.sin(Date.now() * 0.006) * 2;
          ctx.fillText('⭐', b.x + b.w / 2, b.y + b.h / 2 + pulse);
        }

        ctx.restore();
      }
    }

    // 벽돌 균열(크랙) 효과 그리기
    drawCracks(ctx, b) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.3, b.y + 2);
      ctx.lineTo(b.x + b.w * 0.45, b.y + b.h * 0.6);
      ctx.lineTo(b.x + b.w * 0.75, b.y + b.h - 2);
      ctx.stroke();

      if (b.hp === 1 && b.maxHp >= 3) {
        ctx.beginPath();
        ctx.moveTo(b.x + b.w * 0.45, b.y + b.h * 0.6);
        ctx.lineTo(b.x + b.w * 0.2, b.y + b.h * 0.85);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPaddle(ctx) {
      ctx.save();
      const p = this.paddle;
      const isLaser = this.activePowerups.laserTimer > 0;

      // 패들 본체 그라데이션 (네온 메탈릭 룩)
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(0.3, isLaser ? '#f87171' : '#38bdf8');
      grad.addColorStop(0.7, isLaser ? '#dc2626' : '#0284c7');
      grad.addColorStop(1, '#0f172a');

      ctx.shadowColor = isLaser ? 'rgba(239, 68, 68, 0.6)' : 'rgba(56, 189, 248, 0.5)';
      ctx.shadowBlur = 12;

      ctx.fillStyle = grad;
      this.roundRect(ctx, p.x, p.y, p.width, p.height, 6);
      ctx.fill();

      // 상단 고반사 하이라이트
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 5, p.y + 2);
      ctx.lineTo(p.x + p.width - 5, p.y + 2);
      ctx.stroke();

      // 레이저 포탑 캐논
      if (isLaser) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(p.x + 5, p.y - 6, 6, 6);
        ctx.fillRect(p.x + p.width - 11, p.y - 6, 6, 6);
      }

      ctx.restore();
    }

    drawBalls(ctx) {
      const isFireball = this.activePowerups.fireballTimer > 0;

      this.balls.forEach(ball => {
        ctx.save();

        // 트레일 잔상 렌더링
        for (let i = 0; i < ball.trail.length; i++) {
          const t = ball.trail[i];
          const progress = i / ball.trail.length;
          ctx.beginPath();
          ctx.arc(t.x, t.y, ball.radius * (0.3 + progress * 0.7), 0, Math.PI * 2);
          ctx.fillStyle = isFireball
            ? `rgba(249, 115, 22, ${progress * 0.5})`
            : `rgba(56, 189, 248, ${progress * 0.35})`;
          ctx.fill();
        }

        // 메인 볼 본체
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

        if (isFireball) {
          // 파이어볼 글로우
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 16;
          const fGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius);
          fGrad.addColorStop(0, '#ffffff');
          fGrad.addColorStop(0.4, '#fde047');
          fGrad.addColorStop(1, '#ea580c');
          ctx.fillStyle = fGrad;
        } else {
          // 클래식 빛나는 에너지 볼
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          const bGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius);
          bGrad.addColorStop(0, '#ffffff');
          bGrad.addColorStop(0.5, '#7dd3fc');
          bGrad.addColorStop(1, '#0284c7');
          ctx.fillStyle = bGrad;
        }

        ctx.fill();
        ctx.restore();
      });
    }

    drawLasers(ctx) {
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff4d4d';

      this.lasers.forEach(l => {
        ctx.fillRect(l.x - 2, l.y, 4, 14);
      });
      ctx.restore();
    }

    drawPowerups(ctx) {
      this.powerups.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);

        // 캡슐 형태 배경
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = item.color;
        this.roundRect(ctx, -item.w / 2, -item.h / 2, item.w, item.h, 10);
        ctx.fill();

        // 캡슐 광택
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 심볼 텍스트
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.symbol, 0, 0);

        ctx.restore();
      });
    }

    drawParticles(ctx) {
      ctx.save();
      this.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    drawFloatingTexts(ctx) {
      ctx.save();
      this.floatingTexts.forEach(ft => {
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.restore();
    }

    // 둥근 사각형 헬퍼
    roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    // ==========================================
    // 9. 메인 게임 루프 (Loop)
    // ==========================================
    loop(timestamp) {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // 델타 타임 제한 (최대 50ms)
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(time => this.loop(time));
    }
  }

  // DOM 로드 완료 후 게임 인스턴스 초기화
  window.addEventListener('DOMContentLoaded', () => {
    window.breakoutGame = new BreakoutGame();
  });
})();
