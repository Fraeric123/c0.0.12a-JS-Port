import * as THREE from './libs/three.module.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    interpolateTo(vec, p) {
        const xt = this.x + (vec.x - this.x) * p;
        const yt = this.y + (vec.y - this.y) * p;
        const zt = this.z + (vec.z - this.z) * p;
        return new Vec3(xt, yt, zt)
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Button {
    constructor(id, x, y, w, h, msg) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.msg = msg;
    }
}

class Screen {
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

class PauseScreen extends Screen {
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

    buttonClicked(button) {
        if (button.id === 0) {
            this.minecraft.generateNewLevel();
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

class LevelGenScreen extends Screen {
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

class BitmapFont {
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

class AABB {
    constructor(x0, y0, z0, x1, y1, z1) {
        this.epsilon = 0.001;
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;
    }

    expand(xa, ya, za) {
        let _x0 = this.x0;
        let _y0 = this.y0;
        let _z0 = this.z0;
        let _x1 = this.x1;
        let _y1 = this.y1;
        let _z1 = this.z1;

        if (xa < 0.0) _x0 += xa;
        if (xa > 0.0) _x1 += xa;
        if (ya < 0.0) _y0 += ya;
        if (ya > 0.0) _y1 += ya;
        if (za < 0.0) _z0 += za;
        if (za > 0.0) _z1 += za;

        return new AABB(_x0, _y0, _z0, _x1, _y1, _z1);
    }

    grow(xa, ya, za) {
        return new AABB(
            this.x0 - xa, this.y0 - ya, this.z0 - za,
            this.x1 + xa, this.y1 + ya, this.z1 + za
        );
    }

    cloneMove(xa, ya, za) {
        return new AABB(this.x0 + za, this.y0 + ya, this.z0 + za, this.x1 + xa, this.y1 + ya, this.z1 + za);
    }

    clipXCollide(c, xa) {
        if (c.y1 <= this.y0 || c.y0 >= this.y1) return xa;
        if (c.z1 <= this.z0 || c.z0 >= this.z1) return xa;

        if (xa > 0.0 && c.x1 <= this.x0) {
            let max = this.x0 - c.x1 - this.epsilon;
            if (max < xa) xa = max;
        }
        if (xa < 0.0 && c.x0 >= this.x1) {
            let max = this.x1 - c.x0 + this.epsilon;
            if (max > xa) xa = max;
        }
        return xa;
    }

    clipYCollide(c, ya) {
        if (c.x1 <= this.x0 || c.x0 >= this.x1) return ya;
        if (c.z1 <= this.z0 || c.z0 >= this.z1) return ya;

        if (ya > 0.0 && c.y1 <= this.y0) {
            let max = this.y0 - c.y1 - this.epsilon;
            if (max < ya) ya = max;
        }
        if (ya < 0.0 && c.y0 >= this.y1) {
            let max = this.y1 - c.y0 + this.epsilon;
            if (max > ya) ya = max;
        }
        return ya;
    }

    clipZCollide(c, za) {
        if (c.x1 <= this.x0 || c.x0 >= this.x1) return za;
        if (c.y1 <= this.y0 || c.y0 >= this.y1) return za;

        if (za > 0.0 && c.z1 <= this.z0) {
            let max = this.z0 - c.z1 - this.epsilon;
            if (max < za) za = max;
        }
        if (za < 0.0 && c.z0 >= this.z1) {
            let max = this.z1 - c.z0 + this.epsilon;
            if (max > za) za = max;
        }
        return za;
    }

    intersects(c) {
        if (c.x1 <= this.x0 || c.x0 >= this.x1) return false;
        if (c.y1 <= this.y0 || c.y0 >= this.y1) return false;
        return !(c.z1 <= this.z0) && !(c.z0 >= this.z1);
    }

    move(xa, ya, za) {
        this.x0 += xa;
        this.y0 += ya;
        this.z0 += za;
        this.x1 += xa;
        this.y1 += ya;
        this.z1 += za;
    }
}

class JavaRandom {
    static p2_16 = 0x10000;
    static p2_24 = 0x1000000;
    static p2_27 = 0x8000000;
    static p2_31 = 0x80000000;
    static p2_32 = 0x100000000;
    static p2_48 = 0x1000000000000;
    static p2_53 = Math.pow(2, 53);
    static m2_16 = 0xffff;
    static c2 = 0x0005;
    static c1 = 0xdeec;
    static c0 = 0xe66d;

    constructor(seedval) {
        this.s2 = 0; this.s1 = 0; this.s0 = 0;
        this.nextNextGaussian = 0;
        this.haveNextNextGaussian = false;

        if (seedval === undefined) {
            seedval = Math.floor(Math.random() * JavaRandom.p2_48);
        }
        this.seed = seedval;
        this.setSeed(seedval);
    }

    _next() {
        let carry = 0xb;
        let r0 = (this.s0 * JavaRandom.c0) + carry;
        carry = r0 >>> 16;
        r0 &= JavaRandom.m2_16;
        let r1 = (this.s1 * JavaRandom.c0 + this.s0 * JavaRandom.c1) + carry;
        carry = r1 >>> 16;
        r1 &= JavaRandom.m2_16;
        let r2 = (this.s2 * JavaRandom.c0 + this.s1 * JavaRandom.c1 + this.s0 * JavaRandom.c2) + carry;
        r2 &= JavaRandom.m2_16;

        this.s2 = r2; this.s1 = r1; this.s0 = r0;
        return (r2 << 16) | r1;
    }

    next(bits) { return this._next() >>> (32 - bits); }
    next_signed(bits) { return this._next() >> (32 - bits); }

    setSeed(n) {
        let bSeed = (BigInt(n) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);

        this.s0 = Number(bSeed & 0xFFFFn);
        this.s1 = Number((bSeed >> 16n) & 0xFFFFn);
        this.s2 = Number((bSeed >> 32n) & 0xFFFFn);

        this.haveNextNextGaussian = false;
    }

    nextInt(bound) {
        if (bound === undefined) return this.next_signed(32);
        if (bound <= 0) throw new RangeError("bound must be positive");

        if ((bound & -bound) === bound) {
            return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
        }

        let bits, val;
        do {
            bits = this.next(31);
            val = bits % bound;
        } while (bits - val + (bound - 1) < 0);
        return val;
    }

    nextBoolean() { return this.next(1) !== 0; }
    nextFloat() { return this.next(24) / JavaRandom.p2_24; }
    nextDouble() { return (JavaRandom.p2_27 * this.next(26) + this.next(27)) / JavaRandom.p2_53; }
}

class PerlinNoiseFilterBroken {
    constructor(levels) {
        this.levels = levels;
        this.fuzz = 16;
    }

    read(width, height, random) {
        if (!random) {
            random = new JavaRandom(Math.floor(Math.random() * 0x1000000000000));
        }

        const tmp = new Array(width * height).fill(0);
        const level = this.levels;

        let step = width >> level;
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                tmp[x + y * width] = (random.nextInt(256) - 128) * this.fuzz;
            }
        }

        for (step = width >> level; step > 1; step = Math.floor(step / 2)) {
            let val = 256 * (step << level);
            let ss = Math.floor(step / 2);

            for (let i = 0; i < height; i += step) {
                for (let x = 0; x < width; x += step) {
                    let ul = tmp[(x + 0) % width + ((i + 0) % height) * width];
                    let ur = tmp[(x + step) % width + ((i + 0) % height) * width];
                    let dl = tmp[(x + 0) % width + ((i + step) % height) * width];
                    let dr = tmp[(x + step) % width + ((i + step) % height) * width];

                    let m = Math.trunc((ul + dl + ur + dr) / 4) + random.nextInt(val * 2) - val;

                    tmp[x + ss + (i + ss) * width] = m;
                }
            }

            for (let i = 0; i < height; i += step) {
                for (let x = 0; x < width; x += step) {
                    let c = tmp[x + i * width];
                    let r = tmp[(x + step) % width + i * width];
                    let d = tmp[x + ((i + step) % width) * width];

                    let mu = tmp[((x + ss) & (width - 1)) + ((i + ss - step) & (height - 1)) * width];
                    let ml = tmp[((x + ss - step) & (width - 1)) + ((i + ss) & (height - 1)) * width];
                    let m = tmp[(x + ss) % width + ((i + ss) % height) * width];

                    let u = Math.trunc((c + r + m + mu) / 4) + random.nextInt(val * 2) - val;
                    let l = Math.trunc((c + d + m + ml) / 4) + random.nextInt(val * 2) - val;

                    tmp[x + ss + i * width] = u;
                    tmp[x + (i + ss) * width] = l;
                }
            }
        }

        const result = new Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[x + y * width] = Math.trunc(tmp[(x % width) + (y % height) * width] / 512) + 128;
            }
        }
        return result;
    }
}

class PerlinNoiseFilter {
    constructor(levels) {
        this.levels = levels;
        this.fuzz = 16;
    }

    read(width, height, random) {
        if (!random) {
            random = new JavaRandom(Math.floor(Math.random() * 0x1000000000000));
        }

        const tmp = new Array(width * height).fill(0);
        const level = this.levels;

        let step = width >> level;
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                tmp[x + y * width] = (random.nextInt(256) - 128) * this.fuzz;
            }
        }

        for (step = width >> level; step > 1; step = Math.floor(step / 2)) {
            let val = 256 * (step << level);
            let ss = Math.floor(step / 2);

            for (let i = 0; i < height; i += step) {
                for (let x = 0; x < width; x += step) {
                    let ul = tmp[(x + 0) % width + ((i + 0) % height) * width];
                    let ur = tmp[(x + step) % width + ((i + 0) % height) * width];
                    let dl = tmp[(x + 0) % width + ((i + step) % height) * width];
                    let dr = tmp[(x + step) % width + ((i + step) % height) * width];

                    let m = Math.trunc((ul + dl + ur + dr) / 4) + random.nextInt(val * 2) - val;

                    tmp[x + ss + (i + ss) * width] = m;
                }
            }

            for (let i = 0; i < height; i += step) {
                for (let x = 0; x < width; x += step) {
                    let c = tmp[x + i * width];
                    let r = tmp[(x + step) % width + i * width];
                    let d = tmp[x + ((i + step) % height) * width];

                    let mu = tmp[((x + ss) & (width - 1)) + ((i + ss - step) & (height - 1)) * width];
                    let ml = tmp[((x + ss - step) & (width - 1)) + ((i + ss) & (height - 1)) * width];
                    let m = tmp[(x + ss) % width + ((i + ss) % height) * width];

                    let u = Math.trunc((c + r + m + mu) / 4) + random.nextInt(val * 2) - val;
                    let l = Math.trunc((c + d + m + ml) / 4) + random.nextInt(val * 2) - val;

                    tmp[x + ss + i * width] = u;
                    tmp[x + (i + ss) * width] = l;
                }
            }
        }

        const result = new Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[x + y * width] = Math.trunc(tmp[(x % width) + (y % height) * width] / 512) + 128;
            }
        }
        return result;
    }
}

class Textures {
    static loadTexture(path) {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(path);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }
}

class Vertex {
    constructor(...args) {
        if (args.length === 5 &&
            typeof args[0] === 'number' &&
            typeof args[1] === 'number' &&
            typeof args[2] === 'number') {
            const [x, y, z, u, v] = args;
            this.pos = new Vec3(x, y, z);
            this.u = u;
            this.v = v;
        }
        else if (args.length === 3 && args[0] instanceof Vertex) {
            const [vertex, u, v] = args;
            this.pos = vertex.pos;
            this.u = u;
            this.v = v;
        }
        else if (args.length === 3 && args[0] instanceof Vec3) {
            const [pos, u, v] = args;
            this.pos = pos;
            this.u = u;
            this.v = v;
        }
        else {
            throw new Error("Invalid arguments for Vertex constructor");
        }
    }

    remap(u, v) {
        return new Vertex(this, u, v);
    }

    get x() { return this.pos.x; }
    get y() { return this.pos.y; }
    get z() { return this.pos.z; }

    toString() {
        return `Vertex(pos=${this.pos}, u=${this.u}, v=${this.v})`;
    }
}

class Polygon {
    constructor(vertices, u0 = null, v0 = null, u1 = null, v1 = null) {
        this.vertices = vertices.slice();
        this.vertexCount = vertices.length;

        if (u0 !== null && v0 !== null && u1 !== null && v1 !== null) {
            this.vertices[0] = this.vertices[0].remap(u1, v0);
            this.vertices[1] = this.vertices[1].remap(u0, v0);
            this.vertices[2] = this.vertices[2].remap(u0, v1);
            this.vertices[3] = this.vertices[3].remap(u1, v1);
        }
    }

    getVerticesAndUVs() {
        const positions = [];
        const uvs = [];

        const indices = [0, 1, 2, 0, 2, 3];

        for (const i of indices) {
            const v = this.vertices[i];
            positions.push(v.x, v.y, v.z);
            uvs.push(v.u / 64.0, v.v / 32.0);
        }

        return { positions, uvs };
    }

    debugPrint() {
        for (let i = 3; i >= 0; i--) {
            const v = this.vertices[i];
            console.log(`  Vertex ${i}: (${v.x}, ${v.y}, ${v.z}), UV: (${v.u}, ${v.v})`);
        }
    }
}

class Cube {
    constructor(xTexOffs = 0, yTexOffs = 0) {
        this.xTexOffs = xTexOffs;
        this.yTexOffs = yTexOffs;

        this.vertices = [];
        this.polygons = [];

        this.x = 0; this.y = 0; this.z = 0;
        this.xRot = 0; this.yRot = 0; this.zRot = 0;

        this.mesh = null;
        this.group = null;
    }

    addBox(x0, y0, z0, w, h, d) {
        this.vertices = [];
        this.polygons = [];

        const x1 = x0 + w;
        const y1 = y0 + h;
        const z1 = z0 + d;

        const u0 = new Vertex(x0, y0, z0, 0.0, 0.0);
        const u1 = new Vertex(x1, y0, z0, 0.0, 8.0);
        const u2 = new Vertex(x1, y1, z0, 8.0, 8.0);
        const u3 = new Vertex(x0, y1, z0, 8.0, 0.0);
        const l0 = new Vertex(x0, y0, z1, 0.0, 0.0);
        const l1 = new Vertex(x1, y0, z1, 0.0, 8.0);
        const l2 = new Vertex(x1, y1, z1, 8.0, 8.0);
        const l3 = new Vertex(x0, y1, z1, 8.0, 0.0);

        this.vertices.push(u0, u1, u2, u3, l0, l1, l2, l3);

        this.polygons.push(
            new Polygon([l1, u1, u2, l2], this.xTexOffs + d + w, this.yTexOffs + d, this.xTexOffs + d + w + d, this.yTexOffs + d + h),
            new Polygon([u0, l0, l3, u3], this.xTexOffs + 0, this.yTexOffs + d, this.xTexOffs + d, this.yTexOffs + d + h),
            new Polygon([l1, l0, u0, u1], this.xTexOffs + d, this.yTexOffs + 0, this.xTexOffs + d + w, this.yTexOffs + d),
            new Polygon([u2, u3, l3, l2], this.xTexOffs + d + w, this.yTexOffs + 0, this.xTexOffs + d + w + w, this.yTexOffs + d),
            new Polygon([u1, u0, u3, u2], this.xTexOffs + d, this.yTexOffs + d, this.xTexOffs + d + w, this.yTexOffs + d + h),
            new Polygon([l0, l1, l2, l3], this.xTexOffs + d + w + d, this.yTexOffs + d, this.xTexOffs + d + w + d + w, this.yTexOffs + d + h)
        );
    }

