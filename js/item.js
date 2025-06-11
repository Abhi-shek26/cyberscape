class Key {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.KEY_RADIUS;
        this.color = CONFIG.KEY_COLOR;
        this.collected = false;
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
}
