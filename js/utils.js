function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return `rgb(${r},${g},${b})`;
}

// Basic Axis-Aligned Bounding Box collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Circle-Rectangle collision
function circleRectCollision(circle, rect) {
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x; 
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width; 
    if (circle.y < rect.y) testY = rect.y; 
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height; 

    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= circle.radius;
}

// Point in Circle collision
function pointInCircle(point, circle) {
    const distanceSquared = (point.x - circle.x) ** 2 + (point.y - circle.y) ** 2;
    return distanceSquared <= circle.radius ** 2;
}

// Using ray casting algorithm
function pointInPolygon(point, polygon) {
    let intersections = 0;
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];

        // Check for horizontal line to avoid division by zero if p1.y === p2.y
        if (p1.y === p2.y) {
            if (point.y === p1.y && point.x >= Math.min(p1.x, p2.x) && point.x <= Math.max(p1.x, p2.x)) {
                return true; 
            }
            continue; // Skip this edge for ray casting if it's horizontal and point is not on it
        }
        
        // Original ray casting condition for non-horizontal lines
        if (((p1.y <= point.y && point.y < p2.y) || (p2.y <= point.y && point.y < p1.y)) &&
            (point.x < (p2.x - p1.x) * (point.y - p1.y) / (p2.y - p1.y) + p1.x)) {
            intersections++;
        }
    }
    return intersections % 2 === 1;
}


// Returns intersection point {x, y} or null
function lineIntersection(p1, p2, p3, p4) {
    const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (den === 0) return null; 
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y),
            seg1: {p1, p2}, 
            seg2: {p3, p4}  
        };
    }
    return null;
}

// Calculate normal of a line segment
function getNormal(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return { x: -dy, y: dx }; 
}

// Reflect a vector v off a surface with normal n
function reflectVector(v, n) {
    const nMag = Math.sqrt(n.x * n.x + n.y * n.y);
    const normal = { x: n.x / nMag, y: n.y / nMag };

    const dotProduct = v.x * normal.x + v.y * normal.y;
    return {
        x: v.x - 2 * dotProduct * normal.x,
        y: v.y - 2 * dotProduct * normal.y
    };
}