    setPos(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        if (this.group) {
            this.group.position.set(this.x, this.y, this.z);
        }
    }

    createMesh(texture, parentGroup) {
        if (!texture) throw new Error("Cube.createMesh: texture required");
        if (!parentGroup) throw new Error("Cube.createMesh: parentGroup required");

        this.group = new THREE.Group();
        parentGroup.add(this.group);

        const positions = [];
        const uvs = [];
        const indices = [];
        let vertexIndex = 0;

        const faceIndices = [0, 1, 2, 0, 2, 3];

        for (const poly of this.polygons) {
            const polyVertices = poly.vertices;

            for (const offset of faceIndices) {
                indices.push(vertexIndex + offset);
            }

            const uValues = polyVertices.map(v => v.u);
            const vValues = polyVertices.map(v => v.v);
            const minU = Math.min(...uValues);
            const maxU = Math.max(...uValues);
            const minV = Math.min(...vValues);
            const maxV = Math.max(...vValues);

            for (const v of polyVertices) {
                positions.push(v.pos.x, v.pos.y, v.pos.z);

                let u = v.u;
                let vOrig = v.v;

                const pad = 0.005;

                if (u === minU) u += pad;
                if (u === maxU) u -= pad;
                if (vOrig === minV) vOrig += pad;
                if (vOrig === maxV) vOrig -= pad;

                let uFinal = u / 64.0;
                let vFinal = 1.0 - (vOrig / 32.0);

                uvs.push(uFinal, vFinal);
            }

            vertexIndex += 4;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
            transparent: true,
            alphaTest: 0.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.group.add(this.mesh);

        if (this.x !== 0 || this.y !== 0 || this.z !== 0) {
            this.group.position.set(this.x, this.y, this.z);
        }
    }

    render() {
        if (!this.group) return;

        this.group.position.set(this.x, this.y, this.z);

        this.group.rotation.order = 'ZYX';
        this.group.rotation.set(this.xRot, this.yRot, this.zRot);
    }
}

class Entity {
    constructor(level) {
        this.level = level;

        this.xo = 0;
        this.yo = 0;
        this.zo = 0;

        this.x = 0;
        this.y = 0;
        this.z = 0;

        this.heightOffset = 0;

        this.xd = 0;
        this.yd = 0;
        this.zd = 0;

        this.yRot = 0;
        this.xRot = 0;

        this.bb = null;
        this.onGround = false;
        this.horizontalCollision = false;

        this.removed = false;

        this.bbWidth = 0.6;
        this.bbHeight = 1.8;

        this.resetPos();
    }

    resetPos() {
        const x = Math.random() * (this.level.width - 2) + 1.0;
        const y = (this.level.depth + 10);
        const z = Math.random() * (this.level.height - 2) + 1.0;
        this.setPos(x, y, z);
    }

    setPos(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        const w = this.bbWidth / 2.0;
        const h = this.bbHeight / 2.0;
        this.bb = new AABB(x - w, y - h, z - w, x + w, y + h, z + w);
    }

    remove() {
        this.removed = true;
    }

    setSize(w, h) {
        this.bbWidth = w;
        this.bbHeight = h;
    }

    turn(xo, yo) {
        this.yRot = (this.yRot + xo * 0.15);
        this.xRot = (this.xRot - yo * 0.15);
        if (this.xRot < -90.0)
            this.xRot = -90.0;
        if (this.xRot > 90.0)
            this.xRot = 90.0;
    }

    isFree(xa, ya, za) {
        const box = this.bb.cloneMove(xa, ya, za);
        const aABBs = this.level.getCubes(box);
        if (aABBs.length > 0) return false;
        if (this.level.containsAnyLiquid(box)) return false;

        return true;
    }

    isInWater() {
        return this.level.containsLiquid(this.bb.grow(0.0, -0.4, 0.0), 1);
    }

    isInLava() {
        return this.level.containsLiquid(this.bb, 2);
    }

    tick() {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;
    }

    move(xa, ya, za) {
        let xaOrg = xa;
        let yaOrg = ya;
        let zaOrg = za;

        const aABBs = this.level.getCubes(this.bb.expand(xa, ya, za));

        for (let i = 0; i < aABBs.length; i++) {
            ya = aABBs[i].clipYCollide(this.bb, ya);
        }
        this.bb.move(0, ya, 0);

        for (let i = 0; i < aABBs.length; i++) {
            xa = aABBs[i].clipXCollide(this.bb, xa);
        }
        this.bb.move(xa, 0, 0);

        for (let i = 0; i < aABBs.length; i++) {
            za = aABBs[i].clipZCollide(this.bb, za);
        }
        this.bb.move(0, 0, za);

        this.horizontalCollision = !(xaOrg == xa && zaOrg == za);
        this.onGround = (yaOrg !== ya && yaOrg < 0.0);

        if (xaOrg !== xa) this.xd = 0;
        if (yaOrg !== ya) this.yd = 0;
        if (zaOrg !== za) this.zd = 0;

        this.x = (this.bb.x0 + this.bb.x1) / 2;
        this.y = this.bb.y0 + this.heightOffset;
        this.z = (this.bb.z0 + this.bb.z1) / 2;
    }

    moveRelative(xa, za, speed) {
        let dist = xa * xa + za * za;
        if (dist < 0.01)
            return;
        dist = speed / Math.sqrt(dist);
        xa *= dist;
        za *= dist;

        let sin = Math.sin(this.yRot * Math.PI / 180);
        let cos = Math.cos(this.yRot * Math.PI / 180);
        this.xd += xa * cos + za * sin;
        this.zd += za * cos - xa * sin;
    }

    isLit(isHumanoid = false) {
        const xTile = Math.floor(this.x);
        const yTile = Math.floor(this.y);
        const zTile = Math.floor(this.z);
        if (isHumanoid) {
            return (this.level.isLit(xTile, yTile, zTile) || this.level.isLit(xTile, yTile + 1, zTile));
        } else {
            return (this.level.isLit(xTile, yTile, zTile));
        }
    }
}

const SteveTexture = Textures.loadTexture('./assets/textures/char.png');

SteveTexture.magFilter = THREE.NearestFilter;
SteveTexture.minFilter = THREE.NearestFilter;
SteveTexture.generateMipmaps = false;
SteveTexture.flipY = true;

class ZombieModel {
    constructor(scene) {
        this.scene = scene;

        const texture = SteveTexture;

        this.group = new THREE.Group();

        this.scene.add(this.group);

        this.head = new Cube(0, 0);
        this.head.addBox(-4, -8, -4, 8, 8, 8);

        this.body = new Cube(16, 16);
        this.body.addBox(-4, 0, -2, 8, 12, 4);

        this.arm0 = new Cube(40, 16);
        this.arm0.addBox(-3, -2, -2, 4, 12, 4);
        this.arm0.setPos(-5, 2, 0);

        this.arm1 = new Cube(40, 16);
        this.arm1.addBox(-1, -2, -2, 4, 12, 4);
        this.arm1.setPos(5, 2, 0);

        this.leg0 = new Cube(0, 16);
        this.leg0.addBox(-2, 0, -2, 4, 12, 4);
        this.leg0.setPos(-2, 12, 0);

        this.leg1 = new Cube(0, 16);
        this.leg1.addBox(-2, 0, -2, 4, 12, 4);
        this.leg1.setPos(2, 12, 0);

        this.head.createMesh(texture, this.group);
        this.body.createMesh(texture, this.group);
        this.arm0.createMesh(texture, this.group);
        this.arm1.createMesh(texture, this.group);
        this.leg0.createMesh(texture, this.group);
        this.leg1.createMesh(texture, this.group);
    }

    render(time) {
        this.head.yRot = Math.sin(time * 0.83) * 1.0;
        this.head.xRot = Math.sin(time) * 0.8;
        this.arm0.xRot = Math.sin(time * 0.6662 + Math.PI) * 2.0;
        this.arm0.zRot = (Math.sin(time * 0.2312) + 1.0) * 1.0;
        this.arm1.xRot = Math.sin(time * 0.6662) * 2.0;
        this.arm1.zRot = (Math.sin(time * 0.2812) - 1.0) * 1.0;
        this.leg0.xRot = Math.sin(time * 0.6662) * 1.4;
        this.leg1.xRot = Math.sin(time * 0.6662 + Math.PI) * 1.4;

        this.head.render();
        this.body.render();
        this.arm0.render();
        this.arm1.render();
        this.leg0.render();
        this.leg1.render();
    }
}

class Zombie extends Entity {
    constructor(level, x, y, z, scene) {
        super(level);

        this.x = x;
        this.y = y;
        this.z = z;

        super.setPos(x, y, z)

        this.rotA = (Math.random() + 1) * 0.01;

        this.timeOffs = Math.random() * 1239813;
        this.rot = Math.random() * Math.PI * 2;
        this.speed = 1.0;

        this.currentBrightness = 0.1;

        this.model = new ZombieModel(scene);
        this.group = this.model.group;
    }

    tick() {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;

        let xa = 0;
        let za = 0;

        this.rot += this.rotA;
        this.rotA *= 0.99;
        this.rotA += (Math.random() - Math.random()) * Math.random() * Math.random() * 0.01;

        xa = Math.sin(this.rot);
        za = Math.cos(this.rot);

        if (this.onGround && Math.random() < 0.01) {
            this.yd = 0.5;
        }

        this.moveRelative(
            xa,
            za,
            this.onGround ? 0.1 : 0.02
        );

        this.yd -= 0.08;

        this.move(this.xd, this.yd, this.zd);

        const groundFriction = (this.onGround ? 0.546 : 0.91) * this.speed;

        this.xd *= groundFriction;
        this.zd *= groundFriction;
        this.yd *= 0.98;

        if (this.y < -100.0) super.remove();
    }

    render(a) {
        const time = (performance.now() / 1000) * 10 * this.speed + this.timeOffs;

        let brightness = super.isLit(true) ? 1.0 : 0.3;

        if (brightness != this.currentBrightness) {
            this.currentBrightness = brightness;

            this.group.traverse((child) => {
                if (child.isMesh) {
                    child.material.color.setRGB(this.currentBrightness, this.currentBrightness, this.currentBrightness);
                }
            });
        }

        const x = this.xo + (this.x - this.xo) * a;
        const y = this.yo + (this.y - this.yo) * a;
        const z = this.zo + (this.z - this.zo) * a;

        this.group.position.set(x, y, z);

        const size = 0.058333334;
        const yy = -Math.abs(Math.sin(time * 0.6662)) * 5.0 - 23.0;

        this.group.scale.set(size, -size, size);

        this.group.position.y += yy * size + 3;

        this.group.rotation.y = this.rot + Math.PI;

        this.model.render(time);
    }
}

class Particle extends Entity {
    constructor(level, x, y, z, xa, ya, za, tex) {
        super(level);
        this.tex = tex;

        this.setSize(0.2, 0.2);
        this.heightOffset = this.bbHeight / 2.0;
        this.setPos(x, y, z);

        this.xd = xa + (Math.random() * 2.0 - 1.0) * 0.4;
        this.yd = ya + (Math.random() * 2.0 - 1.0) * 0.4;
        this.zd = za + (Math.random() * 2.0 - 1.0) * 0.4;

        const speed = (Math.random() + Math.random() + 1.0) * 0.15;
        const dd = Math.sqrt(this.xd * this.xd + this.yd * this.yd + this.zd * this.zd);

        this.xd = (this.xd / dd) * speed * 0.4;
        this.yd = (this.yd / dd) * speed * 0.4 + 0.1;
        this.zd = (this.zd / dd) * speed * 0.4;

        this.uo = Math.random() * 3.0;
        this.vo = Math.random() * 3.0;

        this.size = Math.random() * 0.5 + 0.5;

        this.lifetime = Math.floor(4.0 / (Math.random() * 0.9 + 0.1));
        this.age = 0;
    }

    tick() {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;

        if (this.age++ >= this.lifetime) {
            this.removed = true;
            return;
        }

        this.yd -= 0.04;
        this.move(this.xd, this.yd, this.zd);

        this.xd *= 0.98;
        this.yd *= 0.98;
        this.zd *= 0.98;

        if (this.onGround) {
            this.xd *= 0.7;
            this.zd *= 0.7;
        }
    }

    render(t, a, xa, za, yxa, yya, yza) {
        const uvStep = 0.015609375;

        const u0 = ((this.tex % 16) + this.uo / 4.0) / 16.0;
        const u1 = u0 + uvStep;
        const v0 = (Math.floor(this.tex / 16) + this.vo / 4.0) / 16.0;
        const v1 = v0 + uvStep;

        const r = 0.1 * this.size;

        const px = this.xo + (this.x - this.xo) * a;
        const py = this.yo + (this.y - this.yo) * a;
        const pz = this.zo + (this.z - this.zo) * a;

        const brightness = this.level.getBrightness(Math.floor(px), Math.floor(py), Math.floor(pz));
        t.color(brightness, brightness, brightness);

        t.vertexUV(px - xa * r - yxa * r, py - yya * r, pz - za * r - yza * r, u0, v1);
        t.vertexUV(px - xa * r + yxa * r, py + yya * r, pz - za * r + yza * r, u0, v0);
        t.vertexUV(px + xa * r + yxa * r, py + yya * r, pz + za * r + yza * r, u1, v0);
        t.vertexUV(px + xa * r - yxa * r, py - yya * r, pz + za * r - yza * r, u1, v1);
    }
}

class ParticleEngine {
    constructor(level, scene, texture) {
        this.level = level;
        this.particles = [];
        this.tesselator = new Tesselator();

        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.1
        });

        this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
        scene.add(this.mesh);
    }

    add(x, y, z, xd, yd, zd, blockId) {
        let tex = 1;
        const tile = Tile.tiles[blockId];
        if (tile) tex = tile.tex;

        this.particles.push(new Particle(this.level, x, y, z, xd, yd, zd, tex));
    }

    tick() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.tick();

            if (p.removed) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(player, a) {
        if (this.particles.length === 0) {
            if (this.mesh.geometry.attributes.position) {
                this.mesh.geometry.dispose();
                this.mesh.geometry = new THREE.BufferGeometry();
            }
            return;
        }

        const yRad = player.yRot * Math.PI / 180.0;
        const xRad = player.xRot * Math.PI / 180.0;

        const cosY = Math.cos(yRad);
        const sinY = Math.sin(yRad);
        const cosX = Math.cos(xRad);
        const sinX = Math.sin(xRad);

        const xa = cosY;
        const za = -sinY;

        const yxa = sinY * sinX;
        const yya = cosX;
        const yza = cosY * sinX;

        this.tesselator.init();

        for (const p of this.particles) {
            p.render(this.tesselator, a, xa, za, yxa, yya, yza);
        }

        const newGeo = this.tesselator.flush();
        if (newGeo) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = newGeo;
        }
    }
}

