class Projectile {
    constructor(x, y, dx, dy, speed, color, collisionPolygons) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.PROJECTILE_RADIUS;
        this.speed = speed;
        this.color = color;
        this.collisionPolygons = collisionPolygons; 
        this.life = 500; 

        const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
        this.vx = (dx / magnitude) * speed;
        this.vy = (dy / magnitude) * speed;
    }

    update() {
        this.life--;
        const prevX = this.x;
        const prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;

        // Reflection logic
        for (const poly of this.collisionPolygons) {
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i];
                const p2 = poly[(i + 1) % poly.length]; 

                const intersection = lineIntersection({x: prevX, y: prevY}, {x: this.x, y: this.y}, p1, p2);
                if (intersection) {
                    const wallNormal = getNormal(p1, p2);
                    const reflectedVelocity = reflectVector({x: this.vx, y: this.vy}, wallNormal);
                    
                    this.vx = reflectedVelocity.x;
                    this.vy = reflectedVelocity.y;

                    // Reposition bullet to the point of impact to avoid passing through
                    this.x = intersection.x + this.vx * 0.01; 
                    this.y = intersection.y + this.vy * 0.01;
                    return; 
                }
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight || this.life <= 0;
    }
}
