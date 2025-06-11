class Player {
    constructor(x, y, gameMap) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.PLAYER_RADIUS;
        this.color = CONFIG.PLAYER_COLOR;
        this.speed = CONFIG.PLAYER_SPEED;
        this.health = CONFIG.PLAYER_INITIAL_HEALTH;
        this.keys = 0;
        this.shardsCarrying = 0;
        this.gameMap = gameMap;
        this.projectiles = [];
        this.lastShotTime = 0;
        this.dx = 0;
        this.dy = 0;
    }

    handleInput(keysPressed) {
        this.dx = 0;
        this.dy = 0;
        if (keysPressed['ARROWUP'] || keysPressed['W']) this.dy = -1; 
        if (keysPressed['ARROWDOWN'] || keysPressed['S']) this.dy = 1;
        if (keysPressed['ARROWLEFT'] || keysPressed['A']) this.dx = -1;
        if (keysPressed['ARROWRIGHT'] || keysPressed['D']) this.dx = 1;

        if (this.dx !== 0 && this.dy !== 0) {
            const magnitude = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx = (this.dx / magnitude);
            this.dy = (this.dy / magnitude);
        }
        
        if (keysPressed[' '] || keysPressed['SPACEBAR']) {
            this.shoot();
        }
    }

    update() {
        const intendedDeltaX = this.dx * this.speed;
        const intendedDeltaY = this.dy * this.speed;

        let currentX = this.x;
        let currentY = this.y;

        let targetX = currentX + intendedDeltaX;
        let targetY = currentY + intendedDeltaY;

        targetX = Math.max(this.radius, Math.min(CONFIG.CANVAS_WIDTH - this.radius, targetX));
        targetY = Math.max(this.radius, Math.min(CONFIG.CANVAS_HEIGHT - this.radius, targetY));
        
        if (this.gameMap.isPositionWalkable(targetX, targetY, this.radius)) {
            this.x = targetX;
            this.y = targetY;
        } else {
            let movedX = false;
            if (this.gameMap.isPositionWalkable(targetX, currentY, this.radius)) {
                this.x = targetX;
                movedX = true;
            }
            if (this.gameMap.isPositionWalkable(this.x, targetY, this.radius)) {
                this.y = targetY;
            }
        }

        this.projectiles.forEach((p, index) => {
            p.update();
            if (p.isOffScreen(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT) || p.life <= 0) {
                this.projectiles.splice(index, 1);
            }
        });
        
        for (let i = this.gameMap.keys.length - 1; i >= 0; i--) {
            const key = this.gameMap.keys[i];
            if (!key.collected) {
                const dist = Math.hypot(this.x - key.x, this.y - key.y);
                if (dist < this.radius + key.radius) {
                    key.collected = true;
                    this.keys++;
                    this.gameMap.keys.splice(i, 1); 
                    this.gameMap.spawnKey();
                }
            }
        }

        const playerTile = this.gameMap.getTileAt(this.x, this.y); 
        if (playerTile && playerTile.type === 'central_hub') {
            if (this.keys >= CONFIG.SHARD_DECRYPTION_COST) {
                const shardsPossibleToDecrypt = Math.floor(this.keys / CONFIG.SHARD_DECRYPTION_COST);
                this.shardsCarrying += shardsPossibleToDecrypt;
                this.keys -= shardsPossibleToDecrypt * CONFIG.SHARD_DECRYPTION_COST;
            }
        }
    }
    
    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime > CONFIG.PLAYER_SHOOT_COOLDOWN) {
            let shootDX = this.dx;
            let shootDY = this.dy;
            if (shootDX === 0 && shootDY === 0) { 
                shootDX = 1; 
                shootDY = 0;
            }
            
            const projectile = new Projectile(
                this.x, 
                this.y, 
                shootDX, 
                shootDY, 
                CONFIG.PROJECTILE_SPEED, 
                CONFIG.PROJECTILE_COLOR,
                this.gameMap.getAllBuildingPolygons()
            );
            this.projectiles.push(projectile);
            this.lastShotTime = currentTime;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }

    draw(ctx) {
        this.projectiles.forEach(p => p.draw(ctx));

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Set to true to see the collision points
        const DEBUG_DRAW_COLLISION_POINTS = false; 
        if (DEBUG_DRAW_COLLISION_POINTS && this.radius > 0) {
            ctx.fillStyle = 'red';
            const pointsToCheck = [{px: this.x, py: this.y}];
            const numCheckPoints = 8;
            for (let i = 0; i < numCheckPoints; i++) { 
                const angle = (i / numCheckPoints) * 2 * Math.PI;
                pointsToCheck.push({
                    px: this.x + this.radius * Math.cos(angle),
                    py: this.y + this.radius * Math.sin(angle)
                });
            }
            for (const point of pointsToCheck) {
                ctx.beginPath();
                ctx.arc(point.px, point.py, 2, 0, Math.PI * 2); 
                ctx.fill();
            }
        }
    }
}
