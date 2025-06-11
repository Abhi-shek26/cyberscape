const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions once CONFIG is loaded
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;
let gameMap;
let player;
let systemHealth;
let shardsDelivered;
let highScore;
let keysPressed = {};
let gameState = 'playing'; 
let lastTime = 0; 
let animationFrameId = null; 

let bots = []; 
let nextBotSpawnTime = 0;

// UI Elements
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const resetButton = document.getElementById('resetButton');

function init() {
    console.log("Main.js: Initializing game...");
    gameMap = new GameMap(canvas.width, canvas.height, CONFIG.TILE_SIZE, CONFIG.GRID_LINE_WIDTH);
    
    if (!gameMap.playerStartTileCoords || 
        !gameMap.grid[gameMap.playerStartTileCoords.r] || 
        !gameMap.grid[gameMap.playerStartTileCoords.r][gameMap.playerStartTileCoords.c]) {
        console.error("FATAL: Player start tile coordinates not properly set or invalid in map! Defaulting to map center.");
        player = new Player(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, gameMap);
    } else {
        const startTile = gameMap.grid[gameMap.playerStartTileCoords.r][gameMap.playerStartTileCoords.c];
        console.log(`Player starting on tile type: ${startTile.type} at R:${gameMap.playerStartTileCoords.r}, C:${gameMap.playerStartTileCoords.c}. Buildings: ${startTile.buildings.length}`);
        if (startTile.buildings && startTile.buildings.length > 0) {
        }
        const startX = startTile.x + CONFIG.TILE_SIZE / 2;
        const startY = startTile.y + CONFIG.TILE_SIZE / 2;
        player = new Player(startX, startY, gameMap);
    }
    
    systemHealth = CONFIG.INITIAL_SYSTEM_HEALTH;
    shardsDelivered = 0;
    highScore = loadHighScore(); 
    keysPressed = {};
    gameState = 'playing';

    bots = []; 
    scheduleNextBotSpawn();

    pauseButton.textContent = 'Pause';
    pauseButton.style.display = 'inline-block';
    resumeButton.style.display = 'none';

    updateUI(player, systemHealth, shardsDelivered, highScore);

    lastTime = performance.now(); 
    if (animationFrameId) { 
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop); 
    console.log("Game initialized and loop started.");
}

function scheduleNextBotSpawn() {
    const interval = getRandomInt(CONFIG.BOT_SPAWN_INTERVAL_MIN, CONFIG.BOT_SPAWN_INTERVAL_MAX);
    nextBotSpawnTime = performance.now() + interval;
}

function isTileOccupiedByBot(r, c) {
    return bots.some(bot => {
        const botTile = gameMap.getTileAt(bot.x, bot.y);
        return botTile && botTile === gameMap.grid[r][c];
    });
}

function trySpawnBot() {
    if (bots.length >= CONFIG.MAX_BOTS_ON_MAP) {
        scheduleNextBotSpawn();
        return; 
    }

    let attempts = 0;
    let validSpawn = false;
    let spawnX, spawnY;

    while (!validSpawn && attempts < 50) {
        attempts++;
        const r = getRandomInt(0, gameMap.rows - 1);
        const c = getRandomInt(0, gameMap.cols - 1);
        const tile = gameMap.grid[r][c];
        const tileSize = gameMap.tileSize || CONFIG.TILE_SIZE;
        const pad = CONFIG.BOT_RADIUS + 6;

        if (isTileOccupiedByBot(r, c)) continue;

        if (tile && (tile.type === 'open' || tile.type === 'player_start_zone') && tile.isWalkable) {
            const candidateSpawns = [
                { x: tile.x + tileSize / 2, y: tile.y + tileSize / 2 },
                { x: tile.x + pad, y: tile.y + pad },
                { x: tile.x + tileSize - pad, y: tile.y + pad },
                { x: tile.x + tileSize - pad, y: tile.y + tileSize - pad },
                { x: tile.x + pad, y: tile.y + tileSize - pad }
            ];

            for (const pos of candidateSpawns) {
                if (player) {
                    const distToPlayer = Math.hypot(pos.x - player.x, pos.y - player.y);
                    if (distToPlayer < CONFIG.TILE_SIZE * 3) continue;
                }
                if (gameMap.isPositionWalkable(pos.x, pos.y, CONFIG.BOT_RADIUS)) {
                    spawnX = pos.x;
                    spawnY = pos.y;
                    validSpawn = true;
                    break;
                }
            }
        }
    }

    if (validSpawn) {
        bots.push(new Bot(spawnX, spawnY, gameMap));
    }
    scheduleNextBotSpawn(); 
}



function handleInput() {
    if (player) {
        player.handleInput(keysPressed);
    }
}

