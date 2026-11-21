// 1990s Arcade Pixel Art Generator
// Renders procedural authentic pixel art to offscreen canvases for blazing-fast 60FPS blitting

class SpriteGenerator {
    constructor() {
        this.cache = {};
        this.palette = {
            // Player colors
            '.': null, // Transparent
            'W': '#FFFFFF', // Pure White
            'G': '#C8D6E5', // Light Silver Gray
            'M': '#8395A7', // Medium Gray
            'D': '#576574', // Dark Steel Gray
            'K': '#222F3E', // Charcoal / Black outline
            'C': '#00D2D3', // Cockpit Bright Cyan
            'B': '#0ABDE3', // Blue
            'N': '#10AC84', // Dark Cyan / Camo
            'Y': '#FECA57', // Flame Yellow
            'O': '#FF9F43', // Engine Orange
            'R': '#EE5253', // Red accent
            
            // Enemy Scout (Military Green)
            'e': '#1DD1A1', // Light green
            'g': '#10AC84', // Olive/Jungle green
            'd': '#218C74', // Dark camo green
            'k': '#1B262C', // Shadow/outline
            'y': '#F6E58D', // Yellow wing marks
            
            // Enemy Interceptor (Crimson Fighter)
            'r': '#FF6B6B', // Bright Crimson
            'R': '#EE5253', // Dark Red
            'm': '#800000', // Deep Maroon
            'w': '#FFFFFF',
            'c': '#48DBFB',
            
            // Heavy Bomber (Steel Slate)
            'H': '#718093', // Steel Gray
            'h': '#2F3640', // Dark Armor
            't': '#00A8FF', // Engine glow
            'p': '#E1B12C', // Propeller/trim
            
            // Items
            '1': '#F5CD79', // Gold light
            '2': '#E15F41', // Red badge
            '3': '#3DC1D3', // Blue badge
            '4': '#EA2027', // Bright red
            '5': '#F79F1F', // Bright gold
        };
    }

