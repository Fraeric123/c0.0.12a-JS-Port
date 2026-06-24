import { Tile } from './Tile.js';

export class GrassTile extends Tile {
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