class HitResult {
    constructor(x, y, z, o, f) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.o = o;
        this.f = f;
    }
}

class Frustum {
    static _instance = new Frustum();

    constructor() {
        this.m_Frustum = Array.from({ length: 6 }, () => new Float32Array(4));

        this.proj = new Float32Array(16);
        this.modl = new Float32Array(16);
        this.clip = new Float32Array(16);
    }

    static RIGHT = 0;
    static LEFT = 1;
    static BOTTOM = 2;
    static TOP = 3;
    static BACK = 4;
    static FRONT = 5;

    static getFrustum(customProjMatrix, customModlMatrix) {
        if (customProjMatrix && customModlMatrix) {
            Frustum._instance.calculateFrustum(customProjMatrix, customModlMatrix);
        } else { }
        return Frustum._instance;
    }

    normalizePlane(side) {
        const f = this.m_Frustum[side];
        const magnitude = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);

        f[0] /= magnitude;
        f[1] /= magnitude;
        f[2] /= magnitude;
        f[3] /= magnitude;
    }

    calculateFrustum(projectionMatrix, modelViewMatrix) {
        this.proj.set(projectionMatrix);
        this.modl.set(modelViewMatrix);

        const modl = this.modl;
        const proj = this.proj;
        const clip = this.clip;

        clip[0] = modl[0] * proj[0] + modl[1] * proj[4] + modl[2] * proj[8] + modl[3] * proj[12];
        clip[1] = modl[0] * proj[1] + modl[1] * proj[5] + modl[2] * proj[9] + modl[3] * proj[13];
        clip[2] = modl[0] * proj[2] + modl[1] * proj[6] + modl[2] * proj[10] + modl[3] * proj[14];
        clip[3] = modl[0] * proj[3] + modl[1] * proj[7] + modl[2] * proj[11] + modl[3] * proj[15];

        clip[4] = modl[4] * proj[0] + modl[5] * proj[4] + modl[6] * proj[8] + modl[7] * proj[12];
        clip[5] = modl[4] * proj[1] + modl[5] * proj[5] + modl[6] * proj[9] + modl[7] * proj[13];
        clip[6] = modl[4] * proj[2] + modl[5] * proj[6] + modl[6] * proj[10] + modl[7] * proj[14];
        clip[7] = modl[4] * proj[3] + modl[5] * proj[7] + modl[6] * proj[11] + modl[7] * proj[15];

        clip[8] = modl[8] * proj[0] + modl[9] * proj[4] + modl[10] * proj[8] + modl[11] * proj[12];
        clip[9] = modl[8] * proj[1] + modl[9] * proj[5] + modl[10] * proj[9] + modl[11] * proj[13];
        clip[10] = modl[8] * proj[2] + modl[9] * proj[6] + modl[10] * proj[10] + modl[11] * proj[14];
        clip[11] = modl[8] * proj[3] + modl[9] * proj[7] + modl[10] * proj[11] + modl[11] * proj[15];

        clip[12] = modl[12] * proj[0] + modl[13] * proj[4] + modl[14] * proj[8] + modl[15] * proj[12];
        clip[13] = modl[12] * proj[1] + modl[13] * proj[5] + modl[14] * proj[9] + modl[15] * proj[13];
        clip[14] = modl[12] * proj[2] + modl[13] * proj[6] + modl[14] * proj[10] + modl[15] * proj[14];
        clip[15] = modl[12] * proj[3] + modl[13] * proj[7] + modl[14] * proj[11] + modl[15] * proj[15];

        this.m_Frustum[0][0] = clip[3] - clip[0];
        this.m_Frustum[0][1] = clip[7] - clip[4];
        this.m_Frustum[0][2] = clip[11] - clip[8];
        this.m_Frustum[0][3] = clip[15] - clip[12];
        this.normalizePlane(0);

        this.m_Frustum[1][0] = clip[3] + clip[0];
        this.m_Frustum[1][1] = clip[7] + clip[4];
        this.m_Frustum[1][2] = clip[11] + clip[8];
        this.m_Frustum[1][3] = clip[15] + clip[12];
        this.normalizePlane(1);

        this.m_Frustum[2][0] = clip[3] + clip[1];
        this.m_Frustum[2][1] = clip[7] + clip[5];
        this.m_Frustum[2][2] = clip[11] + clip[9];
        this.m_Frustum[2][3] = clip[15] + clip[13];
        this.normalizePlane(2);

        this.m_Frustum[3][0] = clip[3] - clip[1];
        this.m_Frustum[3][1] = clip[7] - clip[5];
        this.m_Frustum[3][2] = clip[11] - clip[9];
        this.m_Frustum[3][3] = clip[15] - clip[13];
        this.normalizePlane(3);

        this.m_Frustum[4][0] = clip[3] - clip[2];
        this.m_Frustum[4][1] = clip[7] - clip[6];
        this.m_Frustum[4][2] = clip[11] - clip[10];
        this.m_Frustum[4][3] = clip[15] - clip[14];
        this.normalizePlane(4);

        this.m_Frustum[5][0] = clip[3] + clip[2];
        this.m_Frustum[5][1] = clip[7] + clip[6];
        this.m_Frustum[5][2] = clip[11] + clip[10];
        this.m_Frustum[5][3] = clip[15] + clip[14];
        this.normalizePlane(5);
    }

    cubeInFrustum(x1, y1, z1, x2, y2, z2) {
        for (let i = 0; i < 6; i++) {
            const f = this.m_Frustum[i];
            if (
                f[0] * x1 + f[1] * y1 + f[2] * z1 + f[3] > 0 ||
                f[0] * x2 + f[1] * y1 + f[2] * z1 + f[3] > 0 ||
                f[0] * x1 + f[1] * y2 + f[2] * z1 + f[3] > 0 ||
                f[0] * x2 + f[1] * y2 + f[2] * z1 + f[3] > 0 ||
                f[0] * x1 + f[1] * y1 + f[2] * z2 + f[3] > 0 ||
                f[0] * x2 + f[1] * y1 + f[2] * z2 + f[3] > 0 ||
                f[0] * x1 + f[1] * y2 + f[2] * z2 + f[3] > 0 ||
                f[0] * x2 + f[1] * y2 + f[2] * z2 + f[3] > 0
            ) {
                continue;
            }
            return false;
        }
        return true;
    }

    isVisible(aabb) {
        return this.cubeInFrustum(aabb.x0, aabb.y0, aabb.z0, aabb.x1, aabb.y1, aabb.z1);
    }
}

class Coord {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class LevelGen {
    constructor(levelGenScreen) {
        this.random = new JavaRandom();
        this.coords = new Int32Array(1048576);

        this.levelGenScreen = levelGenScreen;

        this.width = 0;
        this.height = 0;
        this.depth = 0;
        this.blocks = null;
    }

    async generateLevel(level, userName, width, height, depth) {
        console.log(`Generating level`);

        this.levelGenScreen.setTitle("Generating level");
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        await sleep(200);

        this.width = width;
        this.height = height;
        this.depth = depth;

        this.blocks = new Uint8Array(width * height * depth);

        console.log(`Raising..`);
        this.levelGenScreen.setStatus("Raising..", 0);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        const heightMap = this.buildHeightmap(width, height);
        await sleep(20);
        console.log(`Eroding..`);
        this.levelGenScreen.setStatus("Eroding..", 20);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.buildBlocks(heightMap);
        await sleep(20);
        console.log(`Carving..`);
        this.levelGenScreen.setStatus("Carving..", 40);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.carveTunnels();
        await sleep(20);
        console.log(`Watering..`);
        this.levelGenScreen.setStatus("Watering..", 60);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.addWater();
        await sleep(20);
        console.log(`Melting..`);
        this.levelGenScreen.setStatus("Melting..", 80);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.addLava();
        await sleep(20);
        this.levelGenScreen.setStatus("Completing..", 100);
        this.levelGenScreen.render(0, 0, this.levelGenScreen.minecraft.guiCanvas.width, this.levelGenScreen.minecraft.guiCanvas.height);
        this.levelGenScreen.minecraft.levelRenderer.compileSurroundingGround();
        this.levelGenScreen.minecraft.levelRenderer.compileSurroundingWater();
        await sleep(20);

        if (typeof level.setData === "function") {
            level.setData(width, depth, height, this.blocks);
        } else {
            level.blocks = this.blocks;
        }

        level.createTime = Date.now();
        level.creator = userName;
        level.name = "A Nice World";

        return true;
    }

    buildHeightmap(width, height) {
        return new Float64Array(width * height);
    }

