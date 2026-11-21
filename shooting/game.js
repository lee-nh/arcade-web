// 1990s Arcade Plane Shooter: "AERO STRIKE 1995"
// Pure Vanilla JavaScript & HTML5 Canvas Arcade Engine

(function () {
    'use strict';

    // Canvas & Setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Dimensions
    const W = 480;
    const H = 640;
    canvas.width = W;
    canvas.height = H;

    // Game States
    const STATE_TITLE = 0;
    const STATE_PLAYING = 1;
    const STATE_BOSSWARNING = 2;
    const STATE_GAMEOVER = 3;
    const STATE_VICTORY = 4;

    let gameState = STATE_TITLE;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('aerostrike_hiscore') || '10000', 10);
    let stageTimer = 0;
    let shakeTimer = 0;
    let shakeIntensity = 0;
    let flashTimer = 0;
    let warningTimer = 0;

    // Input Handling
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'KeyM') {
            const muted = window.retroAudio.toggleMute();
            showFloatingText(W / 2, H / 2, muted ? 'SOUND: OFF' : 'SOUND: ON', '#FECA57');
        }
        if (e.code === 'KeyP' && (gameState === STATE_PLAYING || gameState === STATE_BOSSWARNING)) {
            paused = !paused;
        }
        if (gameState === STATE_TITLE && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ')) {
            startGame();
        }
        if ((gameState === STATE_GAMEOVER || gameState === STATE_VICTORY) && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ')) {
            startGame();
        }
        // Unlock Web Audio context on first user action
        window.retroAudio.init();
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    let paused = false;

    // Floating text feedback (+1000, POWER UP, etc.)
    const floatingTexts = [];
    function showFloatingText(x, y, text, color = '#FFFFFF', size = 14) {
        floatingTexts.push({ x, y, text, color, size, life: 60, maxLife: 60 });
    }

    // Screen Shake Trigger
    function triggerShake(intensity = 6, frames = 15) {
        shakeIntensity = intensity;
        shakeTimer = frames;
    }

    // --- Particle System ---
    const particles = [];
    function spawnExplosion(x, y, count = 16, colorPalette = ['#FECA57', '#FF9F43', '#EE5253', '#FFFFFF']) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            const size = 2 + Math.random() * 4;
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                life: 20 + Math.floor(Math.random() * 20),
                maxLife: 40
            });
        }
    }

    function spawnSmoke(x, y) {
        particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 1.5 + Math.random() * 1.5,
            size: 3 + Math.random() * 3,
            color: Math.random() > 0.5 ? '#8395A7' : '#576574',
            life: 18,
            maxLife: 18
        });
    }

    // --- Parallax Background Layers ---
    class Background {
        constructor() {
            this.oceanY = 0;
            this.clouds = [];
            this.islands = [];

            // Generate initial islands
            for (let i = 0; i < 5; i++) {
                this.islands.push({
                    x: Math.random() * (W - 80) + 40,
                    y: Math.random() * H,
                    radius: 25 + Math.random() * 35,
                    color: Math.random() > 0.5 ? '#10AC84' : '#1DD1A1',
                    sandColor: '#F6E58D'
                });
            }

            // Generate initial clouds
            for (let i = 0; i < 6; i++) {
                this.clouds.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    speed: 1.8 + Math.random() * 1.5,
                    size: 40 + Math.random() * 60,
                    alpha: 0.35 + Math.random() * 0.25
                });
            }
        }

        update() {
            this.oceanY = (this.oceanY + 1.2) % 32;

            // Update islands (slow drift)
            this.islands.forEach(island => {
                island.y += 0.8;
                if (island.y - island.radius > H) {
                    island.y = -island.radius - 20;
                    island.x = Math.random() * (W - 100) + 50;
                }
            });

            // Update high clouds (faster drift)
            this.clouds.forEach(cloud => {
                cloud.y += cloud.speed;
                if (cloud.y - cloud.size > H) {
                    cloud.y = -cloud.size - 30;
                    cloud.x = Math.random() * W;
                }
            });
        }

        draw(ctx) {
            // 1. Deep Ocean Base
            ctx.fillStyle = '#0984E3';
            ctx.fillRect(0, 0, W, H);

            // Water waves texture (subtle retro horizontal bands)
            ctx.fillStyle = '#0770C4';
            for (let y = this.oceanY - 32; y < H; y += 32) {
                ctx.fillRect(0, y, W, 2);
            }

            // 2. Islands
            this.islands.forEach(island => {
                // Sand rim
                ctx.fillStyle = island.sandColor;
                ctx.beginPath();
                ctx.arc(island.x, island.y, island.radius + 4, 0, Math.PI * 2);
                ctx.fill();

                // Lush green center
                ctx.fillStyle = island.color;
                ctx.beginPath();
                ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
                ctx.fill();

                // Island details (trees/structures)
                ctx.fillStyle = '#218C74';
                ctx.beginPath();
                ctx.arc(island.x - 8, island.y - 6, island.radius * 0.45, 0, Math.PI * 2);
                ctx.fill();
            });

            // 3. Cloud Shadows
            ctx.fillStyle = 'rgba(0, 30, 80, 0.2)';
            this.clouds.forEach(c => {
                ctx.beginPath();
                ctx.arc(c.x + 15, c.y + 25, c.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // 4. Clouds (High altitude layer)
            this.clouds.forEach(c => {
                ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
                ctx.arc(c.x + c.size * 0.4, c.y - c.size * 0.2, c.size * 0.7, 0, Math.PI * 2);
                ctx.arc(c.x - c.size * 0.4, c.y + c.size * 0.1, c.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // --- Player Class ---
    class Player {
        constructor() {
            this.x = W / 2;
            this.y = H - 80;
            this.speed = 4.2;
            this.lives = 3;
            this.bombs = 2;
            this.power = 1; // 1 to 4
            this.shootCooldown = 0;
            this.invulnerableTimer = 120; // 2 seconds safety upon start/respawn
            this.bankState = 'player'; // 'player', 'playerLeft', 'playerRight'
            this.width = 48;
            this.height = 52;
            this.hitRadius = 6; // Fair arcade hitbox (center of plane)
            this.missileTimer = 0;
        }

        resetPosition() {
            this.x = W / 2;
            this.y = H - 80;
            this.invulnerableTimer = 150;
        }

        update() {
            if (this.invulnerableTimer > 0) this.invulnerableTimer--;
            if (this.shootCooldown > 0) this.shootCooldown--;
            if (this.missileTimer > 0) this.missileTimer--;

            let dx = 0;
            let dy = 0;

            if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
            if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
            if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
            if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

            // Bank sprite animation
            if (dx < 0) {
                this.bankState = 'playerLeft';
            } else if (dx > 0) {
                this.bankState = 'playerRight';
            } else {
                this.bankState = 'player';
            }

            // Diagonal normalization
            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }

            this.x += dx * this.speed;
            this.y += dy * this.speed;

            // Clamping to screen boundaries
            const margin = 26;
            if (this.x < margin) this.x = margin;
            if (this.x > W - margin) this.x = W - margin;
            if (this.y < 35) this.y = 35;
            if (this.y > H - 35) this.y = H - 35;

            // Engine trail particles
            if (Math.random() > 0.4) {
                particles.push({
                    x: this.x + (Math.random() - 0.5) * 8,
                    y: this.y + 22,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: 3 + Math.random() * 2,
                    size: 2.5 + Math.random() * 2.5,
                    color: Math.random() > 0.5 ? '#FECA57' : '#FF9F43',
                    life: 10,
                    maxLife: 10
                });
            }

            // Shooting: Space or KeyZ
            if (keys['Space'] || keys['KeyZ']) {
                this.fire();
            }

            // Bomb: KeyX
            if (keys['KeyX']) {
                this.useBomb();
                keys['KeyX'] = false; // Trigger once per press
            }
        }

        fire() {
            if (this.shootCooldown > 0) return;
            this.shootCooldown = 7; // Fast responsive autofire

            window.retroAudio.playShoot();

            if (this.power === 1) {
                // Dual Straight Cannons
                bullets.push(new Bullet(this.x - 8, this.y - 18, 0, -11, true));
                bullets.push(new Bullet(this.x + 8, this.y - 18, 0, -11, true));
            } else if (this.power === 2) {
                // 3-way Spread
                bullets.push(new Bullet(this.x, this.y - 20, 0, -12, true));
                bullets.push(new Bullet(this.x - 12, this.y - 16, -1.8, -11, true));
                bullets.push(new Bullet(this.x + 12, this.y - 16, 1.8, -11, true));
            } else if (this.power === 3) {
                // 4-way Spread + Missiles
                bullets.push(new Bullet(this.x - 6, this.y - 20, -0.6, -12, true));
                bullets.push(new Bullet(this.x + 6, this.y - 20, 0.6, -12, true));
                bullets.push(new Bullet(this.x - 16, this.y - 15, -2.5, -11, true));
                bullets.push(new Bullet(this.x + 16, this.y - 15, 2.5, -11, true));

                if (this.missileTimer <= 0) {
                    this.missileTimer = 22;
                    missiles.push(new HomingMissile(this.x - 18, this.y));
                    missiles.push(new HomingMissile(this.x + 18, this.y));
                }
            } else {
                // MAX Power: 5-way Heavy Spread + Dual Homing Missiles
                bullets.push(new Bullet(this.x, this.y - 22, 0, -13, true, 2));
                bullets.push(new Bullet(this.x - 10, this.y - 18, -1.2, -12, true));
                bullets.push(new Bullet(this.x + 10, this.y - 18, 1.2, -12, true));
                bullets.push(new Bullet(this.x - 20, this.y - 14, -3.2, -11, true));
                bullets.push(new Bullet(this.x + 20, this.y - 14, 3.2, -11, true));

                if (this.missileTimer <= 0) {
                    this.missileTimer = 16;
                    missiles.push(new HomingMissile(this.x - 22, this.y));
                    missiles.push(new HomingMissile(this.x + 22, this.y));
                }
            }
        }

        useBomb() {
            if (this.bombs <= 0) return;
            this.bombs--;

            window.retroAudio.playBomb();
            triggerShake(14, 30);
            flashTimer = 8;
            this.invulnerableTimer = 120; // 2 seconds safety

            // Clear all enemy bullets into small sparks
            enemyBullets.forEach(b => {
                spawnExplosion(b.x, b.y, 4, ['#FFFFFF', '#FECA57']);
            });
            enemyBullets.length = 0;

            // Bomb shockwave damage to all active enemies
            enemies.forEach(e => {
                e.hp -= 25;
                spawnExplosion(e.x, e.y, 10);
            });

            if (currentBoss && currentBoss.active) {
                currentBoss.takeDamage(40);
            }

            showFloatingText(this.x, this.y - 40, '★ MEGA BOMB! ★', '#00D2D3', 18);
        }

        draw(ctx) {
            // Invulnerability flashing effect
            if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
                return;
            }

            const sprite = window.spriteGen.cache[this.bankState];
            if (sprite) {
                ctx.drawImage(sprite, Math.floor(this.x - sprite.width / 2), Math.floor(this.y - sprite.height / 2));
            }

            // Invulnerability shield aura
            if (this.invulnerableTimer > 0) {
                ctx.strokeStyle = `rgba(0, 210, 211, ${0.4 + Math.sin(Date.now() * 0.02) * 0.3})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 28, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    // --- Bullet Class ---
    class Bullet {
        constructor(x, y, vx, vy, isPlayer = false, damage = 1) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.isPlayer = isPlayer;
            this.damage = damage;
            this.radius = isPlayer ? 4 : 4.5;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
        }

        draw(ctx) {
            if (this.isPlayer) {
                const sprite = window.spriteGen.cache.playerBullet;
                if (sprite) {
                    ctx.drawImage(sprite, Math.floor(this.x - sprite.width / 2), Math.floor(this.y - sprite.height / 2));
                } else {
                    ctx.fillStyle = '#FECA57';
                    ctx.fillRect(this.x - 2, this.y - 6, 4, 12);
                }
            } else {
                const sprite = window.spriteGen.cache.enemyBullet;
                if (sprite) {
                    ctx.drawImage(sprite, Math.floor(this.x - sprite.width / 2), Math.floor(this.y - sprite.height / 2));
                } else {
                    ctx.fillStyle = '#FF5252';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // --- Homing Missile Class ---
    class HomingMissile {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.speed = 7;
            this.angle = -Math.PI / 2; // Pointing upwards
            this.turnSpeed = 0.08;
            this.life = 120;
            this.damage = 3;
        }

        update() {
            this.life--;

            // Find closest enemy or boss
            let target = null;
            let minDist = 9999;

            if (currentBoss && currentBoss.active) {
                target = currentBoss;
            } else {
                for (const enemy of enemies) {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = enemy;
                    }
                }
            }

            if (target) {
                const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
                let diff = targetAngle - this.angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed);
            }

            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;

            // Smoke trail
            if (Math.random() > 0.4) spawnSmoke(this.x, this.y);
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle + Math.PI / 2);
            const sprite = window.spriteGen.cache.missile;
            if (sprite) {
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            }
            ctx.restore();
        }
    }

    // --- Drop Items Class ([P], [B], [Medal]) ---
    class Item {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'power', 'bomb', 'medal'
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = 1.6;
            this.radius = 12;
            this.timer = 0;
        }

        update() {
            this.timer++;
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off left/right edges
            if (this.x < 15 || this.x > W - 15) {
                this.vx *= -1;
            }
        }

        draw(ctx) {
            let sprite = null;
            if (this.type === 'power') sprite = window.spriteGen.cache.itemPower;
            else if (this.type === 'bomb') sprite = window.spriteGen.cache.itemBomb;
            else sprite = window.spriteGen.cache.itemMedal;

            if (sprite) {
                // Subtle hovering scale bounce
                const scale = 1 + Math.sin(this.timer * 0.1) * 0.08;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.scale(scale, scale);
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
                ctx.restore();
            }
        }
    }

    // --- Enemy Base & Subtypes ---
    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'scout', 'interceptor', 'bomber'
            this.timer = 0;

            if (type === 'scout') {
                this.hp = 2;
                this.maxHp = 2;
                this.scoreVal = 200;
                this.radius = 16;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = 2.4;
                this.shootInterval = 70;
            } else if (type === 'interceptor') {
                this.hp = 5;
                this.maxHp = 5;
                this.scoreVal = 500;
                this.radius = 18;
                this.vx = 0;
                this.vy = 3.2;
                this.shootInterval = 50;
            } else { // bomber
                this.hp = 20;
                this.maxHp = 20;
                this.scoreVal = 1500;
                this.radius = 32;
                this.vx = (Math.random() > 0.5 ? 1 : -1) * 0.8;
                this.vy = 1.0;
                this.shootInterval = 45;
            }
        }

        update() {
            this.timer++;

            if (this.type === 'scout') {
                this.x += Math.sin(this.timer * 0.05) * 2.2 + this.vx;
                this.y += this.vy;
                if (this.timer % this.shootInterval === 0 && this.y < H - 120) {
                    this.fireAtPlayer(3.8);
                }
            } else if (this.type === 'interceptor') {
                // Swoop down, brake, fire burst, then boost away
                if (this.timer < 50) {
                    this.y += this.vy;
                } else if (this.timer >= 50 && this.timer < 90) {
                    this.y += 0.5;
                    if (this.timer === 65) {
                        this.fireSpread(3);
                    }
                } else {
                    this.y += 4.5;
                }
            } else if (this.type === 'bomber') {
                this.x += this.vx;
                if (this.x < 50 || this.x > W - 50) this.vx *= -1;
                this.y += this.vy;
                if (this.timer % this.shootInterval === 0 && this.y < H - 100) {
                    this.fireRing();
                }
            }
        }

        fireAtPlayer(speed = 3.5) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            enemyBullets.push(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed));
            window.retroAudio.playEnemyShoot();
        }

        fireSpread(count = 3) {
            const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
            const spread = 0.3;
            for (let i = 0; i < count; i++) {
                const angle = baseAngle + (i - (count - 1) / 2) * spread;
                enemyBullets.push(new Bullet(this.x, this.y, Math.cos(angle) * 3.5, Math.sin(angle) * 3.5));
            }
            window.retroAudio.playEnemyShoot();
        }

        fireRing() {
            const count = 8;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + (this.timer * 0.05);
                enemyBullets.push(new Bullet(this.x, this.y, Math.cos(angle) * 2.6, Math.sin(angle) * 2.6));
            }
            window.retroAudio.playEnemyShoot();
        }

        draw(ctx) {
            let sprite = null;
            if (this.type === 'scout') sprite = window.spriteGen.cache.enemyScout;
            else if (this.type === 'interceptor') sprite = window.spriteGen.cache.enemyInterceptor;
            else sprite = window.spriteGen.cache.enemyBomber;

            if (sprite) {
                ctx.drawImage(sprite, Math.floor(this.x - sprite.width / 2), Math.floor(this.y - sprite.height / 2));
            }

            // Small health bar for tough bombers
            if (this.type === 'bomber' && this.hp < this.maxHp) {
                const barW = 40;
                const pct = Math.max(0, this.hp / this.maxHp);
                ctx.fillStyle = '#222F3E';
                ctx.fillRect(this.x - barW / 2, this.y - 36, barW, 4);
                ctx.fillStyle = '#EE5253';
                ctx.fillRect(this.x - barW / 2, this.y - 36, barW * pct, 4);
            }
        }
    }

    // --- Boss Class: "VULCAN TITAN" ---
    class Boss {
        constructor() {
            this.x = W / 2;
            this.y = -120;
            this.targetY = 120;
            this.hp = 180;
            this.maxHp = 180;
            this.active = false;
            this.entering = true;
            this.timer = 0;
            this.radius = 65;
            this.phase = 1;
            this.turretAngle = 0;
        }

        takeDamage(dmg) {
            this.hp -= dmg;
            window.retroAudio.playHit();
            if (this.hp <= 0 && this.active) {
                this.hp = 0;
                this.active = false;
                onBossDefeated();
            }
        }

        update() {
            this.timer++;

            if (this.entering) {
                this.y += 1.5;
                if (this.y >= this.targetY) {
                    this.y = this.targetY;
                    this.entering = false;
                    this.active = true;
                }
                return;
            }

            // Sway gently left and right
            this.x = W / 2 + Math.sin(this.timer * 0.02) * 110;

            // Phase based on health
            if (this.hp < this.maxHp * 0.35) {
                this.phase = 3; // Enraged final phase
            } else if (this.hp < this.maxHp * 0.7) {
                this.phase = 2;
            }

            // Attack patterns
            if (this.phase === 1) {
                // Alternating twin cannons
                if (this.timer % 30 === 0) {
                    this.fireAimed(this.x - 45, this.y + 20, 3.5);
                    this.fireAimed(this.x + 45, this.y + 20, 3.5);
                }
            } else if (this.phase === 2) {
                // Twin cannons + Rotating spiral rings
                if (this.timer % 24 === 0) {
                    this.fireAimed(this.x - 45, this.y + 20, 3.8);
                    this.fireAimed(this.x + 45, this.y + 20, 3.8);
                }
                if (this.timer % 40 === 0) {
                    for (let i = 0; i < 10; i++) {
                        const angle = (Math.PI * 2 / 10) * i + this.turretAngle;
                        enemyBullets.push(new Bullet(this.x, this.y + 15, Math.cos(angle) * 2.8, Math.sin(angle) * 2.8));
                    }
                    this.turretAngle += 0.25;
                    window.retroAudio.playEnemyShoot();
                }
            } else {
                // Enraged: Rapid bullet hell + smoke billowing
                if (Math.random() > 0.4) spawnSmoke(this.x + (Math.random() - 0.5) * 80, this.y + 20);

                if (this.timer % 15 === 0) {
                    this.fireSpread(this.x, this.y + 25, 5, 4.2);
                }
                if (this.timer % 35 === 0) {
                    for (let i = 0; i < 12; i++) {
                        const angle = (Math.PI * 2 / 12) * i + (this.timer * 0.08);
                        enemyBullets.push(new Bullet(this.x, this.y + 20, Math.cos(angle) * 3.2, Math.sin(angle) * 3.2));
                    }
                    window.retroAudio.playEnemyShoot();
                }
            }
        }

        fireAimed(ox, oy, speed) {
            const angle = Math.atan2(player.y - oy, player.x - ox);
            enemyBullets.push(new Bullet(ox, oy, Math.cos(angle) * speed, Math.sin(angle) * speed));
            window.retroAudio.playEnemyShoot();
        }

        fireSpread(ox, oy, count, speed) {
            const baseAngle = Math.atan2(player.y - oy, player.x - ox);
            const spread = 0.22;
            for (let i = 0; i < count; i++) {
                const angle = baseAngle + (i - (count - 1) / 2) * spread;
                enemyBullets.push(new Bullet(ox, oy, Math.cos(angle) * speed, Math.sin(angle) * speed));
            }
            window.retroAudio.playEnemyShoot();
        }

        draw(ctx) {
            const sprite = window.spriteGen.cache.boss;
            if (sprite) {
                ctx.drawImage(sprite, Math.floor(this.x - sprite.width / 2), Math.floor(this.y - sprite.height / 2));
            }

            // Boss Health Bar at top of screen
            const barW = 320;
            const barH = 10;
            const barX = (W - barW) / 2;
            const barY = 46;
            const pct = Math.max(0, this.hp / this.maxHp);

            ctx.fillStyle = '#222F3E';
            ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
            ctx.fillStyle = this.phase === 3 ? '#EE5253' : (this.phase === 2 ? '#FECA57' : '#00D2D3');
            ctx.fillRect(barX, barY, barW * pct, barH);

            // Boss Name Text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS: FLYING FORTRESS "VULCAN TITAN"', W / 2, barY - 6);
        }
    }

    // --- Global Entities Lists ---
    let background = new Background();
    let player = new Player();
    let bullets = [];
    let enemyBullets = [];
    let missiles = [];
    let items = [];
    let enemies = [];
    let currentBoss = null;

    // --- Spawner Logic ---
    let waveTimer = 0;
    let bossSpawned = false;

    function handleEnemySpawning() {
        if (bossSpawned) return;

        waveTimer++;

        // At 1400 frames (~25-30 seconds of high-action), initiate Boss Encounter
        if (waveTimer >= 1400) {
            startBossEncounter();
            return;
        }

        // Periodic Formation Spawns
        if (waveTimer % 75 === 0) {
            // Scout group (V-formation or line)
            const startX = Math.random() * (W - 140) + 70;
            const formationCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < formationCount; i++) {
                setTimeout(() => {
                    if (gameState === STATE_PLAYING && !bossSpawned) {
                        enemies.push(new Enemy(startX + (i % 2 === 0 ? i * 20 : -i * 20), -20 - i * 15, 'scout'));
                    }
                }, i * 200);
            }
        }

        if (waveTimer % 180 === 0 && waveTimer > 150) {
            // Fast Interceptor sweep
            enemies.push(new Enemy(Math.random() * (W - 80) + 40, -30, 'interceptor'));
        }

        if (waveTimer % 350 === 0 && waveTimer > 250) {
            // Heavy Bomber
            enemies.push(new Enemy(Math.random() * (W - 120) + 60, -40, 'bomber'));
        }
    }

    function startBossEncounter() {
        bossSpawned = true;
        gameState = STATE_BOSSWARNING;
        warningTimer = 180; // 3 seconds flashing warning
        window.retroAudio.playBossWarning();
    }

    function onBossDefeated() {
        triggerShake(20, 60);
        window.retroAudio.playExplosion(true);
        addScore(15000);
        showFloatingText(W / 2, H / 2, 'MISSION CLEAR!! +15,000', '#FECA57', 16);

        // Chain of giant explosions
        for (let i = 0; i < 16; i++) {
            setTimeout(() => {
                spawnExplosion(
                    currentBoss.x + (Math.random() - 0.5) * 120,
                    currentBoss.y + (Math.random() - 0.5) * 80,
                    24,
                    ['#FECA57', '#FF9F43', '#EE5253', '#FFFFFF']
                );
                window.retroAudio.playExplosion(i % 2 === 0);
            }, i * 140);
        }

        // Clear enemy bullets
        enemyBullets.length = 0;

        setTimeout(() => {
            gameState = STATE_VICTORY;
        }, 2800);
    }

    // --- Scoring & Drops ---
    function addScore(pts) {
        score += pts;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('aerostrike_hiscore', highScore.toString());
        }
    }

    function handleEnemyKilled(enemy) {
        window.retroAudio.playExplosion(enemy.type === 'bomber');
        triggerShake(enemy.type === 'bomber' ? 8 : 4, 10);
        spawnExplosion(enemy.x, enemy.y, enemy.type === 'bomber' ? 24 : 14);
        addScore(enemy.scoreVal);
        showFloatingText(enemy.x, enemy.y, `+${enemy.scoreVal}`, '#FECA57', 12);

        // Chance to drop power-up or items
        const roll = Math.random();
        if (roll < 0.18) {
            items.push(new Item(enemy.x, enemy.y, 'power'));
        } else if (roll < 0.26) {
            items.push(new Item(enemy.x, enemy.y, 'bomb'));
        } else if (roll < 0.40) {
            items.push(new Item(enemy.x, enemy.y, 'medal'));
        }
    }

    function handlePlayerHit() {
        if (player.invulnerableTimer > 0) return;

        window.retroAudio.playExplosion(true);
        triggerShake(12, 25);
        spawnExplosion(player.x, player.y, 25);
        player.lives--;

        // Drop player power level slightly upon losing a life
        if (player.power > 1) player.power--;

        if (player.lives < 0) {
            gameState = STATE_GAMEOVER;
            window.retroAudio.stopBGM();
        } else {
            player.resetPosition();
        }
    }

    // --- Game Reset ---
    function startGame() {
        window.retroAudio.init();
        window.retroAudio.startBGM();

        score = 0;
        stageTimer = 0;
        waveTimer = 0;
        bossSpawned = false;
        currentBoss = null;

        bullets.length = 0;
        enemyBullets.length = 0;
        missiles.length = 0;
        enemies.length = 0;
        items.length = 0;
        particles.length = 0;
        floatingTexts.length = 0;

        player = new Player();
        gameState = STATE_PLAYING;
    }

    // --- Main Game Loop ---
    function update() {
        if (paused) return;

        // Screen Shake decay
        if (shakeTimer > 0) shakeTimer--;
        if (flashTimer > 0) flashTimer--;

        background.update();

        // Title Screen Update
        if (gameState === STATE_TITLE) {
            return;
        }

        // Floating Texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y -= 0.8;
            ft.life--;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }

        if (gameState === STATE_GAMEOVER || gameState === STATE_VICTORY) {
            return;
        }

        // Boss Warning Screen
        if (gameState === STATE_BOSSWARNING) {
            warningTimer--;
            player.update();
            if (warningTimer <= 0) {
                gameState = STATE_PLAYING;
                currentBoss = new Boss();
            }
            return;
        }

        stageTimer++;
        player.update();
        handleEnemySpawning();

        if (currentBoss) {
            currentBoss.update();
        }

        // Update Items & Pickups
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            item.update();

            // Check collision with player
            const dist = Math.hypot(item.x - player.x, item.y - player.y);
            if (dist < item.radius + player.hitRadius + 14) {
                window.retroAudio.playPowerUp();
                if (item.type === 'power') {
                    if (player.power < 4) {
                        player.power++;
                        showFloatingText(player.x, player.y - 30, 'POWER UP!', '#FECA57', 15);
                    } else {
                        addScore(2000);
                        showFloatingText(player.x, player.y - 30, 'MAX BONUS! +2000', '#00D2D3', 15);
                    }
                } else if (item.type === 'bomb') {
                    player.bombs++;
                    showFloatingText(player.x, player.y - 30, 'BOMB +1', '#00D2D3', 15);
                } else {
                    addScore(1000);
                    showFloatingText(player.x, player.y - 30, '+1,000', '#F6E58D', 14);
                }
                items.splice(i, 1);
                continue;
            }

            if (item.y > H + 30) {
                items.splice(i, 1);
            }
        }

        // Update Player Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.update();

            // Hit enemy?
            let hit = false;
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
                    e.hp -= b.damage;
                    window.retroAudio.playHit();
                    spawnExplosion(b.x, b.y, 4, ['#FFFFFF', '#FECA57']);
                    if (e.hp <= 0) {
                        handleEnemyKilled(e);
                        enemies.splice(j, 1);
                    }
                    hit = true;
                    break;
                }
            }

            // Hit Boss?
            if (!hit && currentBoss && currentBoss.active) {
                if (Math.hypot(b.x - currentBoss.x, b.y - currentBoss.y) < currentBoss.radius + b.radius) {
                    currentBoss.takeDamage(b.damage);
                    spawnExplosion(b.x, b.y, 4, ['#FFFFFF', '#FECA57']);
                    hit = true;
                }
            }

            if (hit || b.y < -20 || b.x < -20 || b.x > W + 20) {
                bullets.splice(i, 1);
            }
        }

        // Update Homing Missiles
        for (let i = missiles.length - 1; i >= 0; i--) {
            const m = missiles[i];
            m.update();

            let hit = false;
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (Math.hypot(m.x - e.x, m.y - e.y) < e.radius + 10) {
                    e.hp -= m.damage;
                    window.retroAudio.playHit();
                    spawnExplosion(m.x, m.y, 8);
                    if (e.hp <= 0) {
                        handleEnemyKilled(e);
                        enemies.splice(j, 1);
                    }
                    hit = true;
                    break;
                }
            }

            if (!hit && currentBoss && currentBoss.active) {
                if (Math.hypot(m.x - currentBoss.x, m.y - currentBoss.y) < currentBoss.radius + 10) {
                    currentBoss.takeDamage(m.damage);
                    spawnExplosion(m.x, m.y, 8);
                    hit = true;
                }
            }

            if (hit || m.life <= 0 || m.x < -20 || m.x > W + 20 || m.y < -20 || m.y > H + 20) {
                missiles.splice(i, 1);
            }
        }

        // Update Enemy Bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            eb.update();

            // Hit player?
            if (player.invulnerableTimer <= 0) {
                if (Math.hypot(eb.x - player.x, eb.y - player.y) < eb.radius + player.hitRadius) {
                    handlePlayerHit();
                    enemyBullets.splice(i, 1);
                    continue;
                }
            }

            if (eb.y > H + 20 || eb.y < -20 || eb.x < -20 || eb.x > W + 20) {
                enemyBullets.splice(i, 1);
            }
        }

        // Update Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            e.update();

            // Collision with player plane?
            if (player.invulnerableTimer <= 0) {
                if (Math.hypot(e.x - player.x, e.y - player.y) < e.radius + player.hitRadius) {
                    handlePlayerHit();
                    e.hp -= 5;
                    if (e.hp <= 0) {
                        handleEnemyKilled(e);
                        enemies.splice(i, 1);
                        continue;
                    }
                }
            }

            if (e.y > H + 50) {
                enemies.splice(i, 1);
            }
        }
    }

    // --- Render Loop ---
    function render() {
        ctx.save();

        // Screen Shake Offset
        if (shakeTimer > 0) {
            const rx = (Math.random() - 0.5) * shakeIntensity;
            const ry = (Math.random() - 0.5) * shakeIntensity;
            ctx.translate(rx, ry);
        }

        // Background
        background.draw(ctx);

        // Entities
        items.forEach(item => item.draw(ctx));
        enemies.forEach(e => e.draw(ctx));
        if (currentBoss) currentBoss.draw(ctx);
        missiles.forEach(m => m.draw(ctx));
        bullets.forEach(b => b.draw(ctx));
        enemyBullets.forEach(eb => eb.draw(ctx));

        if (gameState === STATE_PLAYING || gameState === STATE_BOSSWARNING) {
            player.draw(ctx);
        }

        // Particles
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // Floating texts
        floatingTexts.forEach(ft => {
            ctx.fillStyle = ft.color;
            ctx.font = `${ft.size}px "Press Start 2P", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        });

        // Bomb Flash Overlay
        if (flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashTimer / 8})`;
            ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();

        // Top & Bottom Arcade HUD
        renderHUD();

        // Screen State Overlays
        if (gameState === STATE_TITLE) {
            renderTitleScreen();
        } else if (gameState === STATE_BOSSWARNING) {
            renderBossWarningScreen();
        } else if (gameState === STATE_GAMEOVER) {
            renderGameOverScreen();
        } else if (gameState === STATE_VICTORY) {
            renderVictoryScreen();
        }

        if (paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#FECA57';
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', W / 2, H / 2);
        }
    }

    // --- HUD Renderer ---
    function renderHUD() {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px "Press Start 2P", monospace';

        // 1UP & Score
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FF5252';
        ctx.fillText('1UP', 18, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(score.toString().padStart(6, '0'), 55, 22);

        // HI-SCORE
        ctx.textAlign = 'right';
        ctx.fillStyle = '#00D2D3';
        ctx.fillText('HIGH', W - 110, 22);
        ctx.fillStyle = '#FECA57';
        ctx.fillText(highScore.toString().padStart(6, '0'), W - 18, 22);

        // Bottom Bar: Lives, Bombs, Power
        const hudY = H - 16;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FECA57';
        ctx.fillText('LIVES:', 18, hudY);

        // Draw Player mini icons for lives
        for (let i = 0; i < player.lives; i++) {
            ctx.fillStyle = '#00D2D3';
            ctx.fillRect(80 + i * 16, hudY - 10, 10, 10);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(83 + i * 16, hudY - 7, 4, 4);
        }

        // Bombs
        ctx.fillStyle = '#FECA57';
        ctx.fillText('BOMB:', 160, hudY);
        for (let i = 0; i < player.bombs; i++) {
            ctx.fillStyle = '#FF9F43';
            ctx.beginPath();
            ctx.arc(225 + i * 15, hudY - 5, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Power gauge
        ctx.fillStyle = '#FECA57';
        ctx.fillText(`PWR: ${player.power === 4 ? 'MAX' : 'LV.' + player.power}`, W - 120, hudY);
    }

    // --- State Screens ---
    function renderTitleScreen() {
        ctx.fillStyle = 'rgba(10, 20, 40, 0.75)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';

        // Title Logo
        ctx.fillStyle = '#FECA57';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.fillText('AERO STRIKE', W / 2, 170);

        ctx.fillStyle = '#FF5252';
        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillText('1 9 9 5', W / 2, 205);

        ctx.fillStyle = '#C8D6E5';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('AUTHENTIC 90S ARCADE SHOOTING', W / 2, 235);

        // Blinking "PRESS SPACE"
        if (Math.floor(Date.now() / 450) % 2 === 0) {
            ctx.fillStyle = '#00D2D3';
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.fillText('PRESS SPACE TO START', W / 2, 330);
        }

        // Instructions Box
        ctx.fillStyle = '#222F3E';
        ctx.fillRect(40, 390, W - 80, 160);
        ctx.strokeStyle = '#FECA57';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 390, W - 80, 160);

        ctx.fillStyle = '#FECA57';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('== CONTROLS ==', W / 2, 420);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('MOVE       : ARROW KEYS / WASD', W / 2, 450);
        ctx.fillText('AUTO-FIRE  : SPACE / Z', W / 2, 475);
        ctx.fillText('MEGA BOMB  : X (CLEARS BULLETS)', W / 2, 500);
        ctx.fillText('MUTE/SOUND : M    PAUSE: P', W / 2, 525);

        // Credits
        ctx.fillStyle = '#8395A7';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('CREDIT 01  INSERT COIN', W / 2, 595);
    }

    function renderBossWarningScreen() {
        const blink = Math.floor(warningTimer / 10) % 2 === 0;
        if (blink) {
            ctx.fillStyle = 'rgba(238, 82, 83, 0.35)';
            ctx.fillRect(0, 0, W, H);
        }

        ctx.fillStyle = '#FF5252';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('! !  W A R N I N G  ! !', W / 2, H / 2 - 25);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('A HUGE BATTLESHIP IS APPROACHING', W / 2, H / 2 + 10);
        ctx.fillText('RAPIDLY!', W / 2, H / 2 + 30);
    }

    function renderGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#EE5253';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', W / 2, 240);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, W / 2, 300);
        ctx.fillText(`HI-SCORE   : ${highScore}`, W / 2, 330);

        if (Math.floor(Date.now() / 450) % 2 === 0) {
            ctx.fillStyle = '#00D2D3';
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillText('PRESS SPACE TO REPLAY', W / 2, 420);
        }
    }

    function renderVictoryScreen() {
        ctx.fillStyle = 'rgba(10, 30, 60, 0.85)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FECA57';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillText('MISSION COMPLETE!', W / 2, 220);

        ctx.fillStyle = '#00D2D3';
        ctx.font = '13px "Press Start 2P", monospace';
        ctx.fillText('ENEMY FLEET DESTROYED', W / 2, 260);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, W / 2, 320);
        ctx.fillText(`HI-SCORE   : ${highScore}`, W / 2, 350);

        if (Math.floor(Date.now() / 450) % 2 === 0) {
            ctx.fillStyle = '#FF9F43';
            ctx.font = '13px "Press Start 2P", monospace';
            ctx.fillText('PRESS SPACE TO RESTART', W / 2, 440);
        }
    }

    // --- Mobile Virtual Touch Controls ---
    function setupTouchControls() {
        const touchArea = document.getElementById('touchControls');
        if (!touchArea) return;

        const btnLeft = document.getElementById('touchLeft');
        const btnRight = document.getElementById('touchRight');
        const btnUp = document.getElementById('touchUp');
        const btnDown = document.getElementById('touchDown');
        const btnFire = document.getElementById('touchFire');
        const btnBomb = document.getElementById('touchBomb');

        const bindTouch = (elem, code) => {
            if (!elem) return;
            const start = (e) => {
                e.preventDefault();
                keys[code] = true;
                window.retroAudio.init();
                if (gameState === STATE_TITLE || gameState === STATE_GAMEOVER || gameState === STATE_VICTORY) {
                    startGame();
                }
            };
            const end = (e) => {
                e.preventDefault();
                keys[code] = false;
            };
            elem.addEventListener('touchstart', start, { passive: false });
            elem.addEventListener('touchend', end, { passive: false });
            elem.addEventListener('mousedown', start);
            elem.addEventListener('mouseup', end);
        };

        bindTouch(btnLeft, 'ArrowLeft');
        bindTouch(btnRight, 'ArrowRight');
        bindTouch(btnUp, 'ArrowUp');
        bindTouch(btnDown, 'ArrowDown');
        bindTouch(btnFire, 'Space');
        bindTouch(btnBomb, 'KeyX');
    }

    // --- Initialization ---
    window.addEventListener('load', () => {
        window.spriteGen.init();
        setupTouchControls();

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }
        requestAnimationFrame(gameLoop);
    });

})();
