import { AABB } from '../../phys/AABB.js';

export class Tile {
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