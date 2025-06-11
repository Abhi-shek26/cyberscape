const playerHealthEl = document.getElementById('player-health');
const systemHealthEl = document.getElementById('system-health');
const keysCollectedEl = document.getElementById('keys-collected');
const shardsDeliveredEl = document.getElementById('shards-delivered');
const highScoreEl = document.getElementById('high-score');
const shardCostEl = document.getElementById('shard-cost');

function initUI() {
    if (shardCostEl && CONFIG && typeof CONFIG.SHARD_DECRYPTION_COST !== 'undefined') {
        shardCostEl.textContent = CONFIG.SHARD_DECRYPTION_COST;
    } else {
        if(shardCostEl) shardCostEl.textContent = "N/A"; // Fallback if config not loaded
    }
}

function updateUI(player, systemHealth, shardsDeliveredCount, currentHighScore) {
    if (playerHealthEl) playerHealthEl.textContent = player.health.toFixed(0);
    if (systemHealthEl) systemHealthEl.textContent = systemHealth.toFixed(0);
    if (keysCollectedEl) keysCollectedEl.textContent = player.keys;
    if (shardsDeliveredEl) shardsDeliveredEl.textContent = shardsDeliveredCount;
    if (highScoreEl) highScoreEl.textContent = currentHighScore;
}