    buildBlocks(heightMap) {
        const w = this.width;
        const h = this.height;
        const d = this.depth;

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < d; y++) {
                for (let z = 0; z < h; z++) {
                    const dh = Math.trunc(d / 2);
                    const rh = Math.trunc(d / 3);

                    const i = (y * h + z) * w + x;
                    let id = 0;

                    if (y === dh && y >= Math.trunc(d / 2) - 1) {
                        id = Tile.grass.id;
                    } else if (y <= dh) {
                        id = Tile.dirt.id;
                    }
                    if (y <= rh) {
                        id = Tile.rock.id;
                    }
                    this.blocks[i] = id;
                }
            }
        }
    }

    carveTunnels() {
        const w = this.width;
        const h = this.height;
        const d = this.depth;
        const count = Math.trunc((w * h * d) / 256 / 64);

        for (let i = 0; i < count; i++) {
            let x = this.random.nextFloat() * w;
            let y = this.random.nextFloat() * d;
            let z = this.random.nextFloat() * h;

            const length = Math.trunc(this.random.nextFloat() + this.random.nextFloat() * 150.0);
            let dir1 = this.random.nextFloat() * Math.PI * 2.0;
            let dira1 = 0.0;
            let dir2 = this.random.nextFloat() * Math.PI * 2.0;
            let dira2 = 0.0;

            for (let l = 0; l < length; l++) {
                x += Math.sin(dir1) * Math.cos(dir2);
                z += Math.cos(dir1) * Math.cos(dir2);
                y += Math.sin(dir2);

                dir1 += dira1 * 0.2;
                dira1 *= 0.9;
                dira1 += this.random.nextFloat() - this.random.nextFloat();

                dir2 += dira2 * 0.5;
                dir2 *= 0.5;
                dira2 *= 0.9;
                dira2 += this.random.nextFloat() - this.random.nextFloat();

                const size = Math.sin((l * Math.PI) / length) * 2.5 + 1.0;

                const xStart = Math.trunc(x - size);
                const xEnd = Math.trunc(x + size);
                const yStart = Math.trunc(y - size);
                const yEnd = Math.trunc(y + size);
                const zStart = Math.trunc(z - size);
                const zEnd = Math.trunc(z + size);

                for (let xx = xStart; xx <= xEnd; xx++) {
                    for (let yy = yStart; yy <= yEnd; yy++) {
                        for (let zz = zStart; zz <= zEnd; zz++) {
                            const xd = xx - x;
                            const yd = yy - y;
                            const zd = zz - z;
                            const dd = xd * xd + yd * yd * 2.0 + zd * zd;

                            if (dd < size * size && xx >= 1 && yy >= 1 && zz >= 1 && xx < w - 1 && yy < d - 1 && zz < h - 1) {
                                const ii = (yy * h + zz) * w + xx;
                                if (this.blocks[ii] === Tile.rock.id) {
                                    this.blocks[ii] = 0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    addWater() {
        const before = performance.now();
        let tiles = 0;
        const source = 0;
        const target = Tile.calmWater.id;
        const halfDepth = Math.trunc(this.depth / 2) - 1;

        for (let x = 0; x < this.width; x++) {
            tiles += this.floodFillLiquid(x, halfDepth, 0, source, target);
            tiles += this.floodFillLiquid(x, halfDepth, this.height - 1, source, target);
        }
        for (let z = 0; z < this.height; z++) {
            tiles += this.floodFillLiquid(0, halfDepth, z, source, target);
            tiles += this.floodFillLiquid(this.width - 1, halfDepth, z, source, target);
        }

        const count = Math.trunc((this.width * this.height) / 5000);
        for (let i = 0; i < count; i++) {
            let j = this.random.nextInt(this.width);
            let k = halfDepth;
            let z = this.random.nextInt(this.height);
            if (this.blocks[(k * this.height + z) * this.width + j] === 0) {
                tiles += this.floodFillLiquid(j, k, z, 0, target);
            }
        }
        const after = performance.now();
        console.log("Flood filled " + tiles + " tiles in " + (after - before) + " ms");
    }

    addLava() {
        let lavaCount = 0;
        const count = Math.trunc((this.width * this.height * this.depth) / 10000);
        for (let i = 0; i < count; i++) {
            const x = this.random.nextInt(this.width);
            const y = this.random.nextInt(Math.trunc(this.depth / 2));
            const z = this.random.nextInt(this.height);
            if (this.blocks[(y * this.height + z) * this.width + x] === 0) {
                lavaCount++;
                this.floodFillLiquid(x, y, z, 0, Tile.calmLava.id);
            }
        }
        console.log("LavaCount: " + lavaCount);
    }

    floodFillLiquid(x, y, z, source, tt) {
        let target = tt;
        let coordBuffer = [];
        let p = 0;
        let wBits = 1, hBits = 1;
        while ((1 << wBits) < this.width) wBits++;
        while ((1 << hBits) < this.height) hBits++;

        let hMask = this.height - 1;
        let wMask = this.width - 1;

        if (!this.coords || this.coords.length !== 1048576) {
            this.coords = new Int32Array(1048576);
        }

        this.coords[p++] = ((((y << hBits) + z) << wBits) + x) | 0;
        let tiles = 0;
        let upStep = this.width * this.height;

        while (p > 0) {
            let cl = this.coords[--p] | 0;
            if (p === 0 && coordBuffer.length > 0) {
                console.log("IT HAPPENED!");
                this.coords = coordBuffer.pop();
                p = this.coords.length;
            }

            let z0 = (cl >> wBits) & hMask;
            let y0 = (cl >>> (wBits + hBits)) | 0;
            let x0 = cl & wMask;
            let x1 = x0;

            while (x0 > 0 && this.blocks[cl - 1] === source) {
                x0--;
                cl--;
            }
            while (x1 < this.width && this.blocks[cl + x1 - x0] === source) {
                x1++;
            }

            let z1 = (cl >> wBits) & hMask;
            let y1 = (cl >>> (wBits + hBits)) | 0;
            if (z1 !== z0 || y1 !== y0) {
                console.log("hoooly fuck");
            }

            let lastNorth = false;
            let lastSouth = false;
            let lastBelow = false;
            tiles += (x1 - x0);

            for (let xx = x0; xx < x1; xx++) {
                this.blocks[cl] = target;
                if (z0 > 0) {
                    let north = (this.blocks[cl - this.width] === source);
                    if (north && !lastNorth) {
                        if (p === this.coords.length) {
                            coordBuffer.push(this.coords);
                            this.coords = new Int32Array(1048576);
                            p = 0;
                        }
                        this.coords[p++] = (cl - this.width) | 0;
                    }
                    lastNorth = north;
                }
                if (z0 < this.height - 1) {
                    let south = (this.blocks[cl + this.width] === source);
                    if (south && !lastSouth) {
                        if (p === this.coords.length) {
                            coordBuffer.push(this.coords);
                            this.coords = new Int32Array(1048576);
                            p = 0;
                        }
                        this.coords[p++] = (cl + this.width) | 0;
                    }
                    lastSouth = south;
                }
                if (y0 > 0) {
                    let belowId = this.blocks[cl - upStep];
                    if (target === Tile.lava.id || target === Tile.calmLava.id) {
                        if (belowId === Tile.water.id || belowId === Tile.calmWater.id) {
                            this.blocks[cl - upStep] = Tile.rock.id;
                        }
                    }
                    let below = (belowId === source);
                    if (below && !lastBelow) {
                        if (p === this.coords.length) {
                            coordBuffer.push(this.coords);
                            this.coords = new Int32Array(1048576);
                            p = 0;
                        }
                        this.coords[p++] = (cl - upStep) | 0;
                    }
                    lastBelow = below;
                }
                cl++;
            }
        }
        return tiles;
    }
}

class Level {
    constructor(w, h, d, seed) {
        this.TILE_UPDATE_INTERVAL = 200;

        this.width = w;
        this.height = h;
        this.depth = d;

        this.name = "";
        this.creator = "";
        this.seed = seed;

        this.random = new JavaRandom(this.seed);
        this.randValue = this.random.nextInt();

        this.tickBlocks = [];
        this.tickBlocksMap = new Map();

        this.multiplier = 1664525;
        this.addend = 1013904223;

        this.texture = Textures.loadTexture("./assets/textures/terrain.png");
        this.texture.flipY = true;
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;
        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5
        });

        this.unprocessed = 0;

        this.blocks = new Uint8Array(w * h * d);
        this.lightDepths = new Int32Array(w * h);
        this.metadata = new Uint8Array(w * h * d);
        this.levelListeners = [];

        this.particleEngine;

        this.calcLightDepths(0, 0, this.width, this.height);

        for (let i = 0; i < this.levelListeners.length; i++) this.levelListeners.get[i].allChanged();
    }

    initTickBlocks() {
        this.tickBlocks = [];
        this.tickBlocksMap.clear();

        for (let y = 0; y < this.depth; y++) {
            for (let z = 0; z < this.height; z++) {
                for (let x = 0; x < this.width; x++) {
                    const blockId = this.getTile(x, y, z);
                    if (blockId !== 0 && Tile.tiles[blockId] && Tile.tiles[blockId].shouldTick) {
                        this.addTickBlock(x, y, z);
                    }
                }
            }
        }
    }

    addTickBlock(x, y, z) {
        const idx = (y * this.height + z) * this.width + x;
        if (!this.tickBlocksMap.has(idx)) {
            this.tickBlocks.push(idx);
            this.tickBlocksMap.set(idx, this.tickBlocks.length - 1);
        }
    }

    removeTickBlock(x, y, z) {
        const idx = (y * this.height + z) * this.width + x;
        if (this.tickBlocksMap.has(idx)) {
            const pos = this.tickBlocksMap.get(idx);
            const lastIdx = this.tickBlocks[this.tickBlocks.length - 1];

            this.tickBlocks[pos] = lastIdx;
            this.tickBlocksMap.set(lastIdx, pos);

            this.tickBlocks.pop();
            this.tickBlocksMap.delete(idx);
        }
    }

    setData(w, d, h, blocks) {
        this.width = w;
        this.height = h;
        this.depth = d;
        this.blocks = blocks;

        this.lightDepths = new Int32Array(w * h);
        this.calcLightDepths(0, 0, w, h);
        for (let i = 0; i < this.levelListeners.length; i++) {
            this.levelListeners[i].allChanged();
        }
    }

    tick() {
        if (this.tickBlocks.length === 0) return;
        const ticksToProcess = Math.min(this.tickBlocks.length, 1);

        for (let i = 0; i < ticksToProcess; i++) {
            const randPos = this.random.nextInt(this.tickBlocks.length);
            const idx = this.tickBlocks[randPos];

            const x = idx % this.width;
            const remaining = Math.floor(idx / this.width);
            const z = remaining % this.height;
            const y = Math.floor(remaining / this.height);

            const blockId = this.blocks[idx];
            if (blockId !== 0 && Tile.tiles[blockId] && Tile.tiles[blockId].shouldTick) {
                this.tickTile(x, y, z);
            } else {
                this.removeTickBlock(x, y, z);
            }
        }
    }

    tickTile(x, y, z) {
        const tileId = this.getTile(x, y, z);
        const tile = Tile.tiles[tileId];

        if (tile != null) {
            tile.tick(this, x, y, z, this.random);
        }
    }

    generateMap() {
        const w = this.width;
        const h = this.height;
        const d = this.depth;

        const noise_filter = PerlinNoiseFilterBroken

        const filter1 = new noise_filter(0);
        const filter2 = new noise_filter(0);
        const filterCf = new noise_filter(1);
        const filterRock = new noise_filter(1);

        const heightmap1 = filter1.read(w, h, this.random);
        const heightmap2 = filter2.read(w, h, this.random);
        const cf = filterCf.read(w, h, this.random);
        const rockMap = filterRock.read(w, h, this.random);

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < d; y++) {
                for (let z = 0; z < h; z++) {

                    const mapIndex = x + z * w;

                    let dh1 = heightmap1[mapIndex];
                    let dh2 = heightmap2[mapIndex];
                    let cfh = cf[mapIndex];

                    if (cfh < 128) {
                        dh2 = dh1;
                    }

                    let dh = dh1;
                    if (dh2 > dh) {
                        dh = dh2;
                    } else {
                        dh2 = dh1;
                    }

                    dh = Math.floor(dh / 8) + Math.floor(d / 3);

                    let rh = Math.floor(rockMap[mapIndex] / 8) + Math.floor(d / 3);
                    if (rh > dh - 2) {
                        rh = dh - 2;
                    }

                    const i = (y * h + z) * w + x;
                    let id = 0;

                    if (y === dh) id = Tile.grass.id;
                    if (y < dh) id = Tile.dirt.id;
                    if (y <= rh) id = Tile.stoneBrick.id;

                    this.blocks[i] = id;
                }
            }
        }

        let count = Math.floor((w * h * d) / 256 / 64);

        for (let i = 0; i < count; i++) {
            let f1 = this.random.nextFloat() * w;
            let y = this.random.nextFloat() * d;
            let z = this.random.nextFloat() * h;

            let length = Math.floor(this.random.nextFloat() + this.random.nextFloat() * 150.0);
            let dir1 = this.random.nextFloat() * Math.PI * 2.0;
            let dira1 = 0.0;
            let dir2 = this.random.nextFloat() * Math.PI * 2.0;
            let dira2 = 0.0;

            for (let l = 0; l < length; l++) {
                f1 += Math.sin(dir1) * Math.cos(dir2);
                z += Math.cos(dir1) * Math.cos(dir2);
                y += Math.sin(dir2);

                dir1 += dira1 * 0.2;
                dira1 *= 0.9;
                dira1 += this.random.nextFloat() - this.random.nextFloat();

                dir2 += dira2 * 0.5;
                dir2 *= 0.5;
                dira2 *= 0.9;
                dira2 += this.random.nextFloat() - this.random.nextFloat();

                let size = Math.sin((l * Math.PI) / length) * 2.5 + 1.0;

                let minX = Math.floor(f1 - size);
                let maxX = Math.floor(f1 + size);
                let minY = Math.floor(y - size);
                let maxY = Math.floor(y + size);
                let minZ = Math.floor(z - size);
                let maxZ = Math.floor(z + size);

                for (let xx = minX; xx <= maxX; xx++) {
                    for (let yy = minY; yy <= maxY; yy++) {
                        for (let zz = minZ; zz <= maxZ; zz++) {
                            let xd = xx - f1;
                            let yd = yy - y;
                            let zd = zz - z;
                            let dd = xd * xd + yd * yd * 2.0 + zd * zd;

                            if (dd < size * size &&
                                xx >= 1 && yy >= 1 && zz >= 1 &&
                                xx < this.width - 1 && yy < this.depth - 1 && zz < this.height - 1) {

                                let ii = (yy * this.height + zz) * this.width + xx;
                                if (this.blocks[ii] === Tile.stoneBrick.id) {
                                    this.blocks[ii] = 0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    getGroundLevel() {
        return 35.0;
    }

    containsAnyLiquid(box) {
        let x0 = Math.floor(box.x0);
        let x1 = Math.floor((box.x1 + 1.0));
        let y0 = Math.floor(box.y0);
        let y1 = Math.floor((box.y1 + 1.0));
        let z0 = Math.floor(box.z0);
        let z1 = Math.floor((box.z1 + 1.0));
        if (x0 < 0)
            x0 = 0;
        if (y0 < 0)
            y0 = 0;
        if (z0 < 0)
            z0 = 0;
        if (x1 > this.width)
            x1 = this.width;
        if (y1 > this.depth)
            y1 = this.depth;
        if (z1 > this.height)
            z1 = this.height;
        for (let x = x0; x < x1; x++) {
            for (let y = y0; y < y1; y++) {
                for (let z = z0; z < z1; z++) {
                    const tile = Tile.tiles[this.getTile(x, y, z)];
                    if (tile != null && tile.getLiquidType() > 0)
                        return true;
                }
            }
        }
        return false;
    }

    containsLiquid(box, liquidId) {
        let x0 = Math.floor(box.x0);
        let x1 = Math.floor((box.x1 + 1.0));
        let y0 = Math.floor(box.y0);
        let y1 = Math.floor((box.y1 + 1.0));
        let z0 = Math.floor(box.z0);
        let z1 = Math.floor((box.z1 + 1.0));
        if (x0 < 0)
            x0 = 0;
        if (y0 < 0)
            y0 = 0;
        if (z0 < 0)
            z0 = 0;
        if (x1 > this.width)
            x1 = this.width;
        if (y1 > this.depth)
            y1 = this.depth;
        if (z1 > this.height)
            z1 = this.height;
        for (let x = x0; x < x1; x++) {
            for (let y = y0; y < y1; y++) {
                for (let z = z0; z < z1; z++) {
                    const tile = Tile.tiles[this.getTile(x, y, z)];
                    if (tile != null && tile.getLiquidType() == liquidId)
                        return true;
                }
            }
        }
        return false;
    }

    isLightBlocker(x, y, z) {
        const tile = Tile.tiles[this.getTile(x, y, z)];
        if (tile == null) return false;
        return tile.blocksLight();
    }

    calcLightDepths(x0, y0, x1, y1) {
        for (let x = x0; x < x0 + x1; x++) {
            for (let z = y0; z < y0 + y1; z++) {
                let oldDepth = this.lightDepths[x + z * this.width];
                let y = this.depth - 1;
                while (y > 0 && !this.isLightBlocker(x, y, z)) {
                    y--;
                }
                this.lightDepths[x + z * this.width] = y + 1;

                if (oldDepth != y) {
                    let yl0 = (oldDepth < y) ? oldDepth : y;
                    let yl1 = (oldDepth > y) ? oldDepth : y;
                    for (let i = 0; i < this.levelListeners.length; i++)
                        (this.levelListeners[i]).lightColumnChanged(x, z, yl0, yl1);
                }
            }
        }
    }

    getTileMetadata(x, y, z) {
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height) return 0;
        return this.metadata[(y * this.height + z) * this.width + x];
    }

    setTileMetadata(x, y, z, val) {
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height) return;
        const idx = (y * this.height + z) * this.width + x;
        this.metadata[idx] = val;
        this.updateTile(x, y, z);
    }

    getBrightness(x, y, z) {
        const dark = 0.5;
        const light = 1.0;
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height) {
            return light;
        }
        if (y < this.lightDepths[x + z * this.width]) {
            return dark;
        }
        return light;
    }

    addListener(levelListener) {
        this.levelListeners.push(levelListener);
    }

    isTile(x, y, z) {
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height) {
            return false;
        }
        return this.blocks[(y * this.height + z) * this.width + x] === 1;
    }

    getTile(x, y, z) {
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height) {
            return 0;
        }
        return this.blocks[(y * this.height + z) * this.width + x];
    }

    isSolidTile(x, y, z) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.depth || z < 0 || z >= this.height) {
            return false;
        }
        const tileId = this.blocks[(y * this.height + z) * this.width + x];
        const tile = Tile.tiles[tileId];
        return tile ? tile.isSolid() : false;
    }

    setTile(x, y, z, type) {
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height)
            return false;
        const idx = (y * this.height + z) * this.width + x;
        if (type == this.blocks[idx])
            return false;

        const oldType = this.blocks[idx];
        if (Tile.tiles[oldType] && Tile.tiles[oldType].shouldTick) {
            this.removeTickBlock(x, y, z);
        }

        this.blocks[idx] = type;

        if (Tile.tiles[type] && Tile.tiles[type].shouldTick) {
            this.addTickBlock(x, y, z);
        }
        this.neighborChanged(x - 1, y, z, type);
        this.neighborChanged(x + 1, y, z, type);
        this.neighborChanged(x, y - 1, z, type);
        this.neighborChanged(x, y + 1, z, type);
        this.neighborChanged(x, y, z - 1, type);
        this.neighborChanged(x, y, z + 1, type);
        this.calcLightDepths(x, z, 1, 1);
        for (let i = 0; i < this.levelListeners.length; i++)
            (this.levelListeners[i]).tileChanged(x, y, z);
        return true;
    }

    setTileNoUpdate(x, y, z, type) {
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height)
            return false;
        const idx = (y * this.height + z) * this.width + x;
        if (type == this.blocks[idx])
            return false;

        const oldType = this.blocks[idx];
        if (Tile.tiles[oldType] && Tile.tiles[oldType].shouldTick) {
            this.removeTickBlock(x, y, z);
        }

        this.blocks[idx] = type;

        if (Tile.tiles[type] && Tile.tiles[type].shouldTick) {
            this.addTickBlock(x, y, z);
        }
        return true;
    }

    getCubes(box) {
        let boxes = [];
        let x0 = Math.floor(box.x0);
        let x1 = Math.floor((box.x1 + 1.0));
        let y0 = Math.floor(box.y0);
        let y1 = Math.floor((box.y1 + 1.0));
        let z0 = Math.floor(box.z0);
        let z1 = Math.floor((box.z1 + 1.0));
        for (let x = x0; x < x1; x++) {
            for (let y = y0; y < y1; y++) {
                for (let z = z0; z < z1; z++) {
                    if (x >= 0 && y >= 0 && z >= 0 && x < this.width && y < this.depth && z < this.height) {
                        let tile = Tile.tiles[this.getTile(x, y, z)];
                        if (tile != null && tile.isSolid()) {
                            let aabb = tile.getAABB(x, y, z);
                            if (aabb != null)
                                boxes.push(aabb);
                        }
                    } else if (x < 0 || y < 0 || z < 0 || x >= this.width || z >= this.height) {
                        let aabb = Tile.unbreakable.getAABB(x, y, z);
                        if (aabb != null)
                            boxes.push(aabb);
                    }
                }
            }
        }
        return boxes;
    }

    neighborChanged(x, y, z, type) {
        if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.depth || z >= this.height)
            return;
        const tile = Tile.tiles[this.blocks[(y * this.height + z) * this.width + x]];
        if (tile != null)
            tile.neighborChanged(this, x, y, z, type);
    }

    isLit(x, y, z) {
        if (x >= 0 && y >= 0 && z >= 0 && x < this.width && y < this.depth && z < this.height)
            return (y >= this.lightDepths[x + z * this.width]);
        return true;
    }
}

class Chunk {
    static rebuiltThisFrame = 0;
    static updates = 0;

    constructor(level, x0, y0, z0, x1, y1, z1) {
        this.level = level;
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;

        this.x = (this.x0 + this.x1) / 2;
        this.y = (this.y0 + this.y1) / 2;
        this.z = (this.z0 + this.z1) / 2;

        this.aabb = new AABB(this.x0, this.y0, this.z0, this.x1, this.y1, this.z1);
        this.dirty = true;

        this.t = new Tesselator();

        this.texture = level.texture;
        this.material = level.material;

        this.meshes = [new THREE.Mesh(), new THREE.Mesh()];
        this.meshes.forEach(m => m.frustumCulled = true);
    }

    rebuild(layer) {
        //if (Chunk.rebuiltThisFrame >= 2) return;

        this.dirty = false;
        Chunk.updates++;
        Chunk.rebuiltThisFrame++;

        this.t.init();

        for (let x = this.x0; x < this.x1; x++) {
            for (let y = this.y0; y < this.y1; y++) {
                for (let z = this.z0; z < this.z1; z++) {

                    const tileId = this.level.getTile(x, y, z);

                    if (tileId > 0) {
                        const tile = Tile.tiles[tileId];
                        tile.render(this.t, this.level, layer, x, y, z);
                    }
                }
            }
        }

        if (this.meshes[layer].geometry) {
            this.meshes[layer].geometry.dispose();
        }

        if (this.t.vertexCount > 0) {
            const newGeometry = this.t.flush();
            if (newGeometry) {
                this.meshes[layer].geometry = newGeometry;
                this.meshes[layer].material = this.material;
                this.meshes[layer].visible = true;
            } else {
                this.meshes[layer].geometry = new THREE.BufferGeometry();
                this.meshes[layer].visible = false;
            }
        } else {
            this.meshes[layer].geometry = new THREE.BufferGeometry();
            this.meshes[layer].visible = false;
        }
    }

    addQuad(t, x0, y0, z0, u0, v0, x1, y1, z1, u1, v1, x2, y2, z2, u2, v2, x3, y3, z3, u3, v3) {
        t.vertexUV(x0, y0, z0, u0, v0);
        t.vertexUV(x1, y1, z1, u1, v1);
        t.vertexUV(x2, y2, z2, u2, v2);
        t.vertexUV(x3, y3, z3, u3, v3);
    }

    render(layer) {
        if (this.dirty) {
            this.rebuild(0);
            this.rebuild(1);
        }
        this.meshes[layer].visible = this.meshes[layer].geometry.attributes.position !== undefined;
    }

    setDirty() {
        this.dirty = true;
    }

    isDirty() {
        return this.dirty;
    }

    distanceToSqr(player) {
        const xd = player.x - this.x;
        const yd = player.y - this.y;
        const zd = player.z - this.z;
        return xd * xd + yd * yd + zd * zd;
    }
}

class DirtyChunkSorter {
    constructor(player, camera) {
        this.player = player;
        this.now = Date.now();
        this.frustum = new THREE.Frustum();
        if (camera) {
            const projScreenMatrix = new THREE.Matrix4();
            projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(projScreenMatrix);
        }
    }

    compare(c0, c1) {
        const i0 = this.frustum.isVisible ? this.frustum.isVisible(c0.aabb) : true;
        const i1 = this.frustum.isVisible ? this.frustum.isVisible(c1.aabb) : true;

        if (i0 && !i1) return -1;
        if (i1 && !i0) return 1;

        const t0 = Math.floor((this.now - c0.dirtiedTime) / 2000);
        const t1 = Math.floor((this.now - c1.dirtiedTime) / 2000);

        if (t0 < t1) return -1;
        if (t0 > t1) return 1;

        return (c0.distanceToSqr(this.player) < c1.distanceToSqr(this.player)) ? -1 : 1;
    }
}

class LevelRenderer {
    constructor(level, scene) {
        this.CHUNK_SIZE = 16;
        this.level = level;
        this.scene = scene;

        this.xChunks = Math.floor(level.width / this.CHUNK_SIZE);
        this.yChunks = Math.floor(level.depth / this.CHUNK_SIZE);
        this.zChunks = Math.floor(level.height / this.CHUNK_SIZE);

        this.chunks = new Array(this.xChunks * this.yChunks * this.zChunks);

        for (let x = 0; x < this.xChunks; x++) {
            for (let y = 0; y < this.yChunks; y++) {
                for (let z = 0; z < this.zChunks; z++) {
                    let x0 = x * this.CHUNK_SIZE;
                    let y0 = y * this.CHUNK_SIZE;
                    let z0 = z * this.CHUNK_SIZE;
                    let x1 = (x + 1) * this.CHUNK_SIZE;
                    let y1 = (y + 1) * this.CHUNK_SIZE;
                    let z1 = (z + 1) * this.CHUNK_SIZE;

                    if (x1 > level.width) x1 = level.width;
                    if (y1 > level.depth) y1 = level.depth;
                    if (z1 > level.height) z1 = level.height;

                    const chunkIndex = (x + y * this.xChunks) * this.zChunks + z;
                    const newChunk = new Chunk(level, x0, y0, z0, x1, y1, z1);
                    this.chunks[chunkIndex] = newChunk;

                    this.scene.add(newChunk.meshes[0]);
                    this.scene.add(newChunk.meshes[1]);
                }
            }
        }

        level.addListener(this);
    }

    pick(distance = 5.0, camera) {
        const start = new THREE.Vector3().copy(camera.position);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

        let x = Math.floor(start.x);
        let y = Math.floor(start.y);
        let z = Math.floor(start.z);

        const stepX = dir.x > 0 ? 1 : -1;
        const stepY = dir.y > 0 ? 1 : -1;
        const stepZ = dir.z > 0 ? 1 : -1;

        const tDeltaX = Math.abs(1 / dir.x);
        const tDeltaY = Math.abs(1 / dir.y);
        const tDeltaZ = Math.abs(1 / dir.z);

        let tMaxX = (dir.x > 0 ? (x + 1 - start.x) : (start.x - x)) * tDeltaX;
        let tMaxY = (dir.y > 0 ? (y + 1 - start.y) : (start.y - y)) * tDeltaY;
        let tMaxZ = (dir.z > 0 ? (z + 1 - start.z) : (start.z - z)) * tDeltaZ;

        let f = -1;
        let dist = 0;

        if (this.level.getTile(x, y, z) !== 0) {
            return { x: x, y: y, z: z, f: f };
        }

        while (dist < distance) {
            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    dist = tMaxX;
                    tMaxX += tDeltaX;
                    x += stepX;
                    f = stepX > 0 ? 4 : 5;
                } else {
                    dist = tMaxZ;
                    tMaxZ += tDeltaZ;
                    z += stepZ;
                    f = stepZ > 0 ? 2 : 3;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    dist = tMaxY;
                    tMaxY += tDeltaY;
                    y += stepY;
                    f = stepY > 0 ? 0 : 1;
                } else {
                    dist = tMaxZ;
                    tMaxZ += tDeltaZ;
                    z += stepZ;
                    f = stepZ > 0 ? 2 : 3;
                }
            }

            if (this.level.getTile(x, y, z) !== 0) {
                return { x: x, y: y, z: z, f: f };
            }
        }
        return null;
    }

    renderSurroundingGround() {
        if (this.groundMesh) {
            this.groundMesh.visible = true;
        }
    }

    compileSurroundingGround() {
        if (this.groundMesh) {
            if (this.scene) this.scene.remove(this.groundMesh);
            this.groundMesh.geometry.dispose();
        }

        const t = Tesselator.instance;
        const groundLevel = this.level.getGroundLevel();
        const y = groundLevel - 2.0;

        let s = 128;
        if (s > this.level.width) s = this.level.width;
        if (s > this.level.height) s = this.level.height;
        const d = 5;

        t.init();

        for (let xx = -s * d; xx < this.level.width + s * d; xx += s) {
            for (let i = -s * d; i < this.level.height + s * d; i += s) {
                let yy = y;
                if (xx >= 0 && i >= 0 && xx < this.level.width && i < this.level.height) {
                    yy = 0.0;
                }

                t.color(1.0, 1.0, 1.0);
                t.vertexUV(xx + 0, yy, i + s, 0.0, s);
                t.vertexUV(xx + s, yy, i + s, s, s);
                t.vertexUV(xx + s, yy, i + 0, s, 0.0);
                t.vertexUV(xx + 0, yy, i + 0, 0.0, 0.0);
            }
        }

        for (let xx = 0; xx < this.level.width; xx += s) {
            t.color(0.8, 0.8, 0.8);
            t.vertexUV(xx + 0, 0.0, 0.0, 0.0, 0.0);
            t.vertexUV(xx + s, 0.0, 0.0, s, 0.0);
            t.vertexUV(xx + s, y, 0.0, s, y);
            t.vertexUV(xx + 0, y, 0.0, 0.0, y);

            t.color(0.8, 0.8, 0.8);
            t.vertexUV(xx + 0, y, this.level.height, 0.0, y);
            t.vertexUV(xx + s, y, this.level.height, s, y);
            t.vertexUV(xx + s, 0.0, this.level.height, s, 0.0);
            t.vertexUV(xx + 0, 0.0, this.level.height, 0.0, 0.0);
        }

        for (let zz = 0; zz < this.level.height; zz += s) {
            t.color(0.6, 0.6, 0.6);
            t.vertexUV(0.0, y, zz + 0, 0.0, 0.0);
            t.vertexUV(0.0, y, zz + s, s, 0.0);
            t.vertexUV(0.0, 0.0, zz + s, s, y);
            t.vertexUV(0.0, 0.0, zz + 0, 0.0, y);

            t.color(0.6, 0.6, 0.6);
            t.vertexUV(this.level.width, 0.0, zz + 0, 0.0, y);
            t.vertexUV(this.level.width, 0.0, zz + s, s, y);
            t.vertexUV(this.level.width, y, zz + s, s, 0.0);
            t.vertexUV(this.level.width, y, zz + 0, 0.0, 0.0);
        }

        const geometry = t.flush();
        if (!geometry) return;

        const textureLoader = new THREE.TextureLoader();
        const rockTexture = textureLoader.load('./assets/textures/rock.png');
        rockTexture.magFilter = THREE.NearestFilter;
        rockTexture.minFilter = THREE.NearestFilter;
        rockTexture.wrapS = THREE.RepeatWrapping;
        rockTexture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshBasicMaterial({
            map: rockTexture,
            vertexColors: true
        });

        this.groundMesh = new THREE.Mesh(geometry, material);
        if (this.scene) {
            this.scene.add(this.groundMesh);
        }
    }

    renderSurroundingWater() {
        if (this.waterMesh) {
            this.waterMesh.visible = true;
        }
    }

    compileSurroundingWater() {
        if (this.waterMesh) {
            if (this.scene) this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
        }

        const t = Tesselator.instance;
        const groundLevel = this.level.getGroundLevel();
        const y = groundLevel;

        let s = 128;
        if (s > this.level.width) s = this.level.width;
        if (s > this.level.height) s = this.level.height;
        const d = 5;

        t.init();

        for (let xx = -s * d; xx < this.level.width + s * d; xx += s) {
            for (let zz = -s * d; zz < this.level.height + s * d; zz += s) {
                const yy = y - 0.1;
                if (xx < 0 || zz < 0 || xx >= this.level.width || zz >= this.level.height) {
                    t.color(1.0, 1.0, 1.0);

                    t.vertexUV(xx + 0, yy, zz + s, 0.0, s);
                    t.vertexUV(xx + s, yy, zz + s, s, s);
                    t.vertexUV(xx + s, yy, zz + 0, s, 0.0);
                    t.vertexUV(xx + 0, yy, zz + 0, 0.0, 0.0);

                    t.vertexUV(xx + 0, yy, zz + 0, 0.0, 0.0);
                    t.vertexUV(xx + s, yy, zz + 0, s, 0.0);
                    t.vertexUV(xx + s, yy, zz + s, s, s);
                    t.vertexUV(xx + 0, yy, zz + s, 0.0, s);
                }
            }
        }

        const geometry = t.flush();
        if (!geometry) return;

        const textureLoader = new THREE.TextureLoader();
        const waterTexture = textureLoader.load('./assets/textures/water.png');
        waterTexture.magFilter = THREE.NearestFilter;
        waterTexture.minFilter = THREE.NearestFilter;
        waterTexture.wrapS = THREE.RepeatWrapping;
        waterTexture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshBasicMaterial({
            map: waterTexture,
            transparent: true,
            vertexColors: true,
            side: THREE.DoubleSide
        });

        this.waterMesh = new THREE.Mesh(geometry, material);
        if (this.scene) {
            this.scene.add(this.waterMesh);
        }
    }

    mergeGeometries(geometries) {
        if (geometries[0] instanceof THREE.BufferGeometry) {
            return geometries[0];
        }
        return geometries[0];
    }

    renderHit(h, mode, color = 0x000000, opacity = 0.2) {
        if (!this.selectionMesh) {
            const boxGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                depthWrite: false
            });
            this.selectionMesh = new THREE.Mesh(boxGeo, material);
            this.selectionMesh.renderOrder = 999;
            this.scene.add(this.selectionMesh);
        }

        this.selectionMesh.visible = true;

        let x = h.x;
        let y = h.y;
        let z = h.z;

        if (mode === 1) {
            if (h.f === 0) y--;
            if (h.f === 1) y++;
            if (h.f === 2) z--;
            if (h.f === 3) z++;
            if (h.f === 4) x--;
            if (h.f === 5) x++;
        }
        if (this.selectionMesh.material.color.getHex() !== color) {
            this.selectionMesh.material.color.setHex(color);
        }
        if (this.selectionMesh.material.opacity !== opacity) {
            this.selectionMesh.material.opacity = opacity;
        }

        this.selectionMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    }

    render(player, layer) {
        Chunk.rebuiltThisFrame = 0;

        this.chunks.forEach(chunk => {
            chunk.render(layer);
        });
    }

    updateDirtyChunks(player, camera) {
        let dirty = this.getAllDirtyChunks();
        if (!dirty || dirty.length === 0) return;

        const sorter = new DirtyChunkSorter(player, camera);
        dirty.sort((a, b) => sorter.compare(a, b));

        const limit = Math.min(8, dirty.length);
        for (let i = 0; i < limit; i++) {
            dirty[i].rebuild(0);
            dirty[i].rebuild(1);
        }
    }

    getAllDirtyChunks() {
        let dirty = [];
        this.chunks.forEach(chunk => {
            if (chunk.isDirty()) {
                dirty.push(chunk);
            }
        });
        return dirty;
    }

    setDirty(x0, y0, z0, x1, y1, z1) {
        x0 = Math.floor(x0 / this.CHUNK_SIZE);
        x1 = Math.floor(x1 / this.CHUNK_SIZE);
        y0 = Math.floor(y0 / this.CHUNK_SIZE);
        y1 = Math.floor(y1 / this.CHUNK_SIZE);
        z0 = Math.floor(z0 / this.CHUNK_SIZE);
        z1 = Math.floor(z1 / this.CHUNK_SIZE);

        if (x0 < 0) x0 = 0;
        if (y0 < 0) y0 = 0;
        if (z0 < 0) z0 = 0;
        if (x1 >= this.xChunks) x1 = this.xChunks - 1;
        if (y1 >= this.yChunks) y1 = this.yChunks - 1;
        if (z1 >= this.zChunks) z1 = this.zChunks - 1;

        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                for (let z = z0; z <= z1; z++) {
                    const index = (x + y * this.xChunks) * this.zChunks + z;
                    this.chunks[index].setDirty();
                }
            }
        }
    }

    tileChanged(x, y, z) {
        this.setDirty(x - 1, y - 1, z - 1, x + 1, y + 1, z + 1);
    }

    lightColumnChanged(x, z, y0, y1) {
        this.setDirty(x - 1, y0 - 1, z - 1, x + 1, y1 + 1, z + 1);
    }

    allChanged() {
        this.setDirty(0, 0, 0, this.level.width, this.level.depth, this.level.height);
    }

}