function update(deltaTime) {
    if (gameState !== 'playing' || !player || !gameMap) return;

    player.update(); 
    
    // Update Towers and check projectile collision
    gameMap.towers.forEach((tower) => {
        if (tower.isDestroyed) return;
        tower.update(player, deltaTime); // Tower AI and attacking player
        
        // Check player projectiles against this tower
        for (let i = player.projectiles.length - 1; i >= 0; i--) {
            const projectile = player.projectiles[i];
            if (tower.isDestroyed) break; // No need to check further if tower got destroyed
            const dist = Math.hypot(projectile.x - tower.x, projectile.y - tower.y);
            if (dist < projectile.radius + tower.radius) {
                tower.takeDamage(CONFIG.PROJECTILE_DAMAGE_TO_TOWER || 20); // Use a config value
                player.projectiles.splice(i, 1); // Remove projectile
            }
        }
    });
    
    // Bot Spawning
    if (performance.now() >= nextBotSpawnTime) {
        trySpawnBot();
    }

    // Update Bots and check projectile collision
    for (let i = bots.length - 1; i >= 0; i--) {
        const bot = bots[i];
        bot.update(player, deltaTime, player.projectiles);
        if (bot.isDestroyed) {
            bots.splice(i, 1);
        }
    }

    // Player projectile collision with Bots 
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
        const projectile = player.projectiles[i];
        for (let j = bots.length - 1; j >= 0; j--) {
            const bot = bots[j];
            if (bot.isDestroyed) continue;
            const dist = Math.hypot(projectile.x - bot.x, projectile.y - bot.y);
            if (dist < projectile.radius + bot.radius) {
                bot.takeDamage(CONFIG.PROJECTILE_DAMAGE_TO_BOT || 25); 
                player.projectiles.splice(i, 1); 
                break; // Projectile hits one bot and is consumed
            }
        }
    }

    systemHealth -= CONFIG.SYSTEM_HEALTH_DECAY_RATE * (deltaTime / 1000);
    if (systemHealth < 0) systemHealth = 0;

    const playerTile = gameMap.getTileAt(player.x, player.y);
    if (playerTile && playerTile.type === 'base_station' && player.shardsCarrying > 0) {
        systemHealth += player.shardsCarrying * CONFIG.SYSTEM_HEALTH_RECOVERY_PER_SHARD;
        if (systemHealth > CONFIG.MAX_SYSTEM_HEALTH) systemHealth = CONFIG.MAX_SYSTEM_HEALTH;
        
        shardsDelivered += player.shardsCarrying;
        player.shardsCarrying = 0;
        
        if (shardsDelivered > highScore) {
            highScore = shardsDelivered;
            saveHighScore(highScore);
        }
    }

    updateUI(player, systemHealth, shardsDelivered, highScore);

    if (player.health <= 0 || systemHealth <= 0) {
        gameState = 'gameOver';
        console.log("Game Over! Player Health:", player.health.toFixed(0), "System Health:", systemHealth.toFixed(0));
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'none';
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    if (gameMap) gameMap.draw(ctx); 
    if (gameMap) gameMap.towers.forEach(tower => { if(!tower.isDestroyed) tower.draw(ctx); });
    
    bots.forEach(bot => bot.draw(ctx));
    if (player) player.draw(ctx);   

    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    } else if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`Shards Delivered: ${shardsDelivered}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press Reset to Play Again', canvas.width / 2, canvas.height / 2 + 60);
    }
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime && lastTime) ? (currentTime - lastTime) : (1000 / CONFIG.GAME_FPS);
    lastTime = currentTime;

    if (gameState === 'playing') {
        handleInput();
        update(Math.min(deltaTime, 100)); 
    }
    draw();
    
    if (gameState !== 'paused') { 
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
    }
    keysPressed[e.key.toUpperCase()] = true; 
    keysPressed[e.key] = true; 
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.key.toUpperCase()] = false;
    keysPressed[e.key] = false;
});

pauseButton.addEventListener('click', () => {
    if (gameState === 'playing') {
        gameState = 'paused';
        // No need to explicitly cancelAnimationFrame here if gameLoop checks gameState
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'inline-block';
        console.log("Game paused.");
        draw(); 
    }
});

resumeButton.addEventListener('click', () => {
    if (gameState === 'paused') {
        gameState = 'playing';
        lastTime = performance.now(); 
        animationFrameId = requestAnimationFrame(gameLoop); 
        pauseButton.style.display = 'inline-block';
        resumeButton.style.display = 'none';
        console.log("Game resumed.");
    }
});

resetButton.addEventListener('click', () => {
    console.log("Reset button clicked. Re-initializing game.");
    if (animationFrameId) cancelAnimationFrame(animationFrameId); 
    init(); 
});

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Starting game initialization.");
    initUI();
    init(); 
});
