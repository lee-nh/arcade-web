/**
 * 클래식 스네이크 게임 (Classic Snake Game)
 */

// --- 사운드 효과 관리자 (Web Audio API 기반, 별도 음원 파일 불필요) ---
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // 먹이 획득 효과음 (상승하는 맑은 비프음)
    playEat() {
        if (!this.enabled) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    // 게임 오버 효과음 (하강하는 레트로 사운드)
    playGameOver() {
        if (!this.enabled) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // 버튼 클릭 및 방향 전환 효과음
    playClick() {
        if (!this.enabled) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }
}

// --- 게임 메인 클래스 ---
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // 요소 참조
        this.currentScoreEl = document.getElementById('current-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.overlay = document.getElementById('overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMsg = document.getElementById('overlay-msg');
        this.finalStats = document.getElementById('final-stats');
        this.finalScoreEl = document.getElementById('final-score');
        this.startBtn = document.getElementById('start-btn');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.resumeBtn = document.getElementById('resume-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.soundBtn = document.getElementById('sound-btn');
        this.speedSelect = document.getElementById('speed-select');

        // 사운드 매니저
        this.sound = new SoundManager();

        // 게임 상수 및 설정
        this.GRID_COUNT = 20; // 20x20 그리드
        this.TILE_SIZE = this.canvas.width / this.GRID_COUNT; // 20px

        // 게임 상태
        this.snake = [];
        this.direction = { x: 0, y: -1 };
        this.nextDirection = { x: 0, y: -1 };
        this.food = { x: 0, y: 0 };
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('snake_best_score') || '0', 10);
        this.speed = parseInt(this.speedSelect.value, 10);
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameLoopTimer = null;

        // 초기화
        this.bestScoreEl.textContent = this.bestScore;
        this.setupEventListeners();
        this.resetGame();
        this.render(); // 첫 화면 렌더링
    }

    // 게임 상태 초기화
    resetGame() {
        const mid = Math.floor(this.GRID_COUNT / 2);
        // 초기 뱀 몸통 (머리가 위를 향함)
        this.snake = [
            { x: mid, y: mid },
            { x: mid, y: mid + 1 },
            { x: mid, y: mid + 2 }
        ];
        this.direction = { x: 0, y: -1 };
        this.nextDirection = { x: 0, y: -1 };
        this.score = 0;
        this.currentScoreEl.textContent = '0';
        this.spawnFood();
    }

    // 음식(먹이) 무작위 생성 (뱀 몸통과 겹치지 않는 위치)
    spawnFood() {
        let valid = false;
        let candidate = { x: 0, y: 0 };

        while (!valid) {
            candidate = {
                x: Math.floor(Math.random() * this.GRID_COUNT),
                y: Math.floor(Math.random() * this.GRID_COUNT)
            };
            // 뱀의 몸통과 겹치는지 체크
            valid = !this.snake.some(seg => seg.x === candidate.x && seg.y === candidate.y);
        }
        this.food = candidate;
    }

    // 게임 시작
    startGame() {
        this.resetGame();
        this.isRunning = true;
        this.isPaused = false;
        this.overlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        this.speed = parseInt(this.speedSelect.value, 10);

        if (this.gameLoopTimer) clearInterval(this.gameLoopTimer);
        this.gameLoopTimer = setInterval(() => this.tick(), this.speed);
    }

    // 일시정지 토글
    togglePause() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            clearInterval(this.gameLoopTimer);
            this.pauseOverlay.classList.remove('hidden');
            this.pauseBtn.textContent = '▶️';
        } else {
            this.pauseOverlay.classList.add('hidden');
            this.pauseBtn.textContent = '⏸️';
            this.gameLoopTimer = setInterval(() => this.tick(), this.speed);
        }
    }

    // 게임 오버 처리
    gameOver() {
        this.isRunning = false;
        clearInterval(this.gameLoopTimer);
        this.sound.playGameOver();

        // 최고 점수 갱신
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreEl.textContent = this.bestScore;
            localStorage.setItem('snake_best_score', this.bestScore.toString());
        }

        // 결과 화면 표시
        this.overlayTitle.textContent = 'GAME OVER';
        this.overlayMsg.textContent = '아쉽네요! 다시 도전해보세요.';
        this.finalScoreEl.textContent = this.score;
        this.finalStats.classList.remove('hidden');
        this.startBtn.textContent = '다시 시작';
        this.overlay.classList.remove('hidden');
    }

    // 게임 틱(Tick) 단위 진행
    tick() {
        // 방향 업데이트 (동일 틱 다중 키입력 역주행 방지)
        this.direction = { ...this.nextDirection };

        // 새로운 머리 위치 계산
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // 1. 벽 충돌 체크
        if (
            head.x < 0 || head.x >= this.GRID_COUNT ||
            head.y < 0 || head.y >= this.GRID_COUNT
        ) {
            this.gameOver();
            return;
        }

        // 2. 자기 자신 몸통 충돌 체크
        // 주의: 꼬리 마지막 칸은 머리가 들어가면서 빠져나가므로, 먹이를 안 먹은 경우 마지막 칸 충돌은 예외가 될 수 있으나,
        // 일반 규칙대로 snake 몸통 전체와 비교
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        // 머리 추가
        this.snake.unshift(head);

        // 3. 먹이 섭취 여부
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.currentScoreEl.textContent = this.score;
            this.sound.playEat();
            this.spawnFood();
            // 꼬리를 자르지 않음(길이가 1 길어짐)
        } else {
            // 먹이를 먹지 않았다면 꼬리 한 칸 제거
            this.snake.pop();
        }

        // 렌더링
        this.render();
    }

    // 방향 변경 요청
    setDirection(newDir) {
        if (!this.isRunning) {
            this.startGame();
            return;
        }
        if (this.isPaused) return;

        // 반대 방향 전환 방지 (예: 왼쪽으로 이동 중 오른쪽 키 무시)
        if (newDir.x !== 0 && newDir.x === -this.direction.x) return;
        if (newDir.y !== 0 && newDir.y === -this.direction.y) return;

        this.nextDirection = newDir;
    }

    // 렌더링 함수
    render() {
        const { ctx, canvas, TILE_SIZE, GRID_COUNT } = this;

        // 배경 지우기
        ctx.fillStyle = '#0c101a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 미세한 체크무늬 그리드 배경 (레트로 아케이드 효과)
        for (let r = 0; r < GRID_COUNT; r++) {
            for (let c = 0; c < GRID_COUNT; c++) {
                if ((r + c) % 2 === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
                    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // 1. 먹이 그리기 (빛나는 네온 레드 사과/구슬)
        this.drawFood(this.food.x, this.food.y);

        // 2. 뱀 그리기
        this.drawSnake();
    }

    // 먹이 렌더링
    drawFood(gridX, gridY) {
        const { ctx, TILE_SIZE } = this;
        const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
        const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;
        const radius = TILE_SIZE / 2 - 2;

        // 은은한 외곽 글로우 효과
        ctx.save();
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // 하이라이트 빛반사 점
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 뱀 렌더링
    drawSnake() {
        const { ctx, TILE_SIZE } = this;

        this.snake.forEach((seg, index) => {
            const isHead = index === 0;
            const x = seg.x * TILE_SIZE;
            const y = seg.y * TILE_SIZE;
            const padding = 1.5;
            const innerSize = TILE_SIZE - padding * 2;
            const borderRadius = isHead ? 6 : 4;

            ctx.save();

            if (isHead) {
                // 머리 스타일: 선명한 네온 그린 & 글로우
                ctx.shadowColor = 'rgba(0, 240, 132, 0.6)';
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#00f084';
                this.roundRect(ctx, x + padding, y + padding, innerSize, innerSize, borderRadius);
                ctx.fill();

                // 눈 그리기 (이동 방향에 맞춰 눈 위치 결정)
                this.drawEyes(x, y, innerSize);
            } else {
                // 몸통: 꼬리로 갈수록 점진적으로 어두워지는 그라데이션
                const ratio = index / this.snake.length;
                const r = Math.round(0);
                const g = Math.round(220 - ratio * 80);
                const b = Math.round(120 - ratio * 40);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

                this.roundRect(ctx, x + padding, y + padding, innerSize, innerSize, borderRadius);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    // 뱀 머리에 눈 그리기
    drawEyes(x, y, size) {
        const { ctx, direction } = this;
        ctx.fillStyle = '#0d111a'; // 동공 색상

        const eyeRadius = 2.2;
        let eye1 = { x: 0, y: 0 };
        let eye2 = { x: 0, y: 0 };

        const offsetSide = size * 0.26;
        const offsetForward = size * 0.26;
        const mid = size / 2 + 1.5;

        if (direction.y === -1) { // 위쪽
            eye1 = { x: x + mid - offsetSide, y: y + mid - offsetForward };
            eye2 = { x: x + mid + offsetSide, y: y + mid - offsetForward };
        } else if (direction.y === 1) { // 아래쪽
            eye1 = { x: x + mid - offsetSide, y: y + mid + offsetForward };
            eye2 = { x: x + mid + offsetSide, y: y + mid + offsetForward };
        } else if (direction.x === -1) { // 왼쪽
            eye1 = { x: x + mid - offsetForward, y: y + mid - offsetSide };
            eye2 = { x: x + mid - offsetForward, y: y + mid + offsetSide };
        } else { // 오른쪽
            eye1 = { x: x + mid + offsetForward, y: y + mid - offsetSide };
            eye2 = { x: x + mid + offsetForward, y: y + mid + offsetSide };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 둥근 사각형 유틸리티
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

    // 이벤트 리스너 등록
    setupEventListeners() {
        // 키보드 조작
        window.addEventListener('keydown', (e) => {
            const key = e.key;

            // 스페이스바: 일시정지 토글
            if (key === ' ' || key === 'Spacebar') {
                e.preventDefault();
                this.togglePause();
                return;
            }

            // 방향키 및 WASD
            let newDir = null;
            if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                newDir = { x: 0, y: -1 };
            } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
                newDir = { x: 0, y: 1 };
            } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                newDir = { x: -1, y: 0 };
            } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                newDir = { x: 1, y: 0 };
            }

            if (newDir) {
                // 브라우저 기본 스크롤 방지
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                    e.preventDefault();
                }
                this.setDirection(newDir);
            }
        });

        // 시작 / 다시시작 버튼
        this.startBtn.addEventListener('click', () => {
            this.sound.playClick();
            this.startGame();
        });

        // 계속하기 버튼
        this.resumeBtn.addEventListener('click', () => {
            this.sound.playClick();
            this.togglePause();
        });

        // 일시정지 버튼
        this.pauseBtn.addEventListener('click', () => {
            this.sound.playClick();
            this.togglePause();
        });

        // 사운드 토글 버튼
        this.soundBtn.addEventListener('click', () => {
            const isEnabled = this.sound.toggle();
            this.soundBtn.textContent = isEnabled ? '🔊' : '🔇';
        });

        // 난이도 변경
        this.speedSelect.addEventListener('change', (e) => {
            this.speed = parseInt(e.target.value, 10);
            if (this.isRunning && !this.isPaused) {
                clearInterval(this.gameLoopTimer);
                this.gameLoopTimer = setInterval(() => this.tick(), this.speed);
            }
        });

        // D-패드 (모바일 및 마우스 클릭 지원)
        const dpadButtons = document.querySelectorAll('.dpad-btn');
        dpadButtons.forEach(btn => {
            const handler = (e) => {
                e.preventDefault();
                this.sound.playClick();
                const dirCode = btn.getAttribute('data-dir');
                let dir = null;
                if (dirCode === 'ArrowUp') dir = { x: 0, y: -1 };
                else if (dirCode === 'ArrowDown') dir = { x: 0, y: 1 };
                else if (dirCode === 'ArrowLeft') dir = { x: -1, y: 0 };
                else if (dirCode === 'ArrowRight') dir = { x: 1, y: 0 };

                if (dir) this.setDirection(dir);
            };

            btn.addEventListener('pointerdown', handler);
        });

        // 캔버스 모바일 스와이프 제스처 지원
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isRunning) {
                this.startGame();
                return;
            }
            if (e.changedTouches.length === 0) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            const minSwipeDist = 20;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 가로 스와이프
                if (Math.abs(diffX) > minSwipeDist) {
                    if (diffX > 0) this.setDirection({ x: 1, y: 0 }); // 우
                    else this.setDirection({ x: -1, y: 0 }); // 좌
                }
            } else {
                // 세로 스와이프
                if (Math.abs(diffY) > minSwipeDist) {
                    if (diffY > 0) this.setDirection({ x: 0, y: 1 }); // 하
                    else this.setDirection({ x: 0, y: -1 }); // 상
                }
            }
        }, { passive: true });
    }
}

// 브라우저 로드 시 게임 인스턴스 생성
window.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();
});
