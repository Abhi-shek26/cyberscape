class GameMap {
    constructor(width, height, tileSize, gridLineWidth) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.gridLineWidth = gridLineWidth;

        this.cols = Math.floor(this.width / (this.tileSize + this.gridLineWidth));
        this.rows = Math.floor(this.height / (this.tileSize + this.gridLineWidth));
        
        this.grid = [];
        this.baseStationPos = null;
        this.centralHubPos = null;
        this.towers = [];
        this.keys = [];
        this.playerStartTileCoords = null;

        this.generateMap();
    }

    generateMap() {
        this.grid = [];
        this.towers = [];
        this.keys = [];

        const startR = getRandomInt(0, this.rows - 1);
        const startC = getRandomInt(0, this.cols - 1);
        this.playerStartTileCoords = { r: startR, c: startC };

        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const tileContentX = c * (this.tileSize + this.gridLineWidth) + this.gridLineWidth;
                const tileContentY = r * (this.tileSize + this.gridLineWidth) + this.gridLineWidth;
                this.grid[r][c] = {
                    x: tileContentX, 
                    y: tileContentY,
                    type: 'open',
                    isWalkable: true,
                    buildings: []
                };
            }
        }

        this.grid[startR][startC].type = 'player_start_zone';
        this.grid[startR][startC].buildings = [];
        this.grid[startR][startC].isWalkable = true;

        let baseR, baseC;
        do {
            baseR = getRandomInt(0, this.rows - 1);
            baseC = getRandomInt(0, this.cols - 1);
        } while (baseR === startR && baseC === startC);
        this.grid[baseR][baseC].type = 'base_station';
        this.grid[baseR][baseC].buildings = [];
        this.baseStationPos = { r: baseR, c: baseC, x: this.grid[baseR][baseC].x, y: this.grid[baseR][baseC].y };

        let hubR, hubC;
        do {
            hubR = getRandomInt(0, this.rows - 1);
            hubC = getRandomInt(0, this.cols - 1);
        } while ((hubR === startR && hubC === startC) || (hubR === baseR && hubC === baseC));
        this.grid[hubR][hubC].type = 'central_hub';
        this.grid[hubR][hubC].buildings = [];
        this.centralHubPos = { r: hubR, c: hubC, x: this.grid[hubR][hubC].x, y: this.grid[hubR][hubC].y };

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (tile.type === 'open') { 
                    if (Math.random() < 0.80) { 
                        tile.buildings = this.generateRandomBuildingsInTile(tile.x, tile.y);
                    } else {
                        tile.buildings = [];
                    }
                    this.towers.push(new Tower(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, CONFIG.TOWER_RADIUS, CONFIG.TOWER_VISION_RADIUS, CONFIG.TOWER_VISION_ANGLE, CONFIG.TOWER_ROTATION_SPEED));
                }
            }
        }
        
        for (let i = 0; i < CONFIG.NUM_KEYS_TO_SPAWN; i++) {
            this.spawnKey();
        }
    }

    generateRandomBuildingsInTile(tileContentX, tileContentY) {
        const buildings = [];
        const numBuildingShapes = getRandomInt(1, 2); 

        for (let i = 0; i < numBuildingShapes; i++) {
            const buildingPolygon = [];
            const numVertices = getRandomInt(4, 6); 
            const buildingCenterX = tileContentX + this.tileSize / 2;
            const buildingCenterY = tileContentY + this.tileSize / 2;
            
            const maxDimFromCenter = (this.tileSize / 2) * 0.75; 
            const minDimFromCenter = maxDimFromCenter * 0.45;

            for (let j = 0; j < numVertices; j++) {
                const angle = (j / numVertices) * 2 * Math.PI + (Math.random() * 0.6 - 0.3);
                const radius = getRandomInt(minDimFromCenter, maxDimFromCenter);
                
                const x = buildingCenterX + radius * Math.cos(angle);
                const y = buildingCenterY + radius * Math.sin(angle);
                
                const padding = 7; 
                buildingPolygon.push({ 
                    x: Math.max(tileContentX + padding, Math.min(tileContentX + this.tileSize - padding, x)), 
                    y: Math.max(tileContentY + padding, Math.min(tileContentY + this.tileSize - padding, y)) 
                });
            }
            if (buildingPolygon.length > 2) {
                 buildings.push(buildingPolygon);
            }
        }
        return buildings;
    }
    
    spawnKey() {
        let keyR, keyC, keyX, keyY;
        let validPosition = false;
        let attempts = 0;
        while(!validPosition && attempts < 200) { 
            attempts++;
            keyR = getRandomInt(0, this.rows - 1);
            keyC = getRandomInt(0, this.cols - 1);
            const tile = this.grid[keyR][keyC];

            if (tile.type === 'open' || tile.type === 'player_start_zone') { 
                const keyPadding = CONFIG.KEY_RADIUS + 5; 
                keyX = tile.x + getRandomInt(keyPadding, this.tileSize - keyPadding);
                keyY = tile.y + getRandomInt(keyPadding, this.tileSize - keyPadding);
                
                let onBuilding = false;
                if (tile.buildings && tile.buildings.length > 0) { 
                    for (const buildingPolygon of tile.buildings) {
                        if (pointInPolygon({x: keyX, y: keyY}, buildingPolygon)) {
                            onBuilding = true;
                            break;
                        }
                    }
                }
                if (!onBuilding) {
                    validPosition = true;
                }
            }
        }
        if (validPosition) {
             this.keys.push(new Key(keyX, keyY));
        } else {
        }
    }

    isPositionWalkable(x, y, entityRadius = 0) {
        const c = Math.floor(x / (this.tileSize + this.gridLineWidth));
        const r = Math.floor(y / (this.tileSize + this.gridLineWidth));

        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
            return false; 
        }

        const onHorizontalRoad = (y % (this.tileSize + this.gridLineWidth)) < this.gridLineWidth;
        const onVerticalRoad = (x % (this.tileSize + this.gridLineWidth)) < this.gridLineWidth;

        if (onHorizontalRoad || onVerticalRoad) {
            return true; 
        }

        const tile = this.grid[r][c];
        if (!tile) { 
            return false; 
        }
        
        if (tile.type === 'base_station' || tile.type === 'central_hub' || tile.type === 'player_start_zone') {
            return true; 
        }
        
        if (!tile.isWalkable) { 
             return false;
        }
            
        if (tile.buildings && tile.buildings.length > 0) {
            const pointsToCheck = [{px: x, py: y}]; 
            if (entityRadius > 0) {
                const numCheckPoints = 8;
                for (let i = 0; i < numCheckPoints; i++) { 
                    const angle = (i / numCheckPoints) * 2 * Math.PI;
                    pointsToCheck.push({
                        px: x + entityRadius * Math.cos(angle),
                        py: y + entityRadius * Math.sin(angle)
                    });
                }
            }

            for (const point of pointsToCheck) {
                for (const buildingPolygon of tile.buildings) {
                    if (pointInPolygon({ x: point.px, y: point.py }, buildingPolygon)) {
                        return false; 
                    }
                }
            }
        }
        return true; 
    }

    getTileAt(worldX, worldY) {
        const c = Math.floor(worldX / (this.tileSize + this.gridLineWidth));
        const r = Math.floor(worldY / (this.tileSize + this.gridLineWidth));
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            return this.grid[r][c];
        }
        return null; 
    }
    
    getAllBuildingPolygons() {
        const allPolygons = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].buildings.length > 0) {
                     this.grid[r][c].buildings.forEach(poly => allPolygons.push(poly));
                }
            }
        }
        return allPolygons;
    }

    draw(ctx) {
        ctx.fillStyle = CONFIG.ROAD_COLOR;
        ctx.fillRect(0, 0, this.width, this.height);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                
                ctx.beginPath();
                if (tile.type === 'base_station') {
                    ctx.fillStyle = CONFIG.BASE_STATION_COLOR;
                } else if (tile.type === 'central_hub') {
                    ctx.fillStyle = CONFIG.CENTRAL_HUB_COLOR;
                } else if (tile.type === 'player_start_zone') {
                    ctx.fillStyle = CONFIG.OPEN_SPACE_COLOR; 
                } else { 
                    ctx.fillStyle = CONFIG.OPEN_SPACE_COLOR;
                }
                ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);

                ctx.fillStyle = CONFIG.BUILDING_COLOR;
                for (const buildingPolygon of tile.buildings) {
                    if (buildingPolygon.length > 2) {
                        ctx.beginPath();
                        ctx.moveTo(buildingPolygon[0].x, buildingPolygon[0].y);
                        for (let i = 1; i < buildingPolygon.length; i++) {
                            ctx.lineTo(buildingPolygon[i].x, buildingPolygon[i].y);
                        }
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
        }
        this.keys.forEach(key => { if (!key.collected) key.draw(ctx); });
    }
}
