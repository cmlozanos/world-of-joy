export class Compass {
    constructor() {
        this.canvas = document.getElementById('compass-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.size = 70;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
    }

    update(character, fruitManager) {
        const ctx = this.ctx;
        const half = this.size / 2;
        const charPos = character.getPosition();

        ctx.clearRect(0, 0, this.size, this.size);

        // Find nearest uncollected fruit
        let nearest = null;
        let minDist = Infinity;

        for (const fruit of fruitManager.fruits) {
            if (fruit.collected) continue;
            const dx = fruit.group.position.x - charPos.x;
            const dz = fruit.group.position.z - charPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < minDist) {
                minDist = dist;
                nearest = fruit;
            }
        }

        // Background circle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(half, half, half - 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(half, half, half - 1, 0, Math.PI * 2);
        ctx.stroke();

        if (!nearest) {
            // All collected
            ctx.fillStyle = '#4caf50';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', half, half);
            return;
        }

        // Calculate angle from character to fruit (relative to character facing direction)
        const dx = nearest.group.position.x - charPos.x;
        const dz = nearest.group.position.z - charPos.z;
        const worldAngle = Math.atan2(dx, dz);
        const relativeAngle = worldAngle - character.group.rotation.y;

        // Draw arrow pointing to nearest fruit
        ctx.save();
        ctx.translate(half, half);
        ctx.rotate(-relativeAngle);

        // Arrow
        const arrowLen = half - 12;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen);
        ctx.lineTo(-7, -arrowLen + 14);
        ctx.lineTo(0, -arrowLen + 8);
        ctx.lineTo(7, -arrowLen + 14);
        ctx.closePath();
        ctx.fill();

        // Arrow body
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen + 10);
        ctx.lineTo(0, 8);
        ctx.stroke();

        ctx.restore();

        // Distance text
        const distText = minDist < 10 ? `${Math.round(minDist)}m` : `${Math.round(minDist)}m`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(distText, half, this.size - 4);
    }
}