class Tesselator {
    static instance = new Tesselator();

    constructor() {
        this.positions = [];
        this.uvs = [];
        this.colors = [];
        this.buffer = [];
        this.vertexCount = 0;
        this.u = 0; this.v = 0;
        this.r = 0; this.g = 0; this.b = 0;
        this.hasColor = false;
        this.hasTexture = false;
        this.noColor = false;
        this.len = 3;
        this.isLines = false;
    }

    init(isLines = false) {
        this.positions = [];
        this.uvs = [];
        this.colors = [];
        this.buffer = [];
        this.vertexCount = 0;
        this.hasColor = false;
        this.hasTexture = false;
        this.isLines = isLines;
    }

    colorRGBA(c) {
        const r = ((c >> 16) & 0xFF) / 255.0;
        const g = ((c >> 8) & 0xFF) / 255.0;
        const b = (c & 0xFF) / 255.0;
        this.color(r, g, b);
    }

    tex(u, v) {
        if (!this.hasTexture) this.len += 2;
        this.hasTexture = true;
        this.u = u;
        this.v = v;
    }

    color(r, g, b) {
        if (this.noColor) return;
        if (!this.hasColor) this.len += 3;
        this.hasColor = true;
        this.r = r;
        this.g = g;
        this.b = b;
    }

