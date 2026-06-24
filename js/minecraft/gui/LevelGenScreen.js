import { Screen } from './Screen.js';

export class LevelGenScreen extends Screen {
    initUI() {
        this.title = "";
        this.status = "";
        this.progress = 0;

        this.bgImage = new Image();
        this.bgPattern = null;
        this.bgReady = false;

        this.bgImage.onload = () => {
            const pattern = this.minecraft.ctx.createPattern(this.bgImage, 'repeat');

            const textureScale = 7;

            const matrix = new DOMMatrix();
            matrix.scaleSelf(textureScale, textureScale);

            pattern.setTransform(matrix);

            this.bgPattern = pattern;
            this.bgReady = true;
        };
        this.bgImage.src = './assets/textures/dirt.png';
    }

    setTitle(title) {
        this.title = title;
    }

    setStatus(status, progress = 0) {
        this.status = status;
        this.progress = progress;
    }

    render(xm, ym, w, h) {
        this.width = w;
        this.height = h;

        const ctx = this.minecraft.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        const originalSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;

        if (this.bgReady && this.bgPattern) {
            ctx.save();

            //const speed = 0.03;
            //const offset = (performance.now() * speed) % 64;

            const matrix = new DOMMatrix();
            matrix.scaleSelf(4, 4);
            //matrix.translateSelf(offset, offset);

            this.bgPattern.setTransform(matrix);

            ctx.fillStyle = this.bgPattern;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = '#222222';
            ctx.fillRect(0, 0, this.width, this.height);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawCenteredString(this.title, centerX, centerY - 50, 0xFFFFFF, 4);
        this.drawCenteredString(this.status, centerX, centerY - 10, 0xAAAAAA, 3);

        const barWidth = 400;
        const barHeight = 24;
        const barX = centerX - barWidth / 2;
        const barY = centerY + 30;

        this.fill(barX - 2, barY - 2, barX + barWidth + 2, barY + barHeight + 2, '#000000');
        this.fill(barX, barY, barX + barWidth, barY + barHeight, '#555555');

        if (this.progress > 0) {
            const progressWidth = (barWidth * this.progress) / 100;
            this.fill(barX, barY, barX + progressWidth, barY + barHeight, '#80ff80');
        }

        this.drawCenteredString(`${Math.floor(this.progress)}%`, centerX, barY + 4, 0xFFFFFF, 2);

        ctx.imageSmoothingEnabled = originalSmoothing;
    }
}