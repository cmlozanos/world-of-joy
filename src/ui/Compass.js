export class Compass {
    constructor() {
        this.canvas = document.getElementById('compass-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.size = 90;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.time = 0;
    }

    update(character, targetPositions, delta = 0.016) {
        this.time += delta;
        const ctx = this.ctx;
        const half = this.size / 2;
        const charPos = character.getPosition();

        ctx.clearRect(0, 0, this.size, this.size);

        let nearestPos = null;
        let minDist = Infinity;

        for (const pos of targetPositions) {
            const dx = pos.x - charPos.x;
            const dz = pos.z - charPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < minDist) {
                minDist = dist;
                nearestPos = pos;
            }
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(half, half, half - 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(half, half, half - 1, 0, Math.PI * 2);
        ctx.stroke();

        if (!nearestPos) {
            const pulse = 0.7 + Math.sin(this.time * 3) * 0.3;
            ctx.fillStyle = `rgba(76, 175, 80, ${pulse})`;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\u00a1Listo!', half, half);
            return;
        }

        const dx = nearestPos.x - charPos.x;
        const dz = nearestPos.z - charPos.z;
        const worldAngle = Math.atan2(dx, dz);
        const relativeAngle = worldAngle - character.group.rotation.y;

        const pulse = 0.85 + Math.sin(this.time * 4) * 0.15;

        ctx.save();
        ctx.translate(half, half);
        ctx.rotate(relativeAngle);

        const arrowLen = half - 14;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen);
        ctx.lineTo(-9, -arrowLen + 16);
        ctx.lineTo(0, -arrowLen + 10);
        ctx.lineTo(9, -arrowLen + 16);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen + 12);
        ctx.lineTo(0, 10);
        ctx.stroke();

        ctx.restore();

        const distText = `${Math.round(minDist)}m`;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(distText, half, this.size - 3);
    }
}