    vertexUV(x, y, z, u, v) {
        this.tex(u, v);
        this.vertex(x, y, z);
    }

    vertex(x, y, z) {
        if (this.isLines) {
            this.positions.push(x, y, z);
            if (this.hasColor) this.colors.push(this.r, this.g, this.b);
            this.vertexCount++;
            return;
        }

        this.buffer.push({ x, y, z, u: this.u, v: this.v, r: this.r, g: this.g, b: this.b });

        if (this.buffer.length === 4) {
            const indices = [0, 1, 2, 0, 2, 3];
            for (const idx of indices) {
                const vert = this.buffer[idx];
                this.positions.push(vert.x, vert.y, vert.z);
                if (this.hasTexture) this.uvs.push(vert.u, 1.0 - vert.v);
                if (this.hasColor) this.colors.push(vert.r, vert.g, vert.b);
                this.vertexCount++;
            }
            this.buffer = [];
        }
    }

    flush() {
        if (this.vertexCount === 0) return null;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        if (this.hasTexture && !this.isLines) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
        if (this.hasColor) geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        return geometry;
    }
}

class Tile {
    static tiles = new Array(256).fill(null);

    static NOT_LIQUID = 0;
    static LIQUID_WATER = 1;
    static LIQUID_LAVA = 2;

    constructor(id, tex) {
        this.level = null;
        this.id = id;
        this.tex = tex;
        Tile.tiles[id] = this;
        this.shouldTick = false;
        this.xx0 = 0;
        this.yy0 = 0;
        this.zz0 = 0;
        this.xx1 = 0;
        this.yy1 = 0;
        this.zz1 = 0;
        this.setShape(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
    }

    setTicking(tick) {
        this.shouldTick = tick;
    }

    setShape(x0, y0, z0, x1, y1, z1) {
        this.xx0 = x0;
        this.yy0 = y0;
        this.zz0 = z0;
        this.xx1 = x1;
        this.yy1 = y1;
        this.zz1 = z1;
    }

    render(t, level, layer, x, y, z) {
        this.level = level;
        const c1 = 1.0;
        const c2 = 0.8;
        const c3 = 0.6;
        if (this.shouldRenderFace(level, x, y - 1, z, layer)) {
            t.color(c1, c1, c1);
            this.renderFace(t, x, y, z, 0);
        }
        if (this.shouldRenderFace(level, x, y + 1, z, layer)) {
            t.color(c1, c1, c1);
            this.renderFace(t, x, y, z, 1);
        }
        if (this.shouldRenderFace(level, x, y, z - 1, layer)) {
            t.color(c2, c2, c2);
            this.renderFace(t, x, y, z, 2);
        }
        if (this.shouldRenderFace(level, x, y, z + 1, layer)) {
            t.color(c2, c2, c2);
            this.renderFace(t, x, y, z, 3);
        }
        if (this.shouldRenderFace(level, x - 1, y, z, layer)) {
            t.color(c3, c3, c3);
            this.renderFace(t, x, y, z, 4);
        }
        if (this.shouldRenderFace(level, x + 1, y, z, layer)) {
            t.color(c3, c3, c3);
            this.renderFace(t, x, y, z, 5);
        }
    }

    renderFace(t, x, y, z, face, nbmode = false) {
        if (!nbmode) {
            let brightness = 1.0;
            if (face === 0) brightness = this.level.getBrightness(x, y - 1, z) * 0.5;
            if (face === 1) brightness = this.level.getBrightness(x, y + 1, z) * 1.0;
            if (face === 2) brightness = this.level.getBrightness(x, y, z - 1) * 0.8;
            if (face === 3) brightness = this.level.getBrightness(x, y, z + 1) * 0.8;
            if (face === 4) brightness = this.level.getBrightness(x - 1, y, z) * 0.6;
            if (face === 5) brightness = this.level.getBrightness(x + 1, y, z) * 0.6;
            t.color(brightness, brightness, brightness);
        }

        const tex = this.getTexture(face);

        const u0 = (tex % 16) / 16.0;
        const u1 = u0 + 0.0624375;
        const v0 = Math.floor(tex / 16) / 16.0;
        const v1 = v0 + 0.0624375;

        const x0 = x + this.xx0;
        const x1 = x + this.xx1;
        const y0 = y + this.yy0;
        const y1 = y + this.yy1;
        const z0 = z + this.zz0;
        const z1 = z + this.zz1;

        if (face == 0) {
            t.vertexUV(x0, y0, z1, u0, v1);
            t.vertexUV(x0, y0, z0, u0, v0);
            t.vertexUV(x1, y0, z0, u1, v0);
            t.vertexUV(x1, y0, z1, u1, v1);
        }
        if (face == 1) {
            t.vertexUV(x1, y1, z1, u1, v1);
            t.vertexUV(x1, y1, z0, u1, v0);
            t.vertexUV(x0, y1, z0, u0, v0);
            t.vertexUV(x0, y1, z1, u0, v1);
        }
        if (face == 2) {
            t.vertexUV(x0, y1, z0, u1, v0);
            t.vertexUV(x1, y1, z0, u0, v0);
            t.vertexUV(x1, y0, z0, u0, v1);
            t.vertexUV(x0, y0, z0, u1, v1);
        }
        if (face == 3) {
            t.vertexUV(x0, y1, z1, u0, v0);
            t.vertexUV(x0, y0, z1, u0, v1);
            t.vertexUV(x1, y0, z1, u1, v1);
            t.vertexUV(x1, y1, z1, u1, v0);
        }
        if (face == 4) {
            t.vertexUV(x0, y1, z1, u1, v0);
            t.vertexUV(x0, y1, z0, u0, v0);
            t.vertexUV(x0, y0, z0, u0, v1);
            t.vertexUV(x0, y0, z1, u1, v1);
        }
        if (face == 5) {
            t.vertexUV(x1, y0, z1, u0, v1);
            t.vertexUV(x1, y0, z0, u1, v1);
            t.vertexUV(x1, y1, z0, u1, v0);
            t.vertexUV(x1, y1, z1, u0, v0);
        }
    }

    renderBackFace(t, x, y, z, face, nbmode = false) {
        if (!nbmode) {
            let brightness = 1.0;
            if (face === 0) brightness = this.level.getBrightness(x, y - 1, z) * 0.5;
            if (face === 1) brightness = this.level.getBrightness(x, y + 1, z) * 1.0;
            if (face === 2) brightness = this.level.getBrightness(x, y, z - 1) * 0.8;
            if (face === 3) brightness = this.level.getBrightness(x, y, z + 1) * 0.8;
            if (face === 4) brightness = this.level.getBrightness(x - 1, y, z) * 0.6;
            if (face === 5) brightness = this.level.getBrightness(x + 1, y, z) * 0.6;
            t.color(brightness, brightness, brightness);
        }

        const tex = this.getTexture(face);

        const u0 = (tex % 16) / 16.0;
        const u1 = u0 + 0.0624375;
        const v0 = Math.floor(tex / 16) / 16.0;
        const v1 = v0 + 0.0624375;

        const x0 = x + this.xx0;
        const x1 = x + this.xx1;
        const y0 = y + this.yy0;
        const y1 = y + this.yy1;
        const z0 = z + this.zz0;
        const z1 = z + this.zz1;

        if (face == 0) {
            t.vertexUV(x1, y0, z1, u1, v1);
            t.vertexUV(x1, y0, z0, u1, v0);
            t.vertexUV(x0, y0, z0, u0, v0);
            t.vertexUV(x0, y0, z1, u0, v1);
        }
        if (face == 1) {
            t.vertexUV(x0, y1, z1, u0, v1);
            t.vertexUV(x0, y1, z0, u0, v0);
            t.vertexUV(x1, y1, z0, u1, v0);
            t.vertexUV(x1, y1, z1, u1, v1);
        }
        if (face == 2) {
            t.vertexUV(x0, y0, z0, u1, v1);
            t.vertexUV(x1, y0, z0, u0, v1);
            t.vertexUV(x1, y1, z0, u0, v0);
            t.vertexUV(x0, y1, z0, u1, v0);
        }
        if (face == 3) {
            t.vertexUV(x1, y1, z1, u1, v0);
            t.vertexUV(x1, y0, z1, u1, v1);
            t.vertexUV(x0, y0, z1, u0, v1);
            t.vertexUV(x0, y1, z1, u0, v0);
        }
        if (face == 4) {
            t.vertexUV(x0, y0, z1, u1, v1);
            t.vertexUV(x0, y0, z0, u0, v1);
            t.vertexUV(x0, y1, z0, u0, v0);
            t.vertexUV(x0, y1, z1, u1, v0);
        }
        if (face == 5) {
            t.vertexUV(x1, y1, z1, u0, v0);
            t.vertexUV(x1, y1, z0, u1, v0);
            t.vertexUV(x1, y0, z0, u1, v1);
            t.vertexUV(x1, y0, z1, u0, v1);
        }
    }

    renderFaceNoTexture(t, x, y, z, face, nbmode = false) {
        if (!nbmode) {
            let brightness = 1.0;
            if (face === 0) brightness = this.level.getBrightness(x, y - 1, z) * 0.5;
            if (face === 1) brightness = this.level.getBrightness(x, y + 1, z) * 1.0;
            if (face === 2) brightness = this.level.getBrightness(x, y, z - 1) * 0.8;
            if (face === 3) brightness = this.level.getBrightness(x, y, z + 1) * 0.8;
            if (face === 4) brightness = this.level.getBrightness(x - 1, y, z) * 0.6;
            if (face === 5) brightness = this.level.getBrightness(x + 1, y, z) * 0.6;
            t.color(brightness, brightness, brightness);
        }

        const x0 = x + this.xx0;
        const x1 = x + this.xx1;
        const y0 = y + this.yy0;
        const y1 = y + this.yy1;
        const z0 = z + this.zz0;
        const z1 = z + this.zz1;

        if (face == 0) {
            t.vertex(x0, y0, z1);
            t.vertex(x0, y0, z0);
            t.vertex(x1, y0, z0);
            t.vertex(x1, y0, z1);
        }
        if (face == 1) {
            t.vertex(x1, y1, z1);
            t.vertex(x1, y1, z0);
            t.vertex(x0, y1, z0);
            t.vertex(x0, y1, z1);
        }
        if (face == 2) {
            t.vertex(x0, y1, z0);
            t.vertex(x1, y1, z0);
            t.vertex(x1, y0, z0);
            t.vertex(x0, y0, z0);
        }
        if (face == 3) {
            t.vertex(x0, y1, z1);
            t.vertex(x0, y0, z1);
            t.vertex(x1, y0, z1);
            t.vertex(x1, y1, z1);
        }
        if (face == 4) {
            t.vertex(x0, y1, z1);
            t.vertex(x0, y1, z0);
            t.vertex(x0, y0, z0);
            t.vertex(x0, y0, z1);
        }
        if (face == 5) {
            t.vertex(x1, y0, z1);
            t.vertex(x1, y0, z0);
            t.vertex(x1, y1, z0);
            t.vertex(x1, y1, z1);
        }
    }

    addQuad(t, x1, y1, z1, u1, v1, x2, y2, z2, u2, v2, x3, y3, z3, u3, v3, x4, y4, z4, u4, v4) {
        t.tex(u1, v1); t.vertex(x1, y1, z1);
        t.tex(u2, v2); t.vertex(x2, y2, z2);
        t.tex(u3, v3); t.vertex(x3, y3, z3);

        t.tex(u1, v1); t.vertex(x1, y1, z1);
        t.tex(u3, v3); t.vertex(x3, y3, z3);
        t.tex(u4, v4); t.vertex(x4, y4, z4);
    }

    shouldRenderFace(level, x, y, z, layer) {
        return !level.isSolidTile(x, y, z) && level.isLit(x, y, z) ^ layer == 1;
    }

    getTexture(face) {
        return this.tex;
    }

    getAABB(x, y, z) {
        return new AABB(x, y, z, x + 1, y + 1, z + 1);
    }

    blocksLight() {
        return true;
    }

    isSolid() {
        return true;
    }

    mayPick() {
        return true;
    }

    tick(level, x, y, z, random) { }

    neighborChanged(level, x, y, z, type) { }

    getLiquidType() {
        return 0;
    }

    destroy(level, x, y, z, particleEngine) {
        const SD = 4;
        for (let xx = 0; xx < SD; xx++) {
            for (let yy = 0; yy < SD; yy++) {
                for (let zz = 0; zz < SD; zz++) {
                    const xp = x + (xx + 0.5) / SD;
                    const yp = y + (yy + 0.5) / SD;
                    const zp = z + (zz + 0.5) / SD;

                    particleEngine.add(
                        xp, yp, zp,
                        xp - x - 0.5, yp - y - 0.5, zp - z - 0.5,
                        this.id
                    );
                }
            }
        }
    }
}

class GrassTile extends Tile {
    constructor(id) {
        super(id);
        this.tex = 3;
        this.setTicking(true);
    }

