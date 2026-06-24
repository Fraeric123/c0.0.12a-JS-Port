export class BitmapFont {
    constructor(ctx, texturePath) {
        this.charWidths = new Int32Array(256);
        this.fontImage = new Image();
        this.isReady = false;
        this.ctx = ctx;

        this.colorCache = new Map();

        this.fontImage.onload = () => {
            this._analyzeCharWidths();
        };
        this.fontImage.src = texturePath;
    }

    _analyzeCharWidths() {
        const w = this.fontImage.width;
        const h = this.fontImage.height;

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = w;
        offscreenCanvas.height = h;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.drawImage(this.fontImage, 0, 0);

        const imgData = offscreenCtx.getImageData(0, 0, w, h);
        const rawPixels = imgData.data;

        for (let i = 0; i < 128; i++) {
            let xt = i % 16;
            let yt = Math.floor(i / 16);

            let x = 0;
            let emptyColumn = false;

            for (; x < 8 && !emptyColumn; x++) {
                let xPixel = xt * 8 + x;
                emptyColumn = true;

                for (let y = 0; y < 8 && emptyColumn; y++) {
                    let yPixel = (yt * 8 + y) * w;
                    let idx = (xPixel + yPixel) * 4;

                    let alpha = rawPixels[idx + 3];
                    let r = rawPixels[idx];
                    if (alpha > 128 || r > 128) {
                        emptyColumn = false;
                    }
                }
            }

            if (i === 32) x = 4;
            this.charWidths[i] = x;
        }

        this.colorCache.set('#ffffff', this.fontImage);
        this.isReady = true;
    }

    _getColoredFontTexture(hexColorStr) {
        const cleanColor = hexColorStr.toLowerCase();

        if (this.colorCache.has(cleanColor)) {
            return this.colorCache.get(cleanColor);
        }

        const cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = this.fontImage.width;
        cacheCanvas.height = this.fontImage.height;
        const cacheCtx = cacheCanvas.getContext('2d');

        cacheCtx.drawImage(this.fontImage, 0, 0);

        cacheCtx.globalCompositeOperation = 'source-in';
        cacheCtx.fillStyle = cleanColor;
        cacheCtx.fillRect(0, 0, cacheCanvas.width, cacheCanvas.height);

        this.colorCache.set(cleanColor, cacheCanvas);
        return cacheCanvas;
    }

    _hexToString(hex) {
        return `#${hex.toString(16).padStart(6, '0')}`;
    }

    drawText(text, x, y, shadow = false, scale = 1, hexColor = 0xFF0000) {
        if (!this.isReady) return;

        x = Math.floor(x);
        y = Math.floor(y);

        const originalSmoothing = this.ctx.imageSmoothingEnabled;
        this.ctx.imageSmoothingEnabled = false;

        const mainColorStr = typeof hexColor === 'number' ? this._hexToString(hexColor) : hexColor;

        if (shadow) {
            let shadowColorStr = 'rgb(0,0,0)';

            if (typeof hexColor === 'number') {
                let r = Math.floor(((hexColor >> 16) & 0xFF) / 4);
                let g = Math.floor(((hexColor >> 8) & 0xFF) / 4);
                let b = Math.floor((hexColor & 0xFF) / 4);
                shadowColorStr = `rgb(${r},${g},${b})`;
            } else if (mainColorStr.startsWith('#')) {
                shadowColorStr = mainColorStr.length > 7 ? mainColorStr.substring(0, 7) + '44' : '#111111';
            }

            const shadowTexture = this._getColoredFontTexture(shadowColorStr);
            this._renderTextString(text, x + scale, y + scale, scale, shadowTexture);
        }

        const mainTexture = this._getColoredFontTexture(mainColorStr);
        this._renderTextString(text, x, y, scale, mainTexture);

        this.ctx.imageSmoothingEnabled = originalSmoothing;
    }

    getTextWidth(text, scale = 1) {
        if (!this.isReady) return 0;
        let totalWidth = 0;
        for (let i = 0; i < text.length; i++) {
            if (text.charAt(i) === '§' && i + 1 < text.length) {
                i++;
                continue;
            }
            const charCode = text.charCodeAt(i);
            totalWidth += (this.charWidths[charCode] || 0) * scale;
        }
        return totalWidth;
    }

    _renderTextString(text, x, y, scale, fontTexture) {
        let xo = 0;
        const ctx = this.ctx;

        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);

            if (text.charAt(i) === '§' && i + 1 < text.length) {
                i++;
                continue;
            }

            const srcX = (charCode % 16) * 8;
            const srcY = Math.floor(charCode / 16) * 8;
            const charWidth = this.charWidths[charCode] || 0;

            if (charWidth > 0) {
                ctx.drawImage(
                    fontTexture,
                    srcX, srcY, 8, 8,
                    x + xo, y, 8 * scale, 8 * scale
                );
            }
            xo += charWidth * scale;
        }
    }
}