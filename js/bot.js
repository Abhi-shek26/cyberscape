class Bot {
    constructor(x, y, gameMap) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.BOT_RADIUS || 8;
        this.detectionRadius = CONFIG.BOT_DETECTION_RADIUS || 120;
        this.chaseRadius = CONFIG.BOT_CHASE_RADIUS || 180;
        this.speed = CONFIG.BOT_SPEED || 0.8;
        this.health = CONFIG.BOT_HEALTH || 30;
        this.attackDamage = CONFIG.BOT_ATTACK_DAMAGE || 10;
        this.isDestroyed = false;
        this.gameMap = gameMap;
        this.state = 'patrolling';
        this.targetPlayer = null;

        this.patrolPoints = this.generateValidPatrolPoints();
        this.currentPatrolIndex = this.findClosestPatrolPoint();
    }

    // Only generate patrol points that are walkable (not inside a building)
    generateValidPatrolPoints() {
        const points = [];
        const tile = this.gameMap.getTileAt(this.x, this.y);
        const tileSize = this.gameMap.tileSize || CONFIG.TILE_SIZE;
        const pad = this.radius + 6;
        if (tile) {
            const candidatePoints = [
                { x: tile.x + pad, y: tile.y + pad },
                { x: tile.x + tileSize - pad, y: tile.y + pad },
                { x: tile.x + tileSize - pad, y: tile.y + tileSize - pad },
                { x: tile.x + pad, y: tile.y + tileSize - pad }
            ];
            // Only use points that are walkable
            for (const pt of candidatePoints) {
                if (this.gameMap.isPositionWalkable(pt.x, pt.y, this.radius)) {
                    points.push(pt);
                }
            }
        }
        if (points.length === 0 && tile) {
            const center = { x: tile.x + tileSize / 2, y: tile.y + tileSize / 2 };
            if (this.gameMap.isPositionWalkable(center.x, center.y, this.radius)) {
                points.push(center);
            }
        }
        if (points.length === 0) {
            points.push({ x: this.x, y: this.y });
        }
        return points;
    }

    update(player, deltaTime) {
        if (this.isDestroyed) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distanceToPlayer = Math.hypot(dx, dy);

        // State transitions
        if (this.state === 'patrolling') {
            if (distanceToPlayer <= this.detectionRadius) {
                this.state = 'chasing';
                this.targetPlayer = player;
            }
        } else if (this.state === 'chasing') {
            if (distanceToPlayer > this.chaseRadius) {
                this.state = 'returning';
                this.targetPlayer = null;
                this.currentPatrolIndex = this.findClosestPatrolPoint();
            }
        } else if (this.state === 'returning') {
            const patrolPoint = this.patrolPoints[this.currentPatrolIndex];
            if (Math.hypot(this.x - patrolPoint.x, this.y - patrolPoint.y) < 2) {
                this.state = 'patrolling';
            }
            if (distanceToPlayer <= this.detectionRadius) {
                this.state = 'chasing';
                this.targetPlayer = player;
            }
        }

        // Behavior per state
        if (this.state === 'chasing') {
            this.moveTowards(player.x, player.y);
            if (distanceToPlayer <= this.radius + player.radius) {
                player.takeDamage(this.attackDamage * (deltaTime / 1000));
            }
        } else if (this.state === 'patrolling') {
    const patrolPoint = this.patrolPoints[this.currentPatrolIndex];
    // Try to move towards the patrol point
    const moved = this.moveTowards(patrolPoint.x, patrolPoint.y);
    if (!moved || Math.hypot(this.x - patrolPoint.x, this.y - patrolPoint.y) < 2) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    }
}
 else if (this.state === 'returning') {
            const patrolPoint = this.patrolPoints[this.currentPatrolIndex];
            this.moveTowards(patrolPoint.x, patrolPoint.y);
        }
    }

    moveTowards(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.5) {
            const moveX = (dx / dist) * this.speed;
            const moveY = (dy / dist) * this.speed;
            if (this.gameMap.isPositionWalkable(this.x + moveX, this.y + moveY, this.radius)) {
                this.x += moveX;
                this.y += moveY;
                return true; // Successfully moved
            }
        }
        return false; 
    }

    findClosestPatrolPoint() {
        let minDist = Infinity;
        let minIndex = 0;
        for (let i = 0; i < this.patrolPoints.length; i++) {
            const pt = this.patrolPoints[i];
            const d = Math.hypot(this.x - pt.x, this.y - pt.y);
            if (d < minDist) {
                minDist = d;
                minIndex = i;
            }
        }
        return minIndex;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDestroyed = true;
        }
    }

    draw(ctx) {
        if (this.isDestroyed) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.BOT_COLOR || 'magenta';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
