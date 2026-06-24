import { LiquidTile } from './LiquidTile.js';
import { Tile } from './Tile.js';

export class CalmLiquidTile extends LiquidTile {
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