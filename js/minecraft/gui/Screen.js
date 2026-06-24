export class Screen {
    init(minecraft, width, height) {
        this.minecraft = minecraft;
        this.width = width;
        this.height = height;
        this.initUI();
    }

    initUI() { }

    fill(x0, y0, x1, y1, color) {
        this.minecraft.ctx.fillStyle = color;
        this.minecraft.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }

    drawCenteredString(str, x, y, hexColor, scale = 2) {
        const textWidth = this.minecraft.bitmap_font.getTextWidth(str, scale);
        this.minecraft.bitmap_font.drawText(str, x - textWidth / 2, y, true, scale, hexColor);
    }

    updateEvents() { }

    keyPressed(eventKey) { }
    mouseClicked(x, y, button) { }
    tick() { }
}