    getTexture(face) {
        if (face === 1) return 0;
        if (face === 0) return 2;
        return 3;
    }

    tick(level, x, y, z, random) {
        if (random.nextInt(4) != 0)
            return;
        if (!level.isLit(x, y + 1, z)) {
            level.setTile(x, y, z, Tile.dirt.id);
        } else {
            for (let i = 0; i < 4; i++) {
                const xt = x + random.nextInt(3) - 1;
                const yt = y + random.nextInt(5) - 3;
                const zt = z + random.nextInt(3) - 1;
                if (level.getTile(xt, yt, zt) == Tile.dirt.id && level.isLit(xt, yt + 1, zt))
                    level.setTile(xt, yt, zt, Tile.grass.id);
            }
        }
    }
}

class DirtTile extends Tile {
    constructor(id, tex) {
        super(id, tex);
    }
}

class BushTile extends Tile {
    constructor(id) {
        super(id);
        this.tex = 15;
        this.setTicking(true);
    }

    tick(level, x, y, z, random) {
        const below = level.getTile(x, y - 1, z);

        if (!level.isLit(x, y, z) || (below !== Tile.dirt.id && below !== Tile.grass.id)) {
            level.setTileNoUpdate(x, y, z, 0);
        }
    }

    render(t, level, layer, x, y, z) {
        if (level.isLit(x, y, z) ^ layer !== 1) {
            return;
        }

        const tex = this.getTexture(15);
        const u0 = (tex % 16) / 16.0;
        const u1 = u0 + 0.0624375;
        const v0 = Math.floor(tex / 16) / 16.0;
        const v1 = v0 + 0.0624375;

        const rots = 2;
        t.color(1.0, 1.0, 1.0);

        for (let r = 0; r < rots; r++) {
            const xa = Math.sin((r * Math.PI) / rots + 0.7853981633974483) * 0.5;
            const za = Math.cos((r * Math.PI) / rots + 0.7853981633974483) * 0.5;

            const x0 = x + 0.5 - xa;
            const x1 = x + 0.5 + xa;
            const y0 = y + 0.0;
            const y1 = y + 1.0;
            const z0 = z + 0.5 - za;
            const z1 = z + 0.5 + za;

            t.vertexUV(x0, y1, z0, u1, v0);
            t.vertexUV(x1, y1, z1, u0, v0);
            t.vertexUV(x1, y0, z1, u0, v1);
            t.vertexUV(x0, y0, z0, u1, v1);

            t.vertexUV(x1, y1, z1, u0, v0);
            t.vertexUV(x0, y1, z0, u1, v0);
            t.vertexUV(x0, y0, z0, u1, v1);
            t.vertexUV(x1, y0, z1, u0, v1);
        }
    }

    getAABB(x, y, z) {
        return null;
    }

    blocksLight() {
        return false;
    }

    isSolid() {
        return false;
    }
}

class LiquidTile extends Tile {
    constructor(id, liquidType) {
        super(id);
        this.liquidType = liquidType;

        this.tex = 13;
        this.spreadSpeed = 1;

        if (liquidType == 2) this.tex = 30;
        if (liquidType == 1) this.spreadSpeed = 8;
        if (liquidType == 2) this.spreadSpeed = 2;

        this.tileId = id;
        this.calmTileId = id + 1;

        this.dd = 0.1;

        super.setShape(0.0, 0.0, 0.0, 1.0, 1.0 - this.dd, 1.0);
        super.setTicking(true);
    }

    tick(level, x, y, z, random) {
        this.updateWater(level, x, y, z, 0);
    }

    updateWater(level, x, y, z, depth) {
        let hasChanged = false;
        while (level.getTile(x, --y, z) == 0) {
            const change = level.setTileNoUpdate(x, y, z, this.tileId);
            if (change)
                hasChanged = true;
            if (!change ||
                this.liquidType == 2)
                break;
        }
        y++;
        if (this.liquidType == 1 || !hasChanged) {
            hasChanged |= this.checkWater(level, x - 1, y, z, depth);
            hasChanged |= this.checkWater(level, x + 1, y, z, depth);
            hasChanged |= this.checkWater(level, x, y, z - 1, depth);
            hasChanged |= this.checkWater(level, x, y, z + 1, depth);
        }
        if (!hasChanged)
            level.setTileNoUpdate(x, y, z, this.calmTileId);
        return hasChanged;
    }

    checkWater(level, x, y, z, depth) {
        let hasChanged = false;
        const type = level.getTile(x, y, z);
        if (type == 0) {
            const changed = level.setTile(x, y, z, this.tileId);
            if (changed && depth < this.spreadSpeed)
                hasChanged |= this.updateWater(level, x, y, z, depth + 1);
        }
        return hasChanged;
    }

    shouldRenderFace(level, x, y, z, layer, face) {
        if (x < 0 || y < 0 || z < 0 || x >= level.width || z >= level.height)
            return false;
        const id = level.getTile(x, y, z);
        if (id == this.tileId || id == this.calmTileId)
            return false;
        return super.shouldRenderFace(level, x, y, z, layer);
    }

    renderFace(t, x, y, z, face) {
        super.renderFace(t, x, y, z, face);
        this.renderBackFace(t, x, y, z, face);
    }

    mayPick() {
        return false;
    }

    blocksLight() {
        return true;
    }

    isSolid() {
        return false;
    }

    getLiquidType() {
        return this.liquidType;
    }

    neighborChanged(level, x, y, z, type) {
        if (this.liquidType == 1 && (type == Tile.lava.id || type == Tile.calmLava.id))
            level.setTileNoUpdate(x, y, z, Tile.rock.id);
        if (this.liquidType == 2 && (type == Tile.water.id || type == Tile.calmWater.id))
            level.setTileNoUpdate(x, y, z, Tile.rock.id);
    }
}

class CalmLiquidTile extends LiquidTile {
    constructor(id, liquidType) {
        super(id, liquidType);
        this.tileId = id - 1;
        this.calmTileId = id;
        super.setTicking(false);
    }

    tick(level, x, y, z, random) { }

    neighborChanged(level, x, y, z, type) {
        let hasAirNeighbor = false;
        if (level.getTile(x - 1, y, z) == 0) hasAirNeighbor = true;
        if (level.getTile(x + 1, y, z) == 0) hasAirNeighbor = true;
        if (level.getTile(x, y, z - 1) == 0) hasAirNeighbor = true;
        if (level.getTile(x, y, z + 1) == 0) hasAirNeighbor = true;
        if (level.getTile(x, y - 1, z) == 0) hasAirNeighbor = true;
        if (hasAirNeighbor) level.setTileNoUpdate(x, y, z, this.tileId);
        if (this.liquidType == 1 && type == Tile.lava.id) level.setTileNoUpdate(x, y, z, Tile.rock.id);
        if (this.liquidType == 2 && type == Tile.water.id) level.setTileNoUpdate(x, y, z, Tile.rock.id);
    }
}

Tile.empty = null;
Tile.rock = new Tile(1, 1);
Tile.grass = new GrassTile(2);
Tile.dirt = new DirtTile(3, 2);
Tile.stoneBrick = new Tile(4, 16);
Tile.wood = new Tile(5, 4);
Tile.bush = new BushTile(6);
Tile.unbreakable = new Tile(7, 17);
Tile.water = new LiquidTile(8, 1);
Tile.calmWater = new CalmLiquidTile(9, 1);
Tile.lava = new LiquidTile(10, 2);
Tile.calmLava = new CalmLiquidTile(11, 2);

class Player extends Entity {
    constructor(level) {
        super(level);

        this.level = level;

        this.x = 0; this.y = 0; this.z = 0;
        this.xo = 0; this.yo = 0; this.zo = 0;

        this.xd = 0; this.yd = 0; this.zd = 0;

        this.yRot = 0;
        this.xRot = 0;

        this.walk_speed = 1.3

        this.bb = null;
        this.onGround = false;

        this.heightOffset = 1.62;

        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.resetPos();
    }

    resetPos() {
        let x = Math.random() * this.level.width;
        let y = this.level.depth + 10;
        let z = Math.random() * this.level.height;
        this.setPos(x, y, z);
    }

    setPos(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        let w = 0.3;
        let h = 0.9;
        this.bb = new AABB(x - w, y - h, z - w, x + w, y + h, z + w);
    }

    tick(camera) {
        this.xo = this.x;
        this.yo = this.y;
        this.zo = this.z;

        let xa = 0;
        let ya = 0;

        const inWater = super.isInWater();
        const inLava = super.isInLava();

        if (this.keys['KeyR']) this.resetPos();

        if (this.keys['ArrowUp'] || this.keys['KeyW']) ya -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) ya += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) xa -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) xa += 1;

        if (this.keys['Space']) {
            if (inWater) {
                this.yd += 0.04;
            } else if (inLava) {
                this.yd += 0.04;
            } else if (this.onGround) {
                this.yd = 0.42;
                this.keys['Space'] = false;
            }
        }
        if (inWater) {
            const yo = this.y;
            this.moveRelative(xa, ya, 0.02);
            this.move(this.xd, this.yd, this.zd);
            this.xd *= 0.8;
            this.yd *= 0.8;
            this.zd *= 0.8;
            this.yd = (this.yd - 0.02);
            if (this.horizontalCollision && super.isFree(this.xd, this.yd + 0.6 - this.y + yo, this.zd))
                this.yd = 0.3;
        } else if (inLava) {
            const yo = this.y;
            this.moveRelative(xa, ya, 0.02);
            this.move(this.xd, this.yd, this.zd);
            this.xd *= 0.5;
            this.yd *= 0.5;
            this.zd *= 0.5;
            this.yd = (this.yd - 0.02);
            if (this.horizontalCollision && super.isFree(this.xd, this.yd + 0.6 - this.y + yo, this.zd))
                this.yd = 0.3;
        } else {
            this.moveRelative(xa, ya, this.onGround ? 0.1 : 0.02);
            this.move(this.xd, this.yd, this.zd);
            this.xd *= 0.91;
            this.yd *= 0.98;
            this.zd *= 0.91;
            this.yd = (this.yd - 0.08);
            if (this.onGround) {
                this.xd *= 0.6;
                this.zd *= 0.6;
            }
        }
    }
}

class Timer {
    constructor(ticksPerSecond, minecraft) {
        this.ticksPerSecond = ticksPerSecond;
        this.lastTime = performance.now();
        this.minecraft = minecraft;

        this.ticks = 0;
        this.a = 0.0;
        this.timeScale = 1.0;
        this.fps = 0.0;
        this.calmfps = 0.0;
        this.passedTime = 0.0;

        this.MS_PER_SECOND = 1000.0;
        this.MAX_MS_PER_UPDATE = 1000.0;
        this.MAX_TICKS_PER_UPDATE = 100;

        this.chunkUpdatesElapsedMs = 0.0;
        this.lastTotalChunkUpdates = 0;
        this.chunkUpdatesPerSecond = 0;
    }

    advanceTime() {
        const now = performance.now();
        let passedMs = now - this.lastTime;
        this.lastTime = now;

        const currentTotalChunkUpdates = Chunk.updates;

        if (passedMs < 0) passedMs = 0;
        if (passedMs > this.MAX_MS_PER_UPDATE) {
            passedMs = this.MAX_MS_PER_UPDATE;
        }

        this.fps = this.MS_PER_SECOND / passedMs;

        this.passedTime += (passedMs * this.timeScale * this.ticksPerSecond) / this.MS_PER_SECOND;
        this.ticks = Math.floor(this.passedTime);

        if (this.ticks > this.MAX_TICKS_PER_UPDATE) {
            this.ticks = this.MAX_TICKS_PER_UPDATE;
        }

        this.passedTime -= this.ticks;
        this.a = this.passedTime;

        this.chunkUpdatesElapsedMs += passedMs;

        if (this.chunkUpdatesElapsedMs >= this.MS_PER_SECOND) {
            this.chunkUpdatesPerSecond = currentTotalChunkUpdates - this.lastTotalChunkUpdates;

            this.lastTotalChunkUpdates = currentTotalChunkUpdates;
            this.calmfps = this.fps;

            this.chunkUpdatesElapsedMs -= this.MS_PER_SECOND;
        }
    }
}

class Minecraft {
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.timer = new Timer(20.0, this);
        this.level = null;
        this.levelRenderer = null;
        this.player = null;
        this.entities = [];

        this.paintTexture = Tile.stoneBrick.id;

        this.renderer = null;
        this.scene = null;
        this.camera = null;

        this.pause = false;

        this.title = "0.0.12a Port";

        this.guiWidth = this.width * 240 / this.height;
        this.guiHeight = 240;
        this.guiBlockMesh = null;
        this.guiCamera = null;
        this.guiScene = null;

        this.screen = null;
        this.mouseX = 0;
        this.mouseY = 0;

        this.fogColor = new THREE.Color(0.5, 0.8, 1.0);

        this.guiCanvas = document.createElement('canvas');
        this.guiCanvas.style.imageRendering = 'pixelated';
        this.guiCanvas.style.imageRendering = 'crisp-edges';
        this.guiCanvas.id = 'gui-canvas';
        this.guiCanvas.style.position = 'absolute';
        this.guiCanvas.style.top = '0';
        this.guiCanvas.style.left = '0';
        this.guiCanvas.style.width = '100%';
        this.guiCanvas.style.height = '100%';
        this.guiCanvas.style.backgroundColor = 'transparent';
        this.guiCanvas.style.pointerEvents = 'auto';

        document.body.appendChild(this.guiCanvas);

        this.ctx = this.guiCanvas.getContext('2d');

        this.bitmap_font = new BitmapFont(this.ctx, "./assets/fonts/default.gif");

        this.resizeCanvas();

        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.resizeCanvas();

        this.guiWidth = this.guiCanvas.width;
        this.guiHeight = this.guiCanvas.height;

