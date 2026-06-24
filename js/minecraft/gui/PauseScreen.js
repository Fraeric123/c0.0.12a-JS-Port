import { Screen } from './Screen.js';
import { Button } from './Button.js';

export class PauseScreen extends Screen {
    initUI() {
        this.buttons = [];
        this.bw = 480;
        this.bh = 60;
        const cx = this.width / 2 - this.bw / 2;
        const cy = this.height / 3;

        this.buttons.push(new Button(0, cx, cy + 0, this.bw, this.bh, "Generate new level"));
        this.buttons.push(new Button(1, cx, cy + 80, this.bw, this.bh, "Save level.."));
        this.buttons.push(new Button(2, cx, cy + 160, this.bw, this.bh, "Load level.."));
        this.buttons.push(new Button(3, cx, cy + 240, this.bw, this.bh, "Back to game"));
    }

    mouseClicked(x, y, buttonNum) {
        if (buttonNum === 0) {
            for (let i = 0; i < this.buttons.length; i++) {
                const button = this.buttons[i];
                if (x >= button.x && y >= button.y && x < button.x + button.w && y < button.y + button.h) {
                    this.buttonClicked(button);
                }
            }
        }
    }

    async buttonClicked(button) {
        if (button.id === 0) {
            await this.minecraft.generateNewLevel();
            if (!document.pointerLockElement) document.body.requestPointerLock();
            this.minecraft.setScreen(null);
        }
        if (button.id === 1) {
            this.minecraft.saveLevel();
        }
        if (button.id === 2) {
            this.minecraft.loadLevel();
        }
        if (button.id === 3) {
            this.minecraft.setScreen(null);
            if (!document.pointerLockElement) document.body.requestPointerLock();
        }
    }

    render(xm, ym, w, h) {
        this.width = w;
        this.height = h;
        const cx = this.width / 2 - this.bw / 2;
        const cy = this.height / 3;

        this.minecraft.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.minecraft.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            const isHovered = xm >= btn.x && ym >= btn.y && xm < btn.x + btn.w && ym < btn.y + btn.h;

            btn.x = cx;

            switch (btn.id) {
                case 0:
                    btn.y = cy + 0;
                    break;
                case 1:
                    btn.y = cy + 80;
                    break;
                case 2:
                    btn.y = cy + 160;
                    break;
                case 3:
                    btn.y = cy + 240;
                    break;
            }

            this.fill(btn.x - 2, btn.y - 2, btn.x + btn.w + 2, btn.y + btn.h + 2, '#000000');
            this.fill(btn.x, btn.y, btn.x + btn.w, btn.y + btn.h, isHovered ? '#707070' : '#404040');

            const textColor = isHovered ? 0xFFFFA0 : 0xE0E0E0;
            this.drawCenteredString(btn.msg, btn.x + btn.w / 2, btn.y + 12, textColor, 4);
        }
    }
}