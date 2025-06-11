class Tower {
    constructor(x, y, radius, visionRadius, visionAngle, rotationSpeed) {
        this.x = x;
        this.y = y;
        this.radius = radius; 
        this.color = CONFIG.TOWER_COLOR;
        this.visionRadius = visionRadius;
        this.visionAngle = visionAngle; 
        this.visionColor = CONFIG.TOWER_VISION_COLOR;
        this.rotationSpeed = rotationSpeed;
        this.currentAngle = Math.random() * Math.PI * 2; 
        this.health = CONFIG.TOWER_HEALTH;
        this.isDestroyed = false;
    }

    update(player, deltaTime) {
        if (this.isDestroyed) return;

        this.currentAngle += this.rotationSpeed;
        // Normalize currentAngle to be between 0 and 2*PI
        if (this.currentAngle > Math.PI * 2) {
            this.currentAngle -= Math.PI * 2;
        } else if (this.currentAngle < 0) {
            this.currentAngle += Math.PI * 2;
        }


        if (this.canSeePlayer(player)) {
            player.takeDamage(CONFIG.TOWER_DAMAGE_PER_SECOND * (deltaTime / 1000));
        }
    }

    canSeePlayer(player) {
        if (this.isDestroyed) return false;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distanceToPlayer = Math.hypot(dx, dy);

        // 1. Check if player is within the vision radius
        if (distanceToPlayer > this.visionRadius + player.radius) { // Add player.radius for edge detection
            return false; 
        }

        // 2. Check if player is within the vision cone angle (sector)
        let angleToPlayer = Math.atan2(dy, dx);
        // Normalize angleToPlayer to be between 0 and 2*PI
        if (angleToPlayer < 0) {
            angleToPlayer += Math.PI * 2;
        }

        // The vision cone spreads half on each side of currentAngle
        let visionStartAngle = this.currentAngle - this.visionAngle / 2;
        let visionEndAngle = this.currentAngle + this.visionAngle / 2;

        // Normalize angles to handle wrap-around robustly
        const twoPi = Math.PI * 2;
        const normalizeAngle = (angle) => (angle % twoPi + twoPi) % twoPi;

        visionStartAngle = normalizeAngle(visionStartAngle);
        visionEndAngle = normalizeAngle(visionEndAngle);
        angleToPlayer = normalizeAngle(angleToPlayer);

        if (visionStartAngle <= visionEndAngle) {
            return angleToPlayer >= visionStartAngle && angleToPlayer <= visionEndAngle;
        } else { 
            return angleToPlayer >= visionStartAngle || angleToPlayer <= visionEndAngle;
        }
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

        // Draw tower base
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Draw vision cone
        ctx.beginPath();
        ctx.moveTo(this.x, this.y); 
        const startDrawAngle = this.currentAngle - this.visionAngle / 2;
        const endDrawAngle = this.currentAngle + this.visionAngle / 2;
        ctx.arc(this.x, this.y, this.visionRadius, startDrawAngle, endDrawAngle);
        ctx.closePath(); 
        ctx.fillStyle = CONFIG.TOWER_VISION_COLOR; // Use the vision color with alpha
        ctx.fill();
    }
}