        if (this.camera) {
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }

        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
        }

        if (this.guiCamera) {
            this.guiCamera.right = window.innerWidth * 240 / window.innerHeight;
            this.guiCamera.bottom = window.innerHeight * 240 / window.innerHeight;
            this.guiCamera.updateProjectionMatrix();
        }

        this.render(true);
    }

    resizeCanvas() {
        this.guiCanvas.height = 1440;
        this.guiCanvas.width = (window.innerWidth * this.guiCanvas.height) / window.innerHeight;
    }

    renderGUIBlock() {
        if (this.isCapturingScreenshot) return;
        if (this.guiBlockMesh) {
            this.guiBlockMesh.position.set(window.innerWidth * 240 / window.innerHeight - 12, 12, 0);
        }

        if (this.guiBlockMesh) {
            this.renderer.autoClear = false;
            this.renderer.render(this.guiScene, this.guiCamera);
            this.renderer.autoClear = true;
        }
    }

    updateGUIBlock() {
        if (!this.guiScene) return;
        if (!this.levelRenderer || !this.level.texture) return;

        if (this.guiBlockMesh) {
            this.guiScene.remove(this.guiBlockMesh);
            this.guiBlockMesh.geometry.dispose();
        }

        const selectedBlockId = this.paintTexture;
        const tile = Tile.tiles[selectedBlockId];
        if (!tile) return;

        const t = new Tesselator();
        t.init();

        const mockLevel = {
            width: 256,
            height: 256,
            isLit: () => true,
            getTile: () => 0,
            isSolidTile: (x, y, z) => false,
            getBrightness: () => 1,
        };

        tile.render(t, mockLevel, 0, 0, 0, 0);
        tile.render(t, mockLevel, 1, 0, 0, 0);

        const geometry = t.flush();

        if (!geometry) return;

        const guiMaterial = new THREE.MeshBasicMaterial({
            map: this.level.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });

        this.guiBlockMesh = new THREE.Mesh(geometry, guiMaterial);

        geometry.translate(-0.5, -0.5, -0.5);

        this.guiBlockMesh.scale.set(12, 12, 12);

        this.guiBlockMesh.rotation.reorder('YXZ');
        this.guiBlockMesh.rotation.x = THREE.MathUtils.degToRad(165);
        this.guiBlockMesh.rotation.y = THREE.MathUtils.degToRad(46);
        this.guiBlockMesh.rotation.z = THREE.MathUtils.degToRad(15);

        this.guiScene.add(this.guiBlockMesh);
    }

    renderGUI(skippause) {
        const w = this.guiCanvas.width;
        const h = this.guiCanvas.height;

        this.ctx.clearRect(0, 0, w, h);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'difference';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.imageSmoothingEnabled = false;

        const crosshairSize = 12;
        const centerX = w / 2;
        const centerY = h / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX - crosshairSize, centerY);
        this.ctx.lineTo(centerX + crosshairSize, centerY);
        this.ctx.moveTo(centerX, centerY - crosshairSize);
        this.ctx.lineTo(centerX, centerY + crosshairSize);
        this.ctx.stroke();
        this.ctx.restore();

        this.bitmap_font.drawText(this.title, 20, 20, true, 3, 0xFFFFFF);
        this.bitmap_font.drawText(`${this.timer.calmfps.toFixed(0)} fps, ${this.timer.chunkUpdatesPerSecond} chunk updates`, 20, 50, true, 3, 0xFFFFFF);
        //čřthis.bitmap_font.drawText(`${this.player.x.toFixed(2)} X ${(this.player.y-0.62).toFixed(2)} Y ${this.player.z.toFixed(2)} Z`, 20, 80, true, 3, 0xFFFFFF);
        //this.bitmap_font.drawText(`Seed: ${this.level.random.seed}`, 20, 110, true, 3, 0xFFFFFF);
        //this.bitmap_font.drawText(`Entity couter: ${this.entities.length}`, 20, 140, true, 3, 0xFFFFFF);

        this.renderGUIBlock();

        if (this.screen !== null) {
            this.screen.render(this.mouseX, this.mouseY, w, h);
        }
    }

    async init() {
        this.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(this.fogColor);
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.FogExp2(this.fogColor, 0.01);

        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.05, 1000.0);

        this.guiScene = new THREE.Scene();

        this.guiWidth = (this.width * 240) / this.height;
        this.guiCamera = new THREE.OrthographicCamera(0, this.guiWidth, 0, 240, -100, 100);
        this.guiCamera.position.set(0, 0, 50);
        this.guiCamera.lookAt(0, 0, 0);

        await this.generateNewLevel();

        this.setupControls();

        this.updateGUIBlock();

        this.render();
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        if (!this.pause) {
            this.timer.advanceTime();
            for (let i = 0; i < this.timer.ticks; i++) {
                this.tick();
            }
        }
        this.render();
    }

    async run() {
        await this.init();
        this.loop();
    }

    async saveLevel() {
        try {
            const blocks = this.level.blocks;

            const blob = new Blob([blocks]);
            const compressionStream = blob.stream().pipeThrough(new CompressionStream('gzip'));

            const compressedBuffer = await new Response(compressionStream).arrayBuffer();

            const saveBlob = new Blob([compressedBuffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(saveBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'level.dat';
            link.click();

            URL.revokeObjectURL(url);

            console.log(`World saved`);
        } catch (error) {
            console.error("World save error:", error);
        }
    }

    async loadLevel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dat';
        input.onchange = async e => {
            try {
                const file = e.target.files[0];
                if (!file) return;

                const decompressionStream = file.stream().pipeThrough(new DecompressionStream('gzip'));
                const decompressedBuffer = await new Response(decompressionStream).arrayBuffer();
                const decompressedData = new Uint8Array(decompressedBuffer);

                if (decompressedData.length !== this.level.blocks.length) {
                    console.error("Incorrect world size: " + decompressedData.length + " ~= " + this.level.blocks.length);
                    return;
                }

                this.level.blocks.set(decompressedData);

                this.level.calcLightDepths(0, 0, this.level.width, this.level.height);
                this.levelRenderer.allChanged();

                console.log(`World loaded`);

                this.render(true);
            } catch (error) {
                console.error("World save error. GZIP only", error);
            }
        };
        input.click();
    }

    takeScreenshot() {
        const superSamplingFactor = 2;
        const screenshotWidth = this.width * superSamplingFactor;
        const screenshotHeight = this.height * superSamplingFactor;

        const renderTarget = new THREE.WebGLRenderTarget(screenshotWidth, screenshotHeight, {
            minFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat
        });

        this.renderer.setRenderTarget(renderTarget);

        this.renderer.setClearColor(this.fogColor);
        this.renderer.clear();

        this.levelRenderer.render(this.player, 0);
        this.levelRenderer.render(this.player, 1);
        this.particleEngine.render(this.player, this.timer.a);
        this.entities.forEach(z => z.render(this.timer.a));

        this.renderer.render(this.scene, this.camera);

        this.renderer.setRenderTarget(null);

        const canvas2d = document.createElement('canvas');
        canvas2d.width = screenshotWidth;
        canvas2d.height = screenshotHeight;
        const ctx2d = canvas2d.getContext('2d');

        const buffer = new Uint8Array(screenshotWidth * screenshotHeight * 4);
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, screenshotWidth, screenshotHeight, buffer);

        const imageData = ctx2d.createImageData(screenshotWidth, screenshotHeight);
        for (let y = 0; y < screenshotHeight; y++) {
            const srcRow = (screenshotHeight - 1 - y) * screenshotWidth * 4;
            const destRow = y * screenshotWidth * 4;
            for (let x = 0; x < screenshotWidth * 4; x++) {
                imageData.data[destRow + x] = buffer[srcRow + x];
            }
        }
        ctx2d.putImageData(imageData, 0, 0);

        const dataURL = canvas2d.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `minecraft-screenshot-${Date.now()}.png`;
        link.href = dataURL;
        link.click();

        renderTarget.dispose();
    }

    setupControls() {
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                this.pause = false;
            } else {
                this.setScreen(new PauseScreen());
                this.pause = true;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.player.turn(-e.movementX, e.movementY);
            }
        });

        this.guiCanvas.addEventListener('mousemove', (e) => {
            const rect = this.guiCanvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (this.guiCanvas.width / rect.width);
            this.mouseY = (e.clientY - rect.top) * (this.guiCanvas.height / rect.height);
        });

        this.guiCanvas.addEventListener('mousedown', (e) => {
            if (this.screen !== null) {
                this.screen.mouseClicked(this.mouseX, this.mouseY, e.button);
            } else {
                if (!document.pointerLockElement) document.body.requestPointerLock();
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (!document.pointerLockElement) return;
            if (e.button === 0) {
                this.rightMouseButtonDown = true;
            }
            if (e.button === 1) {
                this.middleMouseButtonDown = true;
            }
            else if (e.button === 2) {
                this.leftMouseButtonDown = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.rightMouseButtonDown = false;
            }
            if (e.button === 1) {
                this.middleMouseButtonDown = false;
            }
            if (e.button === 2) {
                this.leftMouseButtonDown = false;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                this.saveLevel();
            }
            if (e.code === 'Insert') {
                this.loadLevel();
            }
            if (e.code === 'KeyG') {
                const blockEntity = new Zombie(this.level, this.player.x, this.player.y, this.player.z, this.scene);

                this.entities.push(blockEntity);
            }
            if (e.code === 'KeyO') {
                this.takeScreenshot();
            }
            if (e.code === 'Digit1' || e.code === 'Numpad1') {
                this.paintTexture = 2;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit2' || e.code === 'Numpad2') {
                this.paintTexture = 3;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit3' || e.code === 'Numpad3') {
                this.paintTexture = 4;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit4' || e.code === 'Numpad4') {
                this.paintTexture = 5;
                this.updateGUIBlock();
            }
            if (e.code === 'Digit5' || e.code === 'Numpad5') {
                this.paintTexture = 6;
                this.updateGUIBlock();
            }
            if (e.code === 'KeyP') {
                this.setScreen(new LevelGenScreen());
            }
            //console.log(e.code);
        });

        window.addEventListener('wheel', (event) => {
            if (!document.pointerLockElement) return;
            const validTileIds = Object.keys(Tile.tiles)
                .map(Number)
                .filter(id => Tile.tiles[id] !== null && id !== 0);

            if (validTileIds.length === 0) return;

            let currentIndex = validTileIds.indexOf(this.paintTexture);
            if (currentIndex === -1) currentIndex = 0;

            if (event.deltaY > 0) {
                currentIndex++;
            } else {
                currentIndex--;
            }

            if (currentIndex >= validTileIds.length) currentIndex = 0;
            if (currentIndex < 0) currentIndex = validTileIds.length - 1;

            this.paintTexture = validTileIds[currentIndex];
            this.updateGUIBlock()
        }, { passive: true });

        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    setScreen(screen) {
        this.screen = screen;
        if (screen !== null) {
            document.exitPointerLock();
            screen.init(this, this.guiCanvas.width, this.guiCanvas.height);
        }
    }

    isFree(aabb) {
        if (this.player.bb.intersects(aabb))
            return false;
        for (let i = 0; i < this.entities.length; i++) {
            if ((this.entities[i]).bb.intersects(aabb))
                return false;
        }
        return true;
    }

    async generateNewLevel() {
        this.setScreen(new LevelGenScreen());

        this.screen.setTitle("Generating level");

        if (this.levelRenderer) {
            for (let i = 0; i < this.levelRenderer.chunks.length; i++) {
                const chunk = this.levelRenderer.chunks[i];
                this.scene.remove(chunk.meshes[0]);
                this.scene.remove(chunk.meshes[1]);
            }
        }

        this.level = new Level(256, 32, 70);

        this.levelRenderer = new LevelRenderer(this.level, this.scene);
        this.particleEngine = new ParticleEngine(this.level, this.scene, this.level.texture);
        this.level.particleEngine = this.particleEngine;

        const generator = new LevelGen(this.screen);
        await generator.generateLevel(this.level, "Player", 256, 32, 70);

        this.player = new Player(this.level);
        this.player.level = this.level;
        this.player.resetPos();

        this.entities.forEach(e => this.scene.remove(e.group));
        this.entities = [];

        for (let i = 0; i < 10; i++) {
            const zombie = new Zombie(this.level, 128, 64, 127, this.scene);
            zombie.resetPos();
            this.entities.push(zombie);
        }

        this.render(true);

        this.setScreen(null);
    }

    tick() {
        this.level.tick();
        this.particleEngine.tick();

        this.entities.forEach(e => {
            e.tick();

            if (e.removed) {
                this.scene.remove(e.group);
                this.entities.splice(this.entities.indexOf(e), 1);
            }
        });

        if (this.leftMouseButtonDown) {
            if (!this.lastBuildTime) {
                this.lastBuildTime = performance.now();
            } else {
                const elapsed = performance.now() - this.lastBuildTime;
                if (elapsed > 200) {
                    const hit = this.levelRenderer.pick(5.0, this.camera);

                    if (hit) {
                        let x = hit.x;
                        let y = hit.y;
                        let z = hit.z;

                        if (hit.f === 0) y--;
                        if (hit.f === 1) y++;
                        if (hit.f === 2) z--;
                        if (hit.f === 3) z++;
                        if (hit.f === 4) x--;
                        if (hit.f === 5) x++;

                        const playerAABB = this.player.bb;
                        const tileAABB = new AABB(x, y, z, x + 1, y + 1, z + 1);

                        if (this.isFree(tileAABB)) {
                            this.lastBuildTime = 0;
                            this.level.setTile(x, y, z, this.paintTexture);
                        }
                    }
                }
            }
        } else {
            this.lastBuildTime = 200;
        }

        if (this.rightMouseButtonDown) {
            if (!this.lastMineTime) {
                this.lastMineTime = performance.now();
            } else {
                const elapsed = performance.now() - this.lastMineTime;
                if (elapsed > 200) {
                    const hit = this.levelRenderer.pick(5.0, this.camera);

                    if (hit) {
                        const oldTile = Tile.tiles[this.level.getTile(hit.x, hit.y, hit.z)];
                        const changed = this.level.setTile(hit.x, hit.y, hit.z, 0);
                        if (oldTile != null && changed) {
                            this.lastMineTime = 0;
                            oldTile.destroy(this.level, hit.x, hit.y, hit.z, this.particleEngine);
                        }
                    }
                }
            }
        } else {
            this.lastMineTime = 200;
        }

        this.player.tick(this.camera);
    }

    render(skippause = false) {
        this.moveCameraToPlayer();

        if (!this.pause || skippause) {
            if (this.levelRenderer) {
                const hit = this.levelRenderer.pick(5.0, this.camera);
                if (hit) {
                    this.levelRenderer.renderHit(hit, 0, 0xFFFFFF, (Math.sin(performance.now() / 110.0) * 0.2 + 0.5) / 1.7);
                }
            }

            this.levelRenderer.updateDirtyChunks(this.player)

            this.levelRenderer.render(this.player, 0);
            this.levelRenderer.render(this.player, 1);

            this.particleEngine.render(this.player, this.timer.a);

            this.entities.forEach(e => e.render(this.timer.a));

            this.levelRenderer.renderSurroundingGround();
            this.levelRenderer.renderSurroundingWater();

            this.renderer.render(this.scene, this.camera);

            if (this.levelRenderer && this.levelRenderer.selectionMesh) {
                this.levelRenderer.selectionMesh.visible = false;
            }
        }

        this.renderGUI(skippause);
    }

    moveCameraToPlayer() {
        this.camera.rotation.set(
            THREE.MathUtils.degToRad(this.player.xRot),
            THREE.MathUtils.degToRad(this.player.yRot),
            0,
            'YXZ'
        );

        const a = this.timer.a;
        const x = this.player.xo + (this.player.x - this.player.xo) * a;
        const y = this.player.yo + (this.player.y - this.player.yo) * a;
        const z = this.player.zo + (this.player.z - this.player.zo) * a;

        this.camera.position.set(x, y, z);
        this.camera.translateZ(0.3);
    }
}

const game = new Minecraft();
await game.run();