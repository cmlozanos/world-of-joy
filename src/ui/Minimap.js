export class Minimap {
    constructor() {
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.size = 160;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.range = 150;
    }

    update(character, fruitManager, waterBottleManager, worldBounds, extraMarkers = []) {
        const ctx = this.ctx;
        const size = this.size;
        const half = size / 2;
        const charPos = character.getPosition();
        const scale = size / (this.range * 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(half, half, half, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(half, half, half - 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = '#ffd700';
        for (const fruit of fruitManager.fruits) {
            if (fruit.collected) continue;
            const dx = fruit.group.position.x - charPos.x;
            const dz = fruit.group.position.z - charPos.z;
            const px = half + dx * scale;
            const py = half - dz * scale;
            if (this.inRadius(px, py, half)) {
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.fillStyle = '#4fc3f7';
        for (const bottle of waterBottleManager.bottles) {
            if (bottle.collected) continue;
            const dx = bottle.group.position.x - charPos.x;
            const dz = bottle.group.position.z - charPos.z;
            const px = half + dx * scale;
            const py = half - dz * scale;
            if (this.inRadius(px, py, half)) {
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (const { positions, color, size: dotSize } of extraMarkers) {
            ctx.fillStyle = color;
            for (const pos of positions) {
                const dx = pos.x - charPos.x;
                const dz = pos.z - charPos.z;
                const px = half + dx * scale;
                const py = half - dz * scale;
                if (this.inRadius(px, py, half)) {
                    ctx.beginPath();
                    ctx.arc(px, py, dotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();

        // Direction indicator (N)
        ctx.save();
        ctx.translate(half, half);
        ctx.rotate(-character.group.rotation.y);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', 0, -(half - 12));
        ctx.restore();

        // Player (center triangle showing direction)
        ctx.save();
        ctx.translate(half, half);
        ctx.rotate(-character.group.rotation.y);

        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(-5, 5);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(half, half, half - 1, 0, Math.PI * 2);
        ctx.stroke();
    }

    inRadius(x, y, half) {
        const dx = x - half;
        const dy = y - half;
        return dx * dx + dy * dy < (half - 2) * (half - 2);
    }
}
