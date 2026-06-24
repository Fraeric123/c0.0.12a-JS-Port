import { Tile } from './Tile.js';

export class BushTile extends Tile {
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