    createFromAscii(lines, paletteMap, scale = 2) {
        const height = lines.length;
        const width = lines[0].length;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < height; y++) {
            const line = lines[y];
            for (let x = 0; x < width; x++) {
                const char = line[x];
                if (char !== '.' && (paletteMap[char] || this.palette[char])) {
                    ctx.fillStyle = paletteMap[char] || this.palette[char];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        return canvas;
    }

    init() {
        // 1. Player Fighter Jet (Normal, Bank Left, Bank Right) - 24x26
        const playerNormal = [
            "...........KK...........",
            "...........WW...........",
            "..........WGGW..........",
            "..........WGGW..........",
            "..........WCCW..........",
            "..........WCCW..........",
            ".........WMMMMW.........",
            ".........WMMMMW.........",
            "........WDDDDDDW........",
            "........WDDDDDDW........",
            ".......KKWDDDDWKK.......",
            "......WMMWDDDDWMMW......",
            ".....WMMMWDDDDWMMMW.....",
            "....WMMMMWDDDDWMMMMW....",
            "...WMMMMMWDDDDWMMMMMW...",
            "..WDDDDDDWDDDDWDDDDDDW..",
            ".WDDDDDDDWKKKKWDDDDDDDW.",
            "WDDDDDDDDWK..KDDDDDDDDDW",
            "KKKKWWDDDW....WDDDDKKKKK",
            "....WWDDDW....WDDDDW....",
            "....WWDDDW....WDDDDW....",
            ".....WWKKW....WKKWW.....",
            ".......KKK....KKK.......",
            ".......WYYW..WYYW.......",
            "........WO....OW........",
            ".........O....O........."
        ];

        const playerLeft = [
            "..........KK............",
            "..........WW............",
            ".........WGGW...........",
            ".........WGGW...........",
            ".........WCCW...........",
            ".........WCCW...........",
            "........WMMMW...........",
            "........WMMMMW..........",
            ".......WDDDDDDW.........",
            ".......WDDDDDDW.........",
            "......KKWDDDDWKK........",
            ".....WMMWDDDDWMMW.......",
            "....WMMMWDDDDWMMMW......",
            "...WMMMMWDDDDWMMMMW.....",
            "..WMMMMMWDDDDWMMMMMW....",
            ".WDDDDDDWDDDDWDDDDDDW...",
            "WDDDDDDDWKKKKWDDDDDDW...",
            "KKKKWWDDDWK..KWDDDDDKKK.",
            "...WWDDDDW....WDDDDW....",
            "...WWDDDDW....WDDDDW....",
            "....WWKKW......WKKWW....",
            "......KKK......KKK......",
            "......WYYW....WYYW......",
            ".......WO......OW.......",
            "........O......O........",
            "........................"
        ];

        const playerRight = [
            "............KK..........",
            "............WW..........",
            "...........WGGW.........",
            "...........WGGW.........",
            "...........WCCW.........",
            "...........WCCW.........",
            "...........WMMMW........",
            "..........WMMMMW........",
            ".........WDDDDDDW.......",
            ".........WDDDDDDW.......",
            "........KKWDDDDWKK......",
            ".......WMMWDDDDWMMW.....",
            "......WMMMWDDDDWMMMW....",
            ".....WMMMMWDDDDWMMMMW...",
            "....WMMMMMWDDDDWMMMMMW..",
            "...WDDDDDDWDDDDWDDDDDDW.",
            "...WDDDDDDWKKKKWDDDDDDDW",
            ".KKKDDDDDWK..KWDDDWWKKKK",
            "....WDDDDW....WDDDDWW...",
            "....WDDDDW....WDDDDWW...",
            "....WWKKW......WKKWW....",
            "......KKK......KKK......",
            "......WYYW....WYYW......",
            ".......WO......OW.......",
            "........O......O........",
            "........................"
        ];

        this.cache.player = this.createFromAscii(playerNormal, this.palette, 2);
        this.cache.playerLeft = this.createFromAscii(playerLeft, this.palette, 2);
        this.cache.playerRight = this.createFromAscii(playerRight, this.palette, 2);

        // 2. Enemy Scout (Biplane / Agile fighter) - 16x16
        const scout = [
            ".......kk.......",
            "......kggk......",
            "......kggk......",
            ".....kgccgk.....",
            "..k..kgddgk..k..",
            ".keekgddddkgeek.",
            "keeeegddddgeeeek",
            "kyyyegddddgeyyyk",
            "kddddgddddgddddk",
            "..kkkgddddgkkk..",
            "....kddddddk....",
            "....kgddddgk....",
            ".....kddddk.....",
            "....keeggddk....",
            "....kddddddk....",
            ".....kk..kk....."
        ];
        this.cache.enemyScout = this.createFromAscii(scout, this.palette, 2);

        // 3. Enemy Interceptor (Crimson Delta) - 18x18
        const interceptor = [
            "........kk........",
            ".......krrk.......",
            ".......krrk.......",
            "......krccrk......",
            "......krccrk......",
            ".....kRRRRRRk.....",
            "....kRRRRRRRRk....",
            "...kRRmRRRRmRRk...",
            "..kRkRmRRRRmRkRk..",
            ".kRk.RmRRRRmR.kRk.",
            "kRk..RmRRRRmR..kRk",
            "kk...kRRRRRRk...kk",
            ".....kRWWWWk......",
            ".....kRRRRRRk.....",
            "....kRRk..kRRk....",
            "....kRk....kRk....",
            "....kYk....kYk....",
            ".....k......k....."
        ];
        this.cache.enemyInterceptor = this.createFromAscii(interceptor, this.palette, 2);

        // 4. Enemy Medium Bomber / Heavy Gunship - 32x26
        const bomber = [
            "...............hhhh...............",
            "..............hHHHHh..............",
            "..............hHttHh..............",
            ".............hHHHHHHh.............",
            ".............hHHccHHh.............",
            ".............hHHccHHh.............",
            "......hhhh...hHHHHHHh...hhhh......",
            ".....hpppph.hHHHHHHHHh.hpppph.....",
            "....hpHHHHphhHHHHHHHHhhpHHHHph....",
            "...hpHHHHHHphHHHHHHHHhpHHHHHHph...",
            "..hpHHHHHHHHhHHHHHHHHhHHHHHHHHph..",
            ".hHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHh.",
            "hHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHh",
            "hHHHhhhhhHHHHHhhhhhhHHHHHhhhhhHHHh",
            "hHHh.....hHHHHh....hHHHHh.....hHHh",
            "hHh.......hHHHh....hHHHh.......hHh",
            "hh.........hHHh....hHHh.........hh",
            "............hHh....hHh............",
            "............hHHhhhhHHh............",
            "............hHHHHHHHHh............",
            "............hHHHHHHHHh............",
            "...........hHHHHHHHHHHh...........",
            "..........hHHHHHHHHHHHHh..........",
            ".........hHHHHHH..HHHHHHh.........",
            "..........hhhhhh..hhhhhh..........",
            "...........hOO......OOh..........."
        ];
        this.cache.enemyBomber = this.createFromAscii(bomber, this.palette, 2);

        // 5. Boss "VULCAN TITAN" - 48x36 (Gigantic Fortress)
        const boss = [
            "....................hhhhhhhh....................",
            "...................hDDDDDDDDh...................",
            "..................hDDDDDDDDDDh..................",
            ".................hDDDDDRRDDDDDh.................",
            ".................hDDDDDYYDDDDDh.................",
            "................hDDDDDDYYDDDDDDh................",
            "......hhhh.....hDDDDDDDDDDDDDDDDh.....hhhh......",
            ".....hRRRRh...hDDDDDDDDDDDDDDDDDDh...hRRRRh.....",
            "....hRDDDDRhhhDDDDDDDDDDDDDDDDDDDDhhhRDDDDRh....",
            "...hRDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDRh...",
            "..hRDDDDDDDDDDDDDDDRRRRRRRRDDDDDDDDDDDDDDDDDRh..",
            ".hRDDDDDDDDDDDDDDDDRYYYYYYRDDDDDDDDDDDDDDDDDDRh.",
            "hRDDDDhhhhDDDDDDDDDRYCCCCYRDDDDDDDDDhkhhDDDDDDRh",
            "hRDDDhCCCCkDDDDDDDDRYCCCCYRDDDDDDDDkCCCCkDDDDDRh",
            "hRDDDhCCCCkDDDDDDDDRYYYYYYRDDDDDDDDkCCCCkDDDDDRh",
            "hRDDDDhhhhDDDDDDDDDRRRRRRRRDDDDDDDDDhkhhDDDDDDRh",
            "hRDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDh",
            ".hRDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDRh.",
            "..hRDDDDDDDDDDDDDDDhhhhhhDDDDDDDDDDDDDDDDDDDRh..",
            "...hhhhhDDDDDDDDDDDhhhhhhDDDDDDDDDDDhhhhh.......",
            "........hDDDDDDDDDDDDDDDDDDDDDDDDDDh............",
            "........hDDDDDDDDDDDDDDDDDDDDDDDDDDh............",
            ".........hDDDDhhhhDDDDDDDDhhhhDDDDh.............",
            ".........hDDDhOOOOkhDDDDhkOOOOkhDDh.............",
            "..........hDDhOOOOkhDDDDhkOOOOkhDh..............",
            "...........hhh....hhhhhhh....hhh................",
            "..............hOOOh.....hOOOh...................",
            "...............hOh.......hOh...................."
        ];
        this.cache.boss = this.createFromAscii(boss, this.palette, 2.5);

        // 6. Items: [P] Power Up (12x12)
        const itemP = [
            "444444444444",
            "455555555554",
            "45WWWWWWWW54",
            "45WKKKKKKW54",
            "45WKWWWWKW54",
            "45WKW..WKW54",
            "45WKW..WKW54",
            "45WKWWWWKW54",
            "45WKWKKKKW54",
            "45WKW.....54",
            "455WW.....54",
            "444444444444"
        ];
        this.cache.itemPower = this.createFromAscii(itemP, this.palette, 2);

        // 7. Items: [B] Bomb (12x12)
        const itemB = [
            "333333333333",
            "3WWWWWWWWWW3",
            "3WKKKKKKKKW3",
            "3WKW.....KW3",
            "3WKWWWWW.KW3",
            "3WKW...W.KW3",
            "3WKWWWWW.KW3",
            "3WKW...W.KW3",
            "3WKWWWWW.KW3",
            "3WKW.....KW3",
            "3WKKKKKKKKW3",
            "333333333333"
        ];
        this.cache.itemBomb = this.createFromAscii(itemB, this.palette, 2);

        // 8. Items: Gold Medal (12x12)
        const itemMedal = [
            "....5555....",
            "..55111155..",
            ".511WWWW115.",
            ".51WW11WW15.",
            "51W115511W15",
            "51W155551W15",
            "51W155551W15",
            "51W115511W15",
            ".51WW11WW15.",
            ".511WWWW115.",
            "..55111155..",
            "....5555...."
        ];
        this.cache.itemMedal = this.createFromAscii(itemMedal, this.palette, 2);

        // 9. Bullet Sprites
        this.cache.playerBullet = this.createPlayerBullet();
        this.cache.enemyBullet = this.createEnemyBullet();
        this.cache.missile = this.createMissile();
    }

    createPlayerBullet() {
        const canvas = document.createElement('canvas');
        canvas.width = 6;
        canvas.height = 14;
        const ctx = canvas.getContext('2d');
        // Yellow/white energy bolt
        ctx.fillStyle = '#FECA57';
        ctx.fillRect(1, 0, 4, 14);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(2, 2, 2, 10);
        return canvas;
    }

    createEnemyBullet() {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        // Glowing orange/pink retro orb
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(5, 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(5, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(5, 5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        return canvas;
    }

    createMissile() {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#576574';
        ctx.fillRect(2, 4, 4, 10);
        ctx.fillStyle = '#EE5253';
        ctx.fillRect(2, 0, 4, 4); // Warhead
        ctx.fillStyle = '#FF9F43';
        ctx.fillRect(3, 14, 2, 2); // Flame
        return canvas;
    }
}

window.spriteGen = new SpriteGenerator();
