import * as THREE from '../../libs/three.module.js';
import { JavaRandom } from '../JavaRandom.js';
import { Textures } from '../render/Textures.js';
import { Tile } from './tile/Tile.js';

export class Level {
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