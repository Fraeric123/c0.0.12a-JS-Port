import { Tile } from './Tile.js';

export class LiquidTile extends Tile